/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "http://192.168.11.11",
    "http://192.168.11.11:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
    "http://localhost:3000",
    "http://localhost",
  ],
};

module.exports = nextConfig;
