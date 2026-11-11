import type { MetadataRoute } from 'next';
import {
  courseExercises,
  courseHref,
  courses,
  documentHref,
  exercisesHref,
  isPublished,
  pages,
  weekHref,
} from '@/lib/content';
import { absoluteUrl, showCourseExercises } from '@/lib/site';

// Static export: written to out/ at build time.
export const dynamic = 'force-static';

// Every page of the site, matching the generateStaticParams of the routes.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    '/',
    ...courses.flatMap(course => [
      courseHref(course),
      ...(showCourseExercises && courseExercises(course).length > 0
        ? [exercisesHref(course)]
        : []),
      ...course.weeks
        .filter(isPublished)
        .flatMap(week => [
          weekHref(course, week),
          ...pages(week).map(document => documentHref(course, week, document)),
        ]),
    ]),
    '/privacy',
    '/cookies',
  ];
  return paths.map(path => ({ url: absoluteUrl(path) }));
}
