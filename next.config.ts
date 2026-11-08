import type { NextConfig } from 'next';

// The site is served from the root of corvinus.tibi1220.hu. PAGES_BASE_PATH
// would serve it under a path instead; nothing sets it now.
const basePath = process.env.PAGES_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath,
  // next/link applies basePath by itself; hand-built URLs (static files,
  // fetch) read it from here, see src/lib/base-path.ts.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // Cache Components (and Partial Prefetching, which needs it) imply Partial
  // Prerendering, which static export does not support.
  reactCompiler: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
