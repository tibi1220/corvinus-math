import type { NextConfig } from 'next';

// The site is served from the root of corvinus.tibi1220.hu. PAGES_BASE_PATH
// would serve it under a path instead; nothing sets it now.
const basePath = process.env.PAGES_BASE_PATH ?? '';

// Pages named page.dev.tsx exist only in development (next dev): the
// course-wide Exercises page, while a single week is published (see
// showCourseExercises in src/lib/site.ts).
const development = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  output: 'export',
  pageExtensions: development
    ? ['dev.tsx', 'tsx', 'ts', 'jsx', 'js']
    : ['tsx', 'ts', 'jsx', 'js'],
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
