/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Nécessaire pour l'image Docker de prod (copie uniquement du bundle
  // .next/standalone + ses node_modules minimaux, pas tout node_modules).
  output: "standalone",
};

export default nextConfig;
