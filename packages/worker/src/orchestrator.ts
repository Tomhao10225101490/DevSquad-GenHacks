import {phaseRole,type ExecutablePhase,type WorkerRun} from '../../core/src/worker.ts';
import type {EventInput,PhaseOutcome} from './schema.ts';import {outcomeSchema,finiteJson} from './schema.ts';import {Store} from './store.ts';
export interface PhaseContext {run:WorkerRun;signal:AbortSignal;emit:(event:Omit<EventInput,'role'>)=>void;artifact:(name:string,mime:string,content:string)=>void;}
export interface Executor {execute(phase:ExecutablePhase,context:PhaseContext):Promise<PhaseOutcome>;}
export function nextPhase(phase:ExecutablePhase,outcome:PhaseOutcome,repairs:number,maxRepairs:number):{phase:ExecutablePhase;repairs:number}{
 if(['DONE','ESCALATE'].includes(phase))throw Error('Terminal phases cannot execute.');
 if(phase==='PLAN'&&outcome.verdict==='continue')return {phase:'IMPLEMENT',repairs};
 if((phase==='IMPLEMENT'||phase==='REPAIR')&&outcome.verdict==='continue')return {phase:'TEST',repairs};
 if(phase==='TEST'&&outcome.verdict==='pass')return {phase:'REVIEW',repairs};
 if(phase==='REVIEW'&&outcome.verdict==='approve')return {phase:'DONE',repairs};
 if((phase==='TEST'&&outcome.verdict==='fail')||(phase==='REVIEW'&&outcome.verdict==='changes_requested'))return repairs<maxRepairs?{phase:'REPAIR',repairs:repairs+1}:{phase:'ESCALATE',repairs};
 throw Error(`Invalid ${outcome.verdict} outcome for ${phase}.`);
}
export class Orchestrator {
 private active=new Map<string,{promise:Promise<void>;controller:AbortController}>();
 readonly store:Store;readonly executor:Executor;
 constructor(store:Store,executor:Executor){this.store=store;this.executor=executor;}
 start(id:string):WorkerRun {
  const run=this.store.get(id);if(run.status!=='PAUSED'||this.active.has(id))throw new Conflict('Run is already active or terminal.');
  const remaining=run.timeoutMs-run.activeMs;if(remaining<=0)return this.escalate(id,'Runtime budget exhausted.');
  const current=this.store.commit(id,r=>{r.status='RUNNING';r.pauseRequested=false;r.activeSince=Date.now();},[{kind:'run.started',role:'system',type:'note',title:run.lastSeq>1?'Run resumed from its checkpoint':'Run started',detail:'Live trusted-fixture verification. No LLM role calls or external repository execution.'}]);
  const controller=new AbortController();const promise=Promise.resolve().then(()=>this.loop(id,controller)).finally(()=>this.active.delete(id));this.active.set(id,{promise,controller});return current;
 }
 pause(id:string):WorkerRun {const r=this.store.get(id);if(r.status==='PAUSED')return r;if(r.status!=='RUNNING')throw new Conflict('A terminal run cannot be paused.');return this.store.commit(id,r=>{r.pauseRequested=true;},[{kind:'run.pause_requested',role:'system',type:'note',title:'Pause requested',detail:'The current phase will finish before a durable pause. No later phase is started.'}]);}
 private settle(run:WorkerRun){if(run.activeSince!==null)run.activeMs+=Math.max(0,Date.now()-run.activeSince);run.activeSince=null;}
 private escalate(id:string,reason:string):WorkerRun{return this.store.commit(id,r=>{this.settle(r);r.phase='ESCALATE';r.status='ESCALATED';r.pauseRequested=false;},[{kind:'guardrail.triggered',role:'system',type:'finish',phase:'ESCALATE',title:'Run escalated',detail:reason}]);}
 private async loop(id:string,controller:AbortController) {
  const run=this.store.get(id),timer=setTimeout(()=>controller.abort(Error('Global runtime budget exceeded.')),Math.max(1,run.timeoutMs-run.activeMs));
  try {while(true){let run=this.store.get(id);if(run.status!=='RUNNING')return;
    if(run.pauseRequested){this.store.commit(id,r=>{this.settle(r);r.status='PAUSED';r.pauseRequested=false;},[{kind:'run.paused',role:'system',type:'note',title:'Paused at a durable checkpoint',detail:`Next phase: ${run.phase}. Resume will not repeat a completed phase.`}]);return;}
    controller.signal.throwIfAborted();const phase=run.phase,role=phaseRole[phase];this.store.append(id,{kind:'phase.started',role,type:'phase',phase,title:`${phase} started`,detail:'Executed by the trusted fixture verifier, not an autonomous model.'});
    const outcome=outcomeSchema.parse(await this.executor.execute(phase,{run,signal:controller.signal,emit:event=>{controller.signal.throwIfAborted();this.store.append(id,{...event,role});},artifact:(name,mime,content)=>{controller.signal.throwIfAborted();this.store.commit(id,()=>{},[],[{name,mime,content}]);}}));controller.signal.throwIfAborted();finiteJson(outcome.checkpoint);
    const next=nextPhase(phase,outcome,run.repairCount,run.maxRepairs);this.store.commit(id,r=>{if(r.phase!==phase||r.status!=='RUNNING')throw new Conflict('Phase checkpoint changed unexpectedly.');r.phase=next.phase;r.repairCount=next.repairs;r.checkpoint={...r.checkpoint,...outcome.checkpoint};if(next.phase==='DONE'||next.phase==='ESCALATE'){this.settle(r);r.status=next.phase==='DONE'?'DONE':'ESCALATED';r.pauseRequested=false;}},[{kind:'phase.completed',role,type:'note',title:`${phase} checkpoint committed`,detail:outcome.summary},...(next.phase==='DONE'||next.phase==='ESCALATE'?[{kind:'run.finished',role:'system' as const,type:'finish' as const,phase:next.phase,title:next.phase==='DONE'?'Verified run completed':'Repair budget exhausted',detail:next.phase==='DONE'?'Source, tests and patch evidence are retained in SQLite.':'The bounded repair limit was reached. Inspect the evidence before continuing manually.'}]:[])]);
    if(next.phase==='DONE'||next.phase==='ESCALATE')return;
   }}catch(error){const message=error instanceof Error?error.message:'Unknown execution failure';const run=this.store.get(id);if(run.status==='RUNNING')this.escalate(id,message);}finally{clearTimeout(timer);}
 }
 async idle(id:string){await this.active.get(id)?.promise;}
 async shutdown(){for(const [id]of this.active){const run=this.store.get(id);if(run.status==='RUNNING')this.pause(id);}await Promise.all([...this.active.values()].map(x=>x.promise));}
}
export class Conflict extends Error {}
