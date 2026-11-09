import type { NextConfig } from 'next';
const config: NextConfig = { output:'export', trailingSlash:true, transpilePackages:['@devsquad/core'], images:{unoptimized:true}, poweredByHeader:false };
export default config;
