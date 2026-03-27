/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.mapbox.com"
      },
      {
        protocol: "https",
        hostname: "staticmap.openstreetmap.de"
      }
    ]
  }
};

export default nextConfig;
