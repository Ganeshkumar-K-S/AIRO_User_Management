/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://airo-backend-pnxm.onrender.com/:path*',
      },
    ];
  },
};

module.exports = nextConfig;