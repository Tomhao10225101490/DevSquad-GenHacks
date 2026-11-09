import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {resolve,join} from 'node:path';import {spawnSync} from 'node:child_process';import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
for(const slug of ['path-guard','retry-queue','ttl-cache']) {
 const r=JSON.parse(await readFile(join(root,'apps/web/public/recordings',slug+'.json'),'utf8')),dir=await mkdtemp(join(tmpdir(),'devsquad-patch-'));
 try{await mkdir(join(dir,'src'));for(const [path,content]of Object.entries(r.baselineFiles))await writeFile(join(dir,path),String(content));await writeFile(join(dir,'package.json'),'{"type":"module"}');
  const patch=await readFile(join(root,'apps/web/public/recordings',slug+'.patch'),'utf8');if(createHash('sha256').update(patch).digest('hex')!==r.patchSha256)throw Error('Patch checksum mismatch');await writeFile(join(dir,'fix.patch'),patch);
  const run=(args:string[])=>spawnSync(args[0],args.slice(1),{cwd:dir,encoding:'utf8',timeout:15000});
  const baseline=run(['node','--experimental-strip-types','--test','index.test.ts']);if(baseline.status===0)throw Error('Expected failing baseline');
  const apply=run(['git','apply','fix.patch']);if(apply.status)throw Error(apply.stderr);const result=run(['node','--experimental-strip-types','--test','index.test.ts']);if(result.status)throw Error(result.stdout+result.stderr);console.log(`${slug}: exported patch verified on a fresh workspace`);
 }finally{await rm(dir,{recursive:true,force:true});}
}
