import {mkdir,open,readFile,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Store} from '../packages/worker/src/store.ts';
import {Orchestrator} from '../packages/worker/src/orchestrator.ts';
import {AgentExecutor} from '../packages/worker/src/agent-executor.ts';
import {ModelClient,modelConfig} from '../packages/worker/src/model.ts';
import {sampleSchema} from '../packages/worker/src/schema.ts';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
try{process.loadEnvFile(join(root,'.env.local'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
const config=modelConfig(),resume=process.argv[2]==='--resume'?process.argv[3]:null,sample=sampleSchema.parse(resume?'path-guard':process.argv[2]??'path-guard');if(resume&&!/^[a-f0-9-]{36}$/.test(resume))throw Error('Invalid resume ID.');
await mkdir(join(root,'.data'),{recursive:true,mode:0o700});
const lockPath=join(root,'.data','agent.lock');try{const old=Number(await readFile(lockPath,'utf8'));try{process.kill(old,0);throw Error('An agent CLI is already running.');}catch(e){if((e as NodeJS.ErrnoException).code!=='ESRCH')throw e;}await unlink(lockPath);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}const lock=await open(lockPath,'wx',0o600);await lock.writeFile(String(process.pid));await lock.close();
const store=new Store(join(root,'.data','agents.sqlite')),engine=new Orchestrator(store,new AgentExecutor(root,join(root,'.data','agent-workspaces'),new ModelClient(config)));
store.recoverInterrupted();const run=resume?store.get(resume):store.create(sample,{mode:'agent',timeoutMs:300_000});if(run.mode!=='agent'||run.status!=='PAUSED')throw Error('Resume requires a paused agent run.');let cursor=0;
const unsubscribe=store.subscribe(run.id,()=>{for(const event of store.events(run.id,cursor,500)){cursor=event.seq;console.log(JSON.stringify({seq:event.seq,role:event.role,kind:event.kind,title:event.title}));}});
console.log(JSON.stringify({runId:run.id,model:config.model,baseUrl:config.baseUrl,sample:run.sampleId,mode:'agent'}));
const stop=()=>{if(store.get(run.id).status==='RUNNING')engine.pause(run.id);};process.on('SIGINT',stop);process.on('SIGTERM',stop);
try{engine.start(run.id);await engine.idle(run.id);const final=store.get(run.id);console.log(JSON.stringify({status:final.status,phase:final.phase,events:final.lastSeq,repairCount:final.repairCount,checkpoint:final.checkpoint}));if(final.status!=='DONE')process.exitCode=1;}finally{process.off('SIGINT',stop);process.off('SIGTERM',stop);unsubscribe();store.close();await unlink(lockPath);}
