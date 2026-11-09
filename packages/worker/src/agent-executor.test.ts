import {it,expect} from 'vitest';
import {toolsForRole,finishForRole} from './agent-executor.ts';
it('separates source-edit authority from approval in both advertised schemas and runtime verdicts',()=>{
 const coder=toolsForRole('coder'),reviewer=toolsForRole('reviewer');expect(coder.some(t=>t.function.name==='edit_file')).toBe(true);expect(reviewer.some(t=>t.function.name==='edit_file')).toBe(false);expect(reviewer.some(t=>t.function.name==='run_command')).toBe(false);
 for(const role of ['coder','planner','tester'] as const){expect(()=>finishForRole(role,{summary:'I approve myself',verdict:'approve'})).toThrow('Role verdict guard');const p=toolsForRole(role).find(t=>t.function.name==='finish')!.function.parameters.properties as Record<string,{enum?:string[]}>;expect(p.verdict.enum).toEqual(['continue']);}
 expect(()=>finishForRole('reviewer',{summary:'No decision',verdict:'continue'})).toThrow('Role verdict guard');expect(finishForRole('reviewer',{summary:'Actual diff addresses the issue',verdict:'approve'}).verdict).toBe('approve');
});
