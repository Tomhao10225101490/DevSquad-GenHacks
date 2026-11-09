import {it,expect} from 'vitest';
import {mkdtemp,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {Sandbox,docker,validateToolPath} from './sandbox.ts';
it('rejects traversal, absolute paths, secrets and test edits before contacting Docker',()=>{
 for(const p of ['../secret','/etc/passwd','.env.local','src/../../secret','src/index.ts/extra'])expect(()=>validateToolPath(p)).toThrow('Path guard');
 expect(()=>validateToolPath('index.test.ts',true)).toThrow('protected');expect(()=>validateToolPath('package.json',true)).toThrow('protected');expect(validateToolPath('src/index.ts',true)).toBe('src/index.ts');
});
it.skipIf(process.env.DEVSQUAD_CONTAINER_TESTS!=='1')('enforces actual container isolation while source edits and the original tests work',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'devsquad-container-test-'));await cp(resolve('samples/path-guard'),dir,{recursive:true});const sandbox=new Sandbox(dir),signal=AbortSignal.timeout(25_000);
 try{await sandbox.start(signal);const inspect=await docker(['inspect',sandbox.name],signal),state=JSON.parse(inspect.output)[0];expect(state.HostConfig.NetworkMode).toBe('none');expect(state.HostConfig.ReadonlyRootfs).toBe(true);expect(state.HostConfig.CapDrop).toContain('ALL');expect(state.HostConfig.Memory).toBe(256*1024*1024);expect(state.HostConfig.NanoCpus).toBe(1_000_000_000);expect(state.HostConfig.PidsLimit).toBe(64);
  const probe=await docker(['exec',sandbox.name,'node','-e',`const fs=require('node:fs');const r={key:!!process.env.DEVSQUAD_API_KEY,host:fs.existsSync('/Users/a1')};for(const p of ['/root/probe','/workspace/index.test.ts','/workspace/package.json']){try{fs.writeFileSync(p,'bad');r[p]='WRITABLE';}catch(e){r[p]=e.code;}}fetch('https://example.com',{signal:AbortSignal.timeout(1000)}).then(()=>{r.network=true;console.log(JSON.stringify(r));}).catch(()=>{r.network=false;console.log(JSON.stringify(r));});`],signal),result=JSON.parse(probe.output);expect(result.key).toBe(false);expect(result.host).toBe(false);expect(result.network).toBe(false);expect(result['/root/probe']).not.toBe('WRITABLE');expect(result['/workspace/index.test.ts']).toBe('EROFS');expect(result['/workspace/package.json']).toBe('EROFS');
  const source=await sandbox.read('src/index.ts',signal);await sandbox.edit('src/index.ts',source+'\n// Written by the integration check.\n',signal);expect(await sandbox.read('src/index.ts',signal)).toContain('integration check');expect((await sandbox.command('node --experimental-strip-types --test index.test.ts',signal)).exitCode).toBe(1);await expect(sandbox.command('sh -c whoami',signal)).rejects.toThrow('Command guard');
 }finally{await sandbox.close();await rm(dir,{recursive:true,force:true});}
},30_000);
