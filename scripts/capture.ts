import {mkdtemp,readFile,writeFile,mkdir,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
import type {Recording,RunEvent,Role,Phase} from '../packages/core/src/index.ts';
const root=resolve(import.meta.dirname,'..'),output=join(root,'apps/web/public/recordings');await mkdir(output,{recursive:true});
for(const slug of ['path-guard','retry-queue','ttl-cache']) {
 const source=join(root,'samples',slug),workspace=await mkdtemp(join(tmpdir(),'devsquad-capture-'));
 const issue=JSON.parse(await readFile(join(source,'issue.json'),'utf8')),before=await readFile(join(source,'src/index.ts'),'utf8'),after=await readFile(join(source,'fixed.ts'),'utf8'),tests=await readFile(join(source,'index.test.ts'),'utf8');
 const start=Date.now(),events:RunEvent[]=[];
 const emit=(role:Role,type:RunEvent['type'],title:string,detail:string,extra:Partial<RunEvent>={})=>events.push({seq:events.length+1,timestamp:new Date().toISOString(),elapsedMs:Date.now()-start,role,type,title,detail,...extra});
 const phase=(value:Phase,role:Role,title:string)=>emit(role,'phase',title,'Recorded engineering verification; role labels organize the evidence, not independent LLM calls.',{phase:value});
 const command=(args:string[])=>{const t=Date.now();const r=spawnSync(args[0],args.slice(1),{cwd:workspace,encoding:'utf8',timeout:15000,maxBuffer:256*1024,env:{PATH:process.env.PATH,LANG:'C.UTF-8',NO_COLOR:'1'}});if(r.error)throw r.error;return {exitCode:r.status??1,output:(r.stdout+r.stderr).replaceAll(workspace,'/workspace').replaceAll(root,'/project'),durationMs:Date.now()-t};};
 try {
  await mkdir(join(workspace,'src'));for(const file of ['package.json','index.test.ts'])await writeFile(join(workspace,file),await readFile(join(source,file)));
  await writeFile(join(workspace,'src/index.ts'),before);command(['git','init','-q']);command(['git','add','.']);
  phase('PLAN','planner','Ada scopes the issue');emit('planner','note','Keep the change small',issue.body+'\n\nRecord the failing baseline, edit only src/index.ts, rerun the same tests and verify the patch.');
  emit('coder','tool','Read src/index.ts',before,{tool:'read_file',path:'src/index.ts'});
  emit('tester','tool','Run the baseline test command',issue.testCommand.join(' '),{tool:'run_tests'});
  const baseline=command(issue.testCommand);const counts=(output:string)=>({passed:Number(output.match(/# pass (\d+)/)?.[1]??0),failed:Number(output.match(/# fail (\d+)/)?.[1]??0)});
  if(baseline.exitCode===0||!counts(baseline.output).failed)throw Error(slug+': baseline must genuinely fail');
  emit('tester','tests','Baseline confirms the defect',baseline.output,{stage:'baseline',...counts(baseline.output),exitCode:baseline.exitCode,durationMs:baseline.durationMs});
  phase('IMPLEMENT','coder','Theo applies the scoped fix');await writeFile(join(workspace,'src/index.ts'),after);
  emit('coder','file','Edit src/index.ts','Applied the Codex-authored candidate fix to the temporary workspace.',{tool:'edit_file',path:'src/index.ts',content:after});
  const diff=command(['git','diff','--no-ext-diff','--','src/index.ts']);if(!diff.output.trim())throw Error('Missing diff');
  emit('coder','tool','Inspect the unified diff',diff.output,{tool:'run_command',exitCode:diff.exitCode,durationMs:diff.durationMs});
  phase('TEST','tester','Jules runs the same test suite');const result=command(issue.testCommand);if(result.exitCode!==0||counts(result.output).failed)throw Error(slug+': fixed tests did not pass');
  emit('tester','tests','The fixed test suite passes',result.output,{stage:'after',...counts(result.output),exitCode:result.exitCode,durationMs:result.durationMs});
  phase('REVIEW','reviewer','Maya inspects the captured evidence');
  if(await readFile(join(workspace,'index.test.ts'),'utf8')!==tests)throw Error('Tests were changed');
  const changed=command(['git','diff','--name-only']);if(changed.output.trim()!=='src/index.ts')throw Error('Unexpected file changes');
  emit('reviewer','review','Structural review passed','Deterministic M1 review: only src/index.ts changed; the original tests are byte-for-byte unchanged; the real baseline failed and the same test command now passes. This is not an LLM review.');
  command(['git','checkout','--','src/index.ts']);await writeFile(join(workspace,'candidate.patch'),diff.output);const applied=command(['git','apply','--check','candidate.patch']);if(applied.exitCode)throw Error('Patch does not apply');command(['git','apply','candidate.patch']);const roundtrip=command(issue.testCommand);if(roundtrip.exitCode)throw Error('Applied patch fails tests');
  emit('tester','tool','Verify the downloadable patch','git apply --check candidate.patch\ngit apply candidate.patch\n'+issue.testCommand.join(' ')+'\n\n'+roundtrip.output,{tool:'run_command',exitCode:roundtrip.exitCode,durationMs:roundtrip.durationMs});
  phase('DONE','system','Patch verified. Evidence ready.');
  const record:Recording={version:1,id:`engineering-${slug}-${new Date().toISOString().slice(0,10)}`,sampleId:slug,title:issue.title,issue:issue.body,capturedAt:new Date().toISOString(),provenance:'engineering-verification',disclosure:'Recorded engineering verification of a Codex-authored fix. Real filesystem, git diff and test processes. Role labels organize the trace; no autonomous role-model calls were made in this M1 capture.',runtime:process.version,testCommand:issue.testCommand.join(' '),baselineFiles:{'src/index.ts':before,'index.test.ts':tests},finalFiles:{'src/index.ts':after,'index.test.ts':tests},patch:diff.output,patchSha256:createHash('sha256').update(diff.output).digest('hex'),events,tokens:null,cost:null};
  await writeFile(join(output,slug+'.json'),JSON.stringify(record,null,2)+'\n');await writeFile(join(output,slug+'.patch'),diff.output);
  console.log(`${slug}: ${counts(baseline.output).failed} failing → ${counts(result.output).passed} passing; patch independently applied and verified.`);
 }finally{await rm(workspace,{recursive:true,force:true});}
}
