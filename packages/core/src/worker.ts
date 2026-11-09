import type {Phase,Role,RunEvent} from './index.ts';
export type ExecutablePhase=Exclude<Phase,'READY'>;
export type RunStatus='PAUSED'|'RUNNING'|'DONE'|'ESCALATED';
export type SampleId='path-guard'|'retry-queue'|'ttl-cache';
export interface WorkerRun {
 id:string; sampleId:SampleId; mode:'fixture-verification'|'agent'; phase:ExecutablePhase; status:RunStatus;
 version:number; repairCount:number; maxRepairs:number; pauseRequested:boolean;
 createdAt:string; updatedAt:string; activeMs:number; activeSince:number|null; timeoutMs:number;
 checkpoint:Record<string,unknown>; lastSeq:number;
}
export interface WorkerEvent extends RunEvent {runId:string;kind:string;}
export interface WorkerSnapshot {run:WorkerRun;events:WorkerEvent[];}
export const phaseRole:Record<ExecutablePhase,Role>={PLAN:'planner',IMPLEMENT:'coder',TEST:'tester',REVIEW:'reviewer',REPAIR:'coder',DONE:'system',ESCALATE:'system'};
export const workerDisclosure='Live delivery of a trusted fixture verification. Candidate fixes are authored in advance; no autonomous role-model calls or container isolation are claimed in M2.';
