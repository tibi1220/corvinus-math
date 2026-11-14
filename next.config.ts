import type { NextConfig } from 'next';

// The site is served from the root of corvinus.tibi1220.hu. PAGES_BASE_PATH
// would serve it under a path instead; nothing sets it now.
const basePath = process.env.PAGES_BASE_PATH ?? '';

// The private features (PRIVATE_SITE=1, see privateSite in
// src/lib/catalog.ts): on in pnpm dev and the private build, which is served
// under PAGES_BASE_PATH behind a login.
const privateSite = process.env.PRIVATE_SITE === '1';

// Pages named page.dev.tsx exist only with the private features: the
// course-wide Exercises page, while a single week is published (see
// showCourseExercises in src/lib/site.ts).

const nextConfig: NextConfig = {
  output: 'export',
  pageExtensions: privateSite
    ? ['dev.tsx', 'tsx', 'ts', 'jsx', 'js']
    : ['tsx', 'ts', 'jsx', 'js'],
  trailingSlash: true,
  basePath,
  // next/link applies basePath by itself; hand-built URLs (static files,
  // fetch) read it from here, see src/lib/base-path.ts.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    // So that code in the browser sees the same privateSite as the server.
    PRIVATE_SITE: privateSite ? '1' : '',
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
