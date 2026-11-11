import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ExerciseBrowser } from '@/components/exercise-browser';
import { ExerciseDownloads } from '@/components/exercise-downloads';
import { PageHeader } from '@/components/page-header';
import { SlideViewer } from '@/components/slide-viewer';
import { TableOfContents } from '@/components/table-of-contents';
import {
  courseHref,
  courses,
  documentHref,
  documentDownload,
  downloadLink,
  fileSize,
  getCourse,
  getWeek,
  pages,
  slideImageHref,
  weekExerciseDownloads,
  weekHeading,
  weekHref,
  weekLabel,
} from '@/lib/content';
import { documentClasses } from '@/lib/lwarp-classes';
import { pageMetadata } from '@/lib/metadata';

type Params = PageProps<'/[course]/[week]/[document]'>['params'];

export const dynamicParams = false;

export function generateStaticParams() {
  return courses.flatMap(course =>
    course.weeks.flatMap(week =>
      pages(week).map(document => ({
        course: course.slug,
        week: week.slug,
        document: document.slug,
      })),
    ),
  );
}

async function load(params: Params) {
  const {
    course: courseSlug,
    week: weekSlug,
    document: documentSlug,
  } = await params;
  const course = getCourse(courseSlug);
  const week = course && getWeek(course, weekSlug);
  const document = week && pages(week).find(d => d.slug === documentSlug);
  if (!course || !week || !document) notFound();
  return { course, week, document };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { course, week, document } = await load(params);
  return pageMetadata({
    title: `${document.title}, ${weekLabel(week)} – ${course.name}`,
    description: `${document.description} for ${course.name}, ${weekLabel(week)} (${(week.title ?? '').toLowerCase()}), also as a PDF.`,
    path: documentHref(course, week, document),
  });
}

export default async function DocumentPage({ params }: { params: Params }) {
  const { course, week, document } = await load(params);
  // The other documents of the week, e.g. the solutions next to the
  // exercises.
  const others = pages(week).filter(d => d.slug !== document.slug);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: course.name, href: courseHref(course) },
          { label: weekLabel(week), href: weekHref(course, week) },
          { label: document.title },
        ]}
      />
      <PageHeader
        title={document.title}
        subtitle={weekHeading(week)}
      />
      <div className='mb-8 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm'>
        {document.kind === 'exercises' ? (
          <ExerciseDownloads downloads={weekExerciseDownloads(course, week)} />
        ) : (
          <a
            {...downloadLink(documentDownload(course, week, document))}
            className='inline-flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 hover:border-zinc-400 dark:hover:border-zinc-600'
          >
            <Download
              aria-hidden
              className='size-4'
            />
            Download PDF ({fileSize(document.size)})
          </a>
        )}
        {others.map(other => (
          <Link
            key={other.slug}
            href={documentHref(course, week, other)}
            className='text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline'
          >
            {other.title}
          </Link>
        ))}
      </div>

      {document.kind === 'exercises' ? (
        <ExerciseBrowser
          sections={[{ key: week.slug, exercises: document.exercises ?? [] }]}
        />
      ) : document.kind === 'slides' && document.pages ? (
        <SlideViewer
          images={Array.from({ length: document.pages }, (_, i) =>
            slideImageHref(course, week, document, i + 1),
          )}
          aspect={document.aspect ?? 16 / 9}
          title={document.title}
        />
      ) : (
        <>
          {document.toc && document.toc.length > 0 && (
            <TableOfContents entries={document.toc} />
          )}
          <article
            className={documentClasses}
            dangerouslySetInnerHTML={{ __html: document.html ?? '' }}
          />
        </>
      )}
    </>
  );
}
