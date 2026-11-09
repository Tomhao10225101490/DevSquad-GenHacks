import {z} from 'zod';
import {setTimeout as delay} from 'node:timers/promises';

export interface ModelConfig {baseUrl:string;model:string;apiKey:string;maxOutputTokens:number;requestTimeoutMs:number;}
export function modelConfig(env:NodeJS.ProcessEnv=process.env):ModelConfig {
 const base=new URL(env.DEVSQUAD_BASE_URL??'https://chat.ecnu.edu.cn/open/api/v1');
 if(base.username||base.password||base.search||base.hash||!(base.protocol==='https:'||(base.protocol==='http:'&&['127.0.0.1','localhost'].includes(base.hostname))))throw Error('Model URL must use HTTPS, or HTTP on loopback, without credentials or query parameters.');
 const apiKey=env.DEVSQUAD_API_KEY?.trim(),model=env.DEVSQUAD_MODEL?.trim();
 if(!apiKey||apiKey.length>4096||/[\r\n]/.test(apiKey))throw Error('Configure DEVSQUAD_API_KEY in the server environment or .env.local.');
 if(!model||model.length>200||/[\r\n]/.test(model))throw Error('Configure DEVSQUAD_MODEL explicitly.');
 return {baseUrl:base.href.replace(/\/$/,''),model,apiKey,maxOutputTokens:4096,requestTimeoutMs:60_000};
}
export interface FunctionTool {type:'function';function:{name:string;description:string;parameters:Record<string,unknown>;};}
export interface ToolCall {id:string;type:'function';function:{name:string;arguments:string;};}
export type Message={role:'system'|'user';content:string}|{role:'assistant';content:string|null;tool_calls?:ToolCall[]}|{role:'tool';content:string;tool_call_id:string};
export interface Usage {inputTokens:number;outputTokens:number;totalTokens:number;cachedInputTokens:number|null;}
export interface ModelAttempt {attempt:number;durationMs:number;status:number|null;usage:Usage|null;outcome:'success'|'retry'|'failure';}
export interface Completion {message:{role:'assistant';content:string|null;tool_calls?:ToolCall[]};usage:Usage|null;finishReason:string;}
const integer=z.number().int().nonnegative();
const toolCall=z.object({id:z.string().min(1).max(200),type:z.literal('function'),function:z.object({name:z.string().min(1).max(80),arguments:z.string().max(100_000)})});
const responseSchema=z.object({choices:z.array(z.object({finish_reason:z.string(),message:z.object({role:z.literal('assistant'),content:z.string().max(150_000).nullable().optional(),tool_calls:z.array(toolCall).max(8).optional(),refusal:z.string().nullable().optional()})})).min(1).max(1),usage:z.object({prompt_tokens:integer,completion_tokens:integer,total_tokens:integer,prompt_tokens_details:z.object({cached_tokens:integer.optional()}).optional(),prompt_cache_hit_tokens:integer.optional()}).nullable().optional()});
class HttpFailure extends Error {status:number;constructor(status:number){super(`Model API returned HTTP ${status}.`);this.status=status;}}
async function boundedJson(response:Response):Promise<unknown>{
 if(!response.body)throw Error('Model API returned an empty response.');const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>1_000_000)throw Error('Model API response exceeded 1 MB.');chunks.push(part.value);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}finally{await reader.cancel().catch(()=>{});}
}
/** A server-only, non-streaming model call; validated results stream through our retained SSE events. */
export class ModelClient {
 private config:ModelConfig;
 constructor(config:ModelConfig){this.config=config;}
 async complete(messages:Message[],tools:FunctionTool[],signal:AbortSignal,onAttempt:(attempt:ModelAttempt)=>void=()=>{}):Promise<Completion>{
  signal.throwIfAborted();const names=new Set(tools.map(t=>t.function.name));if(names.size!==tools.length)throw Error('Duplicate model tool name.');
  const body=JSON.stringify({model:this.config.model,messages,tools,tool_choice:'auto',parallel_tool_calls:false,stream:false,max_tokens:this.config.maxOutputTokens});
  if(Buffer.byteLength(body)>180_000)throw Error('Model context exceeded the configured input budget.');
  for(let attempt=1;attempt<=3;attempt++){
   const start=Date.now();let status:number|null=null,usage:Usage|null=null;
   try{
    const requestSignal=AbortSignal.any([signal,AbortSignal.timeout(this.config.requestTimeoutMs)]);
    const response=await fetch(this.config.baseUrl+'/chat/completions',{method:'POST',redirect:'error',headers:{Authorization:'Bearer '+this.config.apiKey,'Content-Type':'application/json'},body,signal:requestSignal});status=response.status;
    if(!response.ok){await response.body?.cancel();throw new HttpFailure(response.status);}
    const parsed=responseSchema.parse(await boundedJson(response)),choice=parsed.choices[0],raw=parsed.usage;
    if(raw){const cached=raw.prompt_tokens_details?.cached_tokens??raw.prompt_cache_hit_tokens??null;if(raw.total_tokens<raw.prompt_tokens+raw.completion_tokens||(cached!==null&&cached>raw.prompt_tokens))throw Error('Model usage counters are inconsistent.');usage={inputTokens:raw.prompt_tokens,outputTokens:raw.completion_tokens,totalTokens:raw.total_tokens,cachedInputTokens:cached};}
    const message=choice.message;
    if(message.refusal)throw Error('The model declined this request.');
    if(!['stop','tool_calls'].includes(choice.finish_reason))throw Error('The model response was truncated or did not complete.');
    if(!message.content&&!message.tool_calls?.length)throw Error('The model returned no content or tool calls.');
    const ids=new Set<string>();for(const call of message.tool_calls??[]){if(!names.has(call.function.name)||ids.has(call.id))throw Error('The model requested an unavailable tool or reused a tool-call ID.');ids.add(call.id);const args=JSON.parse(call.function.arguments);if(!args||typeof args!=='object'||Array.isArray(args))throw Error('Tool arguments must be a JSON object.');}
    onAttempt({attempt,durationMs:Date.now()-start,status,usage,outcome:'success'});
    return {message:{role:'assistant',content:message.content??null,...(message.tool_calls?.length?{tool_calls:message.tool_calls}:{})},usage,finishReason:choice.finish_reason};
   }catch(error){
    const retry=!signal.aborted&&error instanceof HttpFailure&&[429,500,502,503,504].includes(error.status)&&attempt<3;
    onAttempt({attempt,durationMs:Date.now()-start,status,usage,outcome:retry?'retry':'failure'});
    if(signal.aborted)throw signal.reason;
    if(!retry){if(error instanceof HttpFailure)throw error;throw Error('Model call failed validation, exceeded its timeout, or could not reach the configured endpoint.');}
    await delay(500*2**(attempt-1),undefined,{signal});
   }
  }
  throw Error('Model retry budget exhausted.');
 }
}
