import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {},
  serverExternalPackages: ['@libsql/client', '@libsql/isomorphic-ws'],
};

export default nextConfig;
