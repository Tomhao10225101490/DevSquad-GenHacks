import type {WorkerEvent} from './worker.ts';
export function parseWorkerEndpoint(input:string):string|null {try{const u=new URL(input);if(u.protocol!=='http:'||!['127.0.0.1','localhost'].includes(u.hostname)||u.username||u.password||u.pathname!=='/'||u.search||u.hash||!u.port||Number(u.port)<1024)return null;return u.origin;}catch{return null;}}
export class SseDecoder {
 private buffer='';
 push(chunk:string):{id:string;event:string;data:string}[]{this.buffer+=chunk;this.buffer=this.buffer.replaceAll('\r\n','\n');const frames=[];let end:number;
  while((end=this.buffer.indexOf('\n\n'))>=0){const block=this.buffer.slice(0,end);this.buffer=this.buffer.slice(end+2);let id='',event='message';const data:string[]=[];for(const line of block.split('\n')){if(line.startsWith(':'))continue;const split=line.indexOf(':');const name=split<0?line:line.slice(0,split);let value=split<0?'':line.slice(split+1);if(value.startsWith(' '))value=value.slice(1);if(name==='id')id=value;else if(name==='event')event=value;else if(name==='data')data.push(value);}if(data.length)frames.push({id,event,data:data.join('\n')});}
  if(this.buffer.length>256_000)throw Error('Event stream frame exceeds 256 KB.');return frames;
 }
}
export function parseWorkerEvent(data:string,runId:string):WorkerEvent {const e=JSON.parse(data) as WorkerEvent;
 if(!e||e.runId!==runId||!Number.isSafeInteger(e.seq)||e.seq<1||!Number.isFinite(e.elapsedMs)||e.elapsedMs<0||typeof e.kind!=='string'||typeof e.title!=='string'||typeof e.detail!=='string'||e.title.length>200||e.detail.length>100_000||!['system','planner','coder','tester','reviewer'].includes(e.role)||!['phase','note','tool','file','tests','review','finish'].includes(e.type))throw Error('Worker event failed validation.');return e;
}
