/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "localhost",
      // Add your Render service hostname here once deployed, e.g.:
      // "postflow-backend.onrender.com"
    ],
  },
};

module.exports = nextConfig;
