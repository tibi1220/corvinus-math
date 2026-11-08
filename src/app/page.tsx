import { Mail } from 'lucide-react';
import type { Metadata } from 'next';
import { LinkCard } from '@/components/link-card';
import { courseHref, courses, isPublished } from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';
import { operator, siteDescription } from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  description: siteDescription,
  path: '/',
});

const contactLink =
  'inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline';

export default function Home() {
  return (
    <>
      <section
        aria-label='Contact'
        className='mb-10 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4'
      >
        <h1 className='text-2xl font-semibold tracking-tight'>
          {operator.name}
        </h1>
        <p className='mt-0.5 text-zinc-600 dark:text-zinc-400'>
          {operator.role}
        </p>
        <ul className='mt-3 text-sm'>
          <li>
            <a
              href={`mailto:${operator.email}`}
              className={contactLink}
            >
              <Mail
                aria-hidden
                className='size-4'
              />
              {operator.email}
            </a>
          </li>
        </ul>
      </section>

      <header className='mb-4'>
        <h2 className='text-lg font-semibold'>Choose a course</h2>
        <p className='mt-1 text-zinc-600 dark:text-zinc-400'>
          Slides, exercise sheets and detailed solutions, week by week.
        </p>
      </header>
      <ul className='grid gap-3 sm:grid-cols-2'>
        {courses.map(course => {
          const published = course.weeks.filter(isPublished).length;
          return (
            <li key={course.slug}>
              <LinkCard
                href={courseHref(course)}
                title={course.name}
                description={`${course.description} · ${published} of ${course.weeks.length} weeks published`}
              />
            </li>
          );
        })}
      </ul>
    </>
  );
}
