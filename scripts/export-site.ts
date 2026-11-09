import {cp,mkdir,rm} from 'node:fs/promises';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
await rm(resolve(root,'out'),{recursive:true,force:true});await mkdir(resolve(root,'out'));
await cp(resolve(root,'apps/web/out'),resolve(root,'out'),{recursive:true});
console.log('Static workbench copied to out/ for deployment.');
