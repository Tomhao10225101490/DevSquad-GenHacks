import Database from 'better-sqlite3';import {randomUUID} from 'node:crypto';
import type {WorkerRun,WorkerEvent,SampleId} from '../../core/src/worker.ts';
import {eventSchema,finiteJson,sampleSchema,type EventInput} from './schema.ts';
export class Store {
 readonly db:Database.Database;
 private listeners=new Map<string,Set<()=>void>>();
 constructor(path:string){this.db=new Database(path);this.db.pragma('journal_mode = WAL');this.db.pragma('foreign_keys = ON');this.db.pragma('busy_timeout = 3000');
  this.db.exec(`CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,state TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS events(run_id TEXT NOT NULL REFERENCES runs(id),seq INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(run_id,seq));
   CREATE TABLE IF NOT EXISTS artifacts(run_id TEXT NOT NULL REFERENCES runs(id),name TEXT NOT NULL,mime TEXT NOT NULL,content TEXT NOT NULL,PRIMARY KEY(run_id,name));
   PRAGMA user_version=1;`);
 }
 create(sampleId:SampleId,options:{maxRepairs?:number;timeoutMs?:number;mode?:'fixture-verification'|'agent'}={}):WorkerRun {
  sampleSchema.parse(sampleId);const {maxRepairs=3,timeoutMs=120_000,mode='fixture-verification'}=options;
  if(!Number.isInteger(maxRepairs)||maxRepairs<0||maxRepairs>3||!Number.isInteger(timeoutMs)||timeoutMs<20||timeoutMs>600_000)throw Error('Invalid execution limits.');
  const date=new Date().toISOString(),run:WorkerRun={id:randomUUID(),sampleId,mode,phase:'PLAN',status:'PAUSED',version:0,repairCount:0,maxRepairs,pauseRequested:false,createdAt:date,updatedAt:date,activeMs:0,activeSince:null,timeoutMs,checkpoint:{},lastSeq:0};
  this.db.prepare('INSERT INTO runs VALUES(?,?)').run(run.id,JSON.stringify(run));
  return this.commit(run.id,()=>{},[{kind:'run.created',role:'system',type:'note',title:'Verification workspace reserved',detail:mode==='agent'?'Paused before PLAN. The configured role model will solve a bundled issue inside restricted containers.':'Paused before PLAN. Only an authored bundled fixture can be executed; no model API is connected.'}]);
 }
 get(id:string):WorkerRun {const row=this.db.prepare('SELECT state FROM runs WHERE id=?').get(id) as {state:string}|undefined;if(!row)throw new NotFound('Run not found.');return JSON.parse(row.state);}
 list(limit=20):WorkerRun[]{return (this.db.prepare('SELECT state FROM runs ORDER BY rowid DESC LIMIT ?').all(Math.min(100,Math.max(1,limit))) as {state:string}[]).map(r=>JSON.parse(r.state));}
 commit(id:string,update:(run:WorkerRun)=>void,events:EventInput[]=[],artifacts:{name:string;mime:string;content:string}[]=[]):WorkerRun {
  const inputs=events.map(e=>eventSchema.parse(e));
  const result=this.db.transaction(()=>{const run=this.get(id);update(run);run.updatedAt=new Date().toISOString();run.version++;
   for(const event of inputs){const seq=++run.lastSeq,full:WorkerEvent={...event,runId:id,seq,timestamp:new Date().toISOString(),elapsedMs:Math.max(0,Date.now()-Date.parse(run.createdAt))};this.db.prepare('INSERT INTO events VALUES(?,?,?)').run(id,seq,finiteJson(full,150_000));}
   for(const a of artifacts){if(!/^[a-z0-9._-]{1,80}$/.test(a.name)||Buffer.byteLength(a.content)>500_000)throw Error('Invalid or oversized artifact.');this.db.prepare('INSERT INTO artifacts VALUES(?,?,?,?) ON CONFLICT(run_id,name) DO UPDATE SET mime=excluded.mime,content=excluded.content').run(id,a.name,a.mime,a.content);}
   this.db.prepare('UPDATE runs SET state=? WHERE id=?').run(finiteJson(run,150_000),id);return run;
  }).immediate();
  for(const listener of this.listeners.get(id)??[]){try{listener();}catch{/* A disconnected observer cannot undo a committed run. */}}
  return result;
 }
 append(id:string,event:EventInput){return this.commit(id,()=>{},[event]);}
 events(id:string,after=0,limit=100):WorkerEvent[]{if(!Number.isSafeInteger(after)||after<0)throw Error('Invalid event cursor.');return (this.db.prepare('SELECT data FROM events WHERE run_id=? AND seq>? ORDER BY seq LIMIT ?').all(id,after,Math.min(500,Math.max(1,limit))) as {data:string}[]).map(x=>JSON.parse(x.data));}
 artifact(id:string,name:string):{mime:string;content:string}{this.get(id);const a=this.db.prepare('SELECT mime,content FROM artifacts WHERE run_id=? AND name=?').get(id,name) as {mime:string;content:string}|undefined;if(!a)throw new NotFound('Artifact not found.');return a;}
 subscribe(id:string,listener:()=>void){let listeners=this.listeners.get(id);if(!listeners){listeners=new Set();this.listeners.set(id,listeners);}listeners.add(listener);return()=>{listeners!.delete(listener);if(!listeners!.size)this.listeners.delete(id);};}
 recoverInterrupted():number {let recovered=0;for(const {state} of this.db.prepare('SELECT state FROM runs').all() as {state:string}[]){const run:WorkerRun=JSON.parse(state);if(run.status!=='RUNNING')continue;this.commit(run.id,r=>{if(r.activeSince!==null)r.activeMs+=Math.max(0,Date.now()-r.activeSince);r.activeSince=null;r.status='PAUSED';r.pauseRequested=false;},[{kind:'run.interrupted',role:'system',type:'note',title:'Worker restart recovered the checkpoint',detail:'The run is paused at the last committed phase. Resume explicitly; an interrupted phase may be repeated idempotently.'}]);recovered++;}return recovered;}
 close(){this.listeners.clear();this.db.close();}
}
export class NotFound extends Error {}
