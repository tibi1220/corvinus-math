import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { LinkCard } from '@/components/link-card';
import { PageHeader } from '@/components/page-header';
import {
  courseHref,
  courses,
  getCourse,
  isPublished,
  weekHref,
  weekLabel,
} from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';

export const dynamicParams = false;

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
    description: `${course.name} (${course.description}): slides, exercise sheets and detailed solutions, week by week.`,
    path: courseHref(course),
  });
}

export default async function CoursePage({ params }: PageProps<'/[course]'>) {
  const course = getCourse((await params).course);
  if (!course) notFound();

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
                  title={`${weekLabel(week)}: ${week.title}`}
                  description={week.topics}
                />
              ) : (
                <LinkCard
                  title={`${weekLabel(week)}: ${week.title}`}
                  description='Coming soon'
                />
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
