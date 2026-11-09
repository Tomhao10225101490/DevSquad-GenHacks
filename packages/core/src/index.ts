export type Role = 'planner' | 'coder' | 'tester' | 'reviewer' | 'system';
export type {ExecutablePhase,RunStatus,SampleId,WorkerRun,WorkerEvent,WorkerSnapshot} from './worker.ts';
export {phaseRole,workerDisclosure} from './worker.ts';
export type Phase = 'READY' | 'PLAN' | 'IMPLEMENT' | 'TEST' | 'REVIEW' | 'REPAIR' | 'DONE' | 'ESCALATE';
export type EventType = 'phase' | 'note' | 'tool' | 'file' | 'tests' | 'review' | 'finish';
export interface RunEvent {
  seq: number; timestamp: string; elapsedMs: number; role: Role; type: EventType;
  title: string; detail: string; phase?: Phase; tool?: string; exitCode?: number;
  durationMs?: number; stage?: 'baseline' | 'after'; passed?: number; failed?: number;
  path?: string; content?: string;
}
export interface Recording {
  version: 1; id: string; sampleId: string; title: string; issue: string;
  capturedAt: string; provenance: 'engineering-verification';
  disclosure: string; runtime: string; testCommand: string;
  baselineFiles: Record<string,string>; finalFiles: Record<string,string>;
  patch: string; patchSha256: string; events: RunEvent[];
  tokens: null; cost: null;
}
export interface Sample { id:string; repo:string; issueNumber:number; title:string; description:string; tags:string[]; difficulty:string; recording:string; }
export const squad = [
  {id:'planner',name:'Ada',role:'Planner',initials:'AD',color:'#9aa6b7',job:'Break the issue into verifiable steps'},
  {id:'coder',name:'Theo',role:'Coder',initials:'TH',color:'#bfff3c',job:'Make the smallest defensible change'},
  {id:'tester',name:'Jules',role:'Tester',initials:'JU',color:'#d8b583',job:'Let the test process speak'},
  {id:'reviewer',name:'Maya',role:'Reviewer',initials:'MA',color:'#a9a3c5',job:'Inspect the evidence, not the promise'},
] as const;
export function replayState(record:Recording,index:number) {
  const end=Math.max(0,Math.min(record.events.length,Math.trunc(index)));
  let phase:Phase='READY',role:Role='system';
  const files={...record.baselineFiles};
  let baseline:{passed:number;failed:number}|null=null,after:{passed:number;failed:number}|null=null;
  for(const e of record.events.slice(0,end)) {
    role=e.role;if(e.phase)phase=e.phase;
    if(e.type==='file'&&e.path&&e.content!==undefined)files[e.path]=e.content;
    if(e.type==='tests'&&e.passed!==undefined&&e.failed!==undefined){const result={passed:e.passed,failed:e.failed};if(e.stage==='baseline')baseline=result;else after=result;}
  }
  return {phase,role,files,baseline,after,visible:record.events.slice(0,end),current:end?record.events[end-1]:null,done:phase==='DONE',index:end};
}
export function parseIssueUrl(input:string):{owner:string;repo:string;number:number;url:string}|null {
  try{const url=new URL(input.trim());if(url.protocol!=='https:'||url.hostname!=='github.com'||url.port||url.username||url.password||url.search||url.hash)return null;
    const match=url.pathname.match(/^\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/issues\/([1-9]\d*)\/?$/);
    if(!match||!Number.isSafeInteger(Number(match[3])))return null;return {owner:match[1],repo:match[2],number:Number(match[3]),url:`https://github.com/${match[1]}/${match[2]}/issues/${match[3]}`};
  }catch{return null;}
}
export function validateRecording(value:unknown):Recording {
  const r=value as Recording;
  if(!r||r.version!==1||r.provenance!=='engineering-verification'||!Array.isArray(r.events)||!r.events.length||typeof r.patch!=='string'||!r.baselineFiles||!r.finalFiles)throw Error('This recording is incomplete or unsupported.');
  r.events.forEach((e,i)=>{if(e.seq!==i+1||typeof e.title!=='string'||typeof e.detail!=='string'||!['phase','note','tool','file','tests','review','finish'].includes(e.type)||!Number.isFinite(e.elapsedMs))throw Error('The event sequence failed validation.');});
  if(r.events.at(-1)?.phase!=='DONE')throw Error('The verification recording did not finish.');
  return r;
}
