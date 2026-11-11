import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ExerciseDownloads } from '@/components/exercise-downloads';
import { LinkCard } from '@/components/link-card';
import { PageHeader } from '@/components/page-header';
import {
  courseExercises,
  courseHref,
  courses,
  courseExerciseDownloads,
  exercisesHref,
  getCourse,
  isPublished,
  weekHref,
  weekHeading,
} from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';
import { showCourseExercises } from '@/lib/site';

export const dynamicParams = false;

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-sm hover:border-zinc-400 dark:hover:border-zinc-600';

export function generateStaticParams() {
  return courses.map(course => ({ course: course.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<'/[course]'>): Promise<Metadata> {
  const course = getCourse((await params).course);
  if (!course) return {};
  return pageMetadata({
    title: course.name,
    description: `${course.name} (${course.description}): slides, study guides and exercises with detailed solutions, week by week.`,
    path: courseHref(course),
  });
}

export default async function CoursePage({ params }: PageProps<'/[course]'>) {
  const course = getCourse((await params).course);
  if (!course) notFound();
  const exercises = showCourseExercises ? courseExercises(course) : [];

  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: course.name }]}
      />
      <PageHeader
        title={course.name}
        subtitle={course.description}
      />

      <section>
        <h2 className='mb-3 text-lg font-semibold'>Weeks</h2>
        <ul className='grid gap-3 sm:grid-cols-2'>
          {course.weeks.map(week => (
            <li key={week.slug}>
              {isPublished(week) ? (
                <LinkCard
                  href={weekHref(course, week)}
                  title={weekHeading(week)}
                  description={week.topics}
                />
              ) : (
                <LinkCard
                  title={weekHeading(week)}
                  description='Coming soon'
                />
              )}
            </li>
          ))}
        </ul>
      </section>

      {exercises.length > 0 && (
        <section className='mt-10'>
          <h2 className='mb-3 text-lg font-semibold'>Exercises</h2>
          <div className='flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
            <Link
              href={exercisesHref(course)}
              className='group'
            >
              <span className='font-medium group-hover:underline'>
                All exercises
              </span>
              <span className='mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400'>
                {exercises.length} exercises from every week, by week and by
                topic, with detailed solutions
              </span>
            </Link>
            <div className='flex shrink-0 flex-wrap gap-2'>
              <Link
                href={exercisesHref(course)}
                className={buttonClass}
              >
                Read online
              </Link>
              <ExerciseDownloads downloads={courseExerciseDownloads(course)} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
