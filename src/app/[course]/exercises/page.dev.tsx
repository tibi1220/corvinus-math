import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ExerciseBrowser } from '@/components/exercise-browser';
import { ExerciseDownloads } from '@/components/exercise-downloads';
import { PageHeader } from '@/components/page-header';
import {
  courseHref,
  courses,
  courseExerciseDownloads,
  exercisesHref,
  getCourse,
  weekExercises,
  weekHref,
  weekHeading,
  type Course,
} from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';

// Typed by hand: next build leaves this development-only route out, so
// there is no PageProps<'/[course]/exercises'> then.
type Params = Promise<{ course: string }>;

export const dynamicParams = false;

// The weeks that have exercises, each as a section.
function sections(course: Course) {
  return course.weeks.flatMap(week => {
    const exercises = weekExercises(week)?.exercises ?? [];
    return exercises.length > 0
      ? [
          {
            key: week.slug,
            title: weekHeading(week),
            href: weekHref(course, week),
            exercises,
          },
        ]
      : [];
  });
}

// A development-only page for now (the .dev.tsx extension, see next.config.ts
// and showCourseExercises).
export function generateStaticParams() {
  return courses
    .filter(course => sections(course).length > 0)
    .map(course => ({ course: course.slug }));
}

async function load(params: Params) {
  const { course: courseSlug } = await params;
  const course = getCourse(courseSlug);
  if (!course || sections(course).length === 0) notFound();
  return course;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const course = await load(params);
  return pageMetadata({
    title: `Exercises – ${course.name}`,
    description: `Every exercise of ${course.name}, week by week and by topic, with detailed solutions, also as a PDF.`,
    path: exercisesHref(course),
  });
}

export default async function CourseExercisesPage({
  params,
}: {
  params: Params;
}) {
  const course = await load(params);
  const weeks = sections(course);
  const count = weeks.reduce((n, week) => n + week.exercises.length, 0);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: course.name, href: courseHref(course) },
          { label: 'Exercises' },
        ]}
      />
      <PageHeader
        title='Exercises'
        subtitle={`All ${count} exercises of the course, week by week, with detailed solutions. Filter by week or by topic.`}
      />
      <div className='mb-8 flex flex-wrap gap-2'>
        <ExerciseDownloads downloads={courseExerciseDownloads(course)} />
      </div>
      <ExerciseBrowser sections={weeks} />
    </>
  );
}
