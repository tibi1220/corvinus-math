import type { Metadata } from 'next';
import { siteName } from '@/lib/site';

// Title, description, canonical URL and Open Graph tags of a page. `path` is
// the route without the base path, e.g. '/analysis-a1'.
export function pageMetadata({
  title,
  description,
  path,
}: {
  title?: string;
  description: string;
  path: string;
}): Metadata {
  // Pages are exported as <path>/index.html, so their URLs end with a slash.
  const url = path.endsWith('/') ? path : `${path}/`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: title ? `${title} | ${siteName}` : siteName,
      description,
      url,
      siteName,
      locale: 'en_US',
      type: 'website',
    },
  };
}
