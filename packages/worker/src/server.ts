import {createServer,type IncomingMessage,type ServerResponse} from 'node:http';import {timingSafeEqual} from 'node:crypto';
import {Store,NotFound} from './store.ts';import {Orchestrator,Conflict} from './orchestrator.ts';import {createSchema} from './schema.ts';import {workerDisclosure} from '../../core/src/worker.ts';
export function createWorkerServer(store:Store,engine:Orchestrator,options:{token:string;origins?:string[];agentEnabled?:boolean}) {
 if(options.token.length<32)throw Error('Use an unpredictable worker token of at least 32 characters.');
 const streams=new Set<ServerResponse>();const origins=new Set(options.origins??['http://127.0.0.1:8770','http://localhost:8770']);
 const json=(res:ServerResponse,code:number,data:unknown)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 const token=Buffer.from('Bearer '+options.token);const auth=(req:IncomingMessage)=>{const provided=Buffer.from(req.headers.authorization??'');return provided.length===token.length&&timingSafeEqual(provided,token);};
 const body=async(req:IncomingMessage)=>{if(req.headers['content-type']?.split(';')[0]!=='application/json')throw new BadRequest('Use application/json.');let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>4096)throw new BadRequest('Request body exceeds 4 KB.');}try{return JSON.parse(text);}catch{throw new BadRequest('Invalid JSON body.');}};
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');const address=server.address();const port=typeof address==='object'?address?.port:undefined;
  let url:URL;try{url=new URL(req.url??'/','http://'+req.headers.host);const host=new URL('http://'+req.headers.host);if(!['127.0.0.1','localhost'].includes(host.hostname)||Number(host.port)!==port||host.pathname!=='/')return json(res,403,{error:'Loopback Host required.'});}catch{return json(res,400,{error:'Invalid request URL.'});}
  const origin=req.headers.origin;
  if(origin&&!origins.has(origin)&&origin!==`http://127.0.0.1:${port}`&&origin!==`http://localhost:${port}`)return json(res,403,{error:'Origin is not allowed.'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Authorization, Content-Type, Last-Event-ID','Access-Control-Max-Age':'300'});res.end();return;}
  if(req.method==='GET'&&url.pathname==='/health')return json(res,200,{version:options.agentEnabled?3:2,mode:options.agentEnabled?'agent-capable':'fixture-verification',disclosure:options.agentEnabled?'Real role-model execution in restricted Docker containers, or explicitly selected trusted fixture verification.':workerDisclosure,autonomousModels:!!options.agentEnabled,sandbox:!!options.agentEnabled});
  if(!auth(req))return json(res,401,{error:'Worker authorization required.'});
  try{
   if(req.method==='GET'&&url.pathname==='/runs')return json(res,200,{runs:store.list()});
   if(req.method==='POST'&&url.pathname==='/runs'){const parsed=createSchema.safeParse(await body(req));if(!parsed.success)throw new BadRequest('Choose one of the three bundled sample IDs.');if(store.list(100).length>=100)throw new Conflict('This local worker retains at most 100 runs. Archive the database before starting another session.');if(parsed.data.mode==='agent'&&!options.agentEnabled)throw new BadRequest('Model execution is not configured on this worker.');return json(res,201,{run:store.create(parsed.data.sampleId,{mode:parsed.data.mode,timeoutMs:parsed.data.mode==='agent'?300_000:120_000})});}
   const route=url.pathname.match(/^\/runs\/([a-f0-9-]{36})(?:\/(events|resume|pause|artifacts)(?:\/([a-z0-9._-]{1,80}))?)?$/);
   if(!route)return json(res,404,{error:'Route not found.'});const [,id,action,name]=route;const run=store.get(id);
   if(req.method==='GET'&&!action)return json(res,200,{run});
   if(req.method==='POST'&&(action==='resume'||action==='pause')){await body(req);return json(res,200,{run:action==='resume'?engine.start(id):engine.pause(id)});}
   if(req.method==='GET'&&action==='artifacts'&&name){const a=store.artifact(id,name);res.writeHead(200,{'Content-Type':a.mime,'Content-Disposition':`attachment; filename="${name}"`,'Cache-Control':'no-store'});res.end(a.content);return;}
   if(req.method==='GET'&&action==='events'){
    const cursorValue=req.headers['last-event-id']??url.searchParams.get('after')??'0';if(typeof cursorValue!=='string'||!/^\d{1,10}$/.test(cursorValue))throw new BadRequest('Invalid event cursor.');let cursor=Number(cursorValue);if(cursor>run.lastSeq)throw new BadRequest('Event cursor exceeds the retained run.');if(streams.size>=16)throw new Conflict('Too many event streams.');
    res.writeHead(200,{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.flushHeaders();streams.add(res);res.write(': devsquad event stream\n\n');let blocked=false,closed=false,pumping=false;
    const pump=()=>{if(closed||blocked||pumping)return;pumping=true;try{for(;;){const events=store.events(id,cursor,100);if(!events.length)break;for(const event of events){if(closed)return;const ok=res.write(`id: ${event.seq}\nevent: run-event\ndata: ${JSON.stringify(event)}\n\n`);cursor=event.seq;if(!ok){blocked=true;return;}}if(events.length<100)break;}const current=store.get(id);if(['DONE','ESCALATED'].includes(current.status)&&cursor===current.lastSeq)res.end();}finally{pumping=false;}};
    const unsubscribe=store.subscribe(id,pump);const heartbeat=setInterval(()=>{if(!closed&&!blocked&&!res.write(': heartbeat\n\n'))blocked=true;},15000);
    res.on('drain',()=>{blocked=false;pump();});res.on('close',()=>{closed=true;clearInterval(heartbeat);unsubscribe();streams.delete(res);});res.on('error',()=>res.destroy());pump();return;
   }
   return json(res,405,{error:'Method not allowed.'});
  }catch(error){if(res.headersSent){res.destroy();return;}const code=error instanceof NotFound?404:error instanceof Conflict?409:error instanceof BadRequest?400:500;json(res,code,{error:code===500?'Worker operation failed. Inspect the local worker log.':(error as Error).message});}
 });
 server.maxConnections=40;server.requestTimeout=15000;server.headersTimeout=10000;
 return {server,close:async()=>{for(const res of streams)res.end();await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));}};
}
class BadRequest extends Error {}
