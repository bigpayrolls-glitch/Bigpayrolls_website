/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: the whole site is plain HTML/JS in /out, hosted free on Firebase Hosting.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
