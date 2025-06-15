import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverRuntimeConfig: {},
  serverExternalPackages: ['@libsql/client', '@libsql/isomorphic-ws'],
  async redirects() {
    return [
      {
        source: '/home-reviews',
        destination: '/prop-firm-reviews',
        permanent: true,
      },
      {
        source: '/promos/:path*',
        destination: '/offers/:path*',
        permanent: true,
      },
      {
        source: '/affiliate-program',
        destination: '/join-affiliate-program',
        permanent: true,
      },
      {
        source: '/announcements',
        destination: '/prop-firm-announcements',
        permanent: true,
      },
      {
        source: '/challenges/:path*',
        destination: '/prop-firm-challenges/:path*',
        permanent: true,
      },
      {
        source: '/demo-accounts',
        destination: '/prop-firm-demo-accounts',
        permanent: true,
      },
      {
        source: '/exclusive',
        destination: '/exclusive-offers',
        permanent: true,
      },
      {
        source: '/loyalty',
        destination: '/loyalty-program',
        permanent: true,
      },
      {
        source: '/most-trusted-p',
        destination: '/favorite-firms',
        permanent: true,
      },
      {
        source: '/new-best-sellers',
        destination: '/best-sellers',
        permanent: true,
      },
      {
        source: '/best-sellers/:slug*',
        destination: '/best-sellers',
        permanent: true,
      },
      {
        source: '/news',
        destination: '/high-impact-news',
        permanent: true,
      },
      {
        source: '/stats/favorite-firm-stats',
        destination: '/favorite-firms',
        permanent: true,
      },
      {
        source: '/submit-a-review',
        destination: '/reviews/submit',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
