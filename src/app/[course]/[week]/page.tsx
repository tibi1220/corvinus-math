import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import {
  courseHref,
  courses,
  documentHref,
  downloadHref,
  fileSize,
  getCourse,
  getWeek,
  isPublished,
  weekHref,
  weekLabel,
} from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';

type Params = PageProps<'/[course]/[week]'>['params'];

export const dynamicParams = false;

// Only weeks whose materials are published get a page.
export function generateStaticParams() {
  return courses.flatMap(course =>
    course.weeks
      .filter(isPublished)
      .map(week => ({ course: course.slug, week: week.slug })),
  );
}

async function load(params: Params) {
  const { course: courseSlug, week: weekSlug } = await params;
  const course = getCourse(courseSlug);
  const week = course && getWeek(course, weekSlug);
  if (!course || !week || !isPublished(week)) notFound();
  return { course, week };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { course, week } = await load(params);
  return pageMetadata({
    title: `${weekLabel(week)}: ${week.title} – ${course.name}`,
    description: `${course.name}, ${weekLabel(week)}: ${week.topics}. Slides, exercises and detailed solutions, to read online or download as PDF.`,
    path: weekHref(course, week),
  });
}

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-sm hover:border-zinc-400 dark:hover:border-zinc-600';

export default async function WeekPage({ params }: { params: Params }) {
  const { course, week } = await load(params);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: course.name, href: courseHref(course) },
          { label: weekLabel(week) },
        ]}
      />
      <PageHeader
        title={`${weekLabel(week)}: ${week.title}`}
        subtitle={week.topics}
      />

      <ul className='grid gap-3'>
        {week.documents.map(document => (
          <li
            key={document.slug}
            className='flex flex-col gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
          >
            <Link
              href={documentHref(course, week, document)}
              className='group'
            >
              <span className='font-medium group-hover:underline'>
                {document.title}
              </span>
              <span className='mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400'>
                {document.description}
                {document.kind === 'slides' && document.pages
                  ? ` · ${document.pages} pages`
                  : ''}
              </span>
            </Link>
            <div className='flex shrink-0 gap-2'>
              <Link
                href={documentHref(course, week, document)}
                className={buttonClass}
              >
                {document.kind === 'slides' ? 'View online' : 'Read online'}
              </Link>
              <a
                href={downloadHref(course, week, document)}
                download
                className={buttonClass}
              >
                <Download
                  aria-hidden
                  className='size-4'
                />
                PDF, {fileSize(document.size)}
              </a>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
