/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    allowedDevOrigins: ['http://192.168.56.1'], // or whatever IP you're accessing from
  },
};

export default nextConfig; 