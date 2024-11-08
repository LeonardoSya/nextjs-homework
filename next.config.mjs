/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      "api.mapbox.com",
      "a.tiles.mapbox.com",
      "b.tiles.mapbox.com",
      "events.mapbox.com",
    ],
  },
};
export default nextConfig;
