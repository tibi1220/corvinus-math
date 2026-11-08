import type { MetadataRoute } from 'next';
import {
  courseHref,
  courses,
  documentHref,
  isPublished,
  weekHref,
} from '@/lib/content';
import { absoluteUrl } from '@/lib/site';

// Static export: written to out/ at build time.
export const dynamic = 'force-static';

// Every page of the site, matching the generateStaticParams of the routes.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    ...courses.flatMap(course => [
      courseHref(course),
      ...course.weeks
        .filter(isPublished)
        .flatMap(week => [
          weekHref(course, week),
          ...week.documents.map(document =>
            documentHref(course, week, document),
          ),
        ]),
    ]),
    '/privacy',
    '/cookies',
  ];
  return paths.map(path => ({ url: absoluteUrl(path) }));
}
