/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // R2 images are served as plain URLs (no Next.js Image Optimization needed).
    // When using <Image> with R2, use the unoptimized prop or a custom loader.
    // For now, we serve WebP images directly from R2 CDN.
    unoptimized: true,
  },
};

export default nextConfig;
