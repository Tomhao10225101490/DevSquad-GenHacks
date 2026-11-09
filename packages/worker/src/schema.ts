import {z} from 'zod';
export const sampleSchema=z.enum(['path-guard','retry-queue','ttl-cache']);
export const phaseSchema=z.enum(['PLAN','IMPLEMENT','TEST','REVIEW','REPAIR','DONE','ESCALATE']);
export const eventSchema=z.object({
 kind:z.string().min(1).max(80),role:z.enum(['planner','coder','reviewer','tester','system']),type:z.enum(['phase','note','tool','file','tests','review','finish']),
 title:z.string().min(1).max(200),detail:z.string().max(100_000),phase:phaseSchema.optional(),tool:z.string().max(80).optional(),exitCode:z.number().int().optional(),durationMs:z.number().nonnegative().optional(),stage:z.enum(['baseline','after']).optional(),passed:z.number().int().nonnegative().optional(),failed:z.number().int().nonnegative().optional(),path:z.string().max(300).optional(),content:z.string().max(100_000).optional()
}).strict();
export const createSchema=z.object({sampleId:sampleSchema}).strict();
export const outcomeSchema=z.object({verdict:z.enum(['continue','pass','fail','approve','changes_requested']),summary:z.string().max(4000),checkpoint:z.record(z.string(),z.unknown()).default({})}).strict();
export type EventInput=z.infer<typeof eventSchema>;
export type PhaseOutcome=z.infer<typeof outcomeSchema>;
export function finiteJson(value:unknown,maxBytes=100_000):string {const text=JSON.stringify(value,(_key,item)=>{if((typeof item==='number'&&!Number.isFinite(item))||['function','symbol','bigint'].includes(typeof item))throw Error('Only finite JSON data may be retained.');return item;});if(text===undefined||Buffer.byteLength(text)>maxBytes)throw Error('Checkpoint or artifact exceeds its storage limit.');return text;}
