import type { NextConfig } from 'next';
const basePath=process.env.DEVSQUAD_BASE_PATH??'';if(basePath&&!/^\/[A-Za-z0-9_-]+$/.test(basePath))throw Error('Invalid static base path.');
const config: NextConfig = { basePath,env:{NEXT_PUBLIC_BASE_PATH:basePath}, output:'export', trailingSlash:true, transpilePackages:['@devsquad/core'], images:{unoptimized:true}, poweredByHeader:false };
export default config;
