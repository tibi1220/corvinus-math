import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ExerciseDownloads } from '@/components/exercise-downloads';
import { PageHeader } from '@/components/page-header';
import {
  audioHref,
  courseHref,
  courses,
  documentHref,
  documentDownload,
  downloadLink,
  fileSize,
  getCourse,
  getWeek,
  isPublished,
  lecturerDocuments,
  pages,
  weekExerciseDownloads,
  weekExercises,
  weekHeading,
  weekHref,
  weekLabel,
} from '@/lib/content';
import { exerciseAnchor } from '@/lib/exercises';
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
    title: `${weekHeading(week)} – ${course.name}`,
    description: `${course.name}, ${weekHeading(week)}. Slides, a study guide and exercises with detailed solutions, to read online or download as PDF.`,
    path: weekHref(course, week),
  });
}

const buttonClass =
  'inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 text-sm hover:border-zinc-400 dark:hover:border-zinc-600';

export default async function WeekPage({ params }: { params: Params }) {
  const { course, week } = await load(params);
  // The exercises are listed one by one below the documents.
  const exercises = weekExercises(week);
  const documents = pages(week).filter(
    d => d.kind !== 'exercises' && !d.lecturer,
  );
  // Only in the private build: the scripts, with their recordings.
  const lecturer = lecturerDocuments(week);
  // The published weeks before and after this one.
  const published = course.weeks.filter(isPublished);
  const index = published.findIndex(w => w.number === week.number);
  const previous = published[index - 1];
  const next = published[index + 1];

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
        title={weekHeading(week)}
        subtitle={week.topics}
      />

      <h2 className='mb-3 text-lg font-semibold'>Documents</h2>
      <ul className='grid gap-3'>
        {documents.map(document => (
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
                {...downloadLink(documentDownload(course, week, document))}
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

      {lecturer.length > 0 && (
        <section className='mt-10'>
          <h2 className='mb-3 text-lg font-semibold'>
            Lecturer only{' '}
            <span className='text-sm font-normal text-zinc-500 dark:text-zinc-400'>
              · not on the public site
            </span>
          </h2>
          <ul className='grid gap-3'>
            {lecturer.map(document => (
              <li
                key={document.slug}
                className='rounded-lg border border-amber-300 dark:border-amber-800/70 bg-white dark:bg-zinc-900 px-4 py-3'
              >
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div>
                    <span className='font-medium'>{document.title}</span>
                    <span className='mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400'>
                      {document.description}
                    </span>
                  </div>
                  <div className='flex shrink-0 gap-2'>
                    {document.kind === 'document' && (
                      <Link
                        href={documentHref(course, week, document)}
                        className={buttonClass}
                      >
                        Read online
                      </Link>
                    )}
                    <a
                      {...downloadLink(
                        documentDownload(course, week, document),
                      )}
                      className={buttonClass}
                    >
                      <Download
                        aria-hidden
                        className='size-4'
                      />
                      PDF, {fileSize(document.size)}
                    </a>
                  </div>
                </div>
                {week.audio
                  .filter(audio => audio.document === document.slug)
                  .map(audio => (
                    <div
                      key={audio.file}
                      className='mt-3 flex flex-col gap-2 sm:flex-row sm:items-center'
                    >
                      <audio
                        controls
                        preload='metadata'
                        src={audioHref(course, week, audio)}
                        className='w-full min-w-0 sm:flex-1'
                      />
                      <a
                        href={audioHref(course, week, audio)}
                        download={audio.file}
                        className={`${buttonClass} shrink-0 self-start sm:self-auto`}
                      >
                        <Download
                          aria-hidden
                          className='size-4'
                        />
                        MP3, {fileSize(audio.size)}
                      </a>
                    </div>
                  ))}
              </li>
            ))}
          </ul>
        </section>
      )}

      {exercises?.exercises && exercises.exercises.length > 0 && (
        <section className='mt-10'>
          <div className='mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2'>
            <h2 className='text-lg font-semibold'>Exercises</h2>
            <div className='flex flex-wrap gap-2'>
              <Link
                href={documentHref(course, week, exercises)}
                className={buttonClass}
              >
                Read online
              </Link>
              <ExerciseDownloads
                downloads={weekExerciseDownloads(course, week)}
              />
            </div>
          </div>
          <ol className='grid gap-x-6 sm:grid-cols-2'>
            {exercises.exercises.map(exercise => (
              <li key={exercise.slug}>
                <Link
                  href={`${documentHref(course, week, exercises)}#${exerciseAnchor(exercise)}`}
                  className='flex items-baseline gap-3 rounded-md px-2 py-1.5 -mx-2 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                >
                  <span className='w-9 shrink-0 tabular-nums text-sm text-zinc-400 dark:text-zinc-500'>
                    {exercise.number}
                  </span>
                  <span className='min-w-0 flex-1'>{exercise.title}</span>
                  {exercise.tags.includes('finance') && (
                    <span className='rounded-full bg-teal-700/10 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-400/10 dark:text-teal-300'>
                      finance
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {(previous || next) && (
        <nav
          aria-label='Weeks'
          className='mt-12 grid gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-6 sm:grid-cols-2'
        >
          {previous && (
            <Link
              href={weekHref(course, previous)}
              rel='prev'
              className='group flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 hover:border-zinc-400 dark:hover:border-zinc-600'
            >
              <ChevronLeft
                aria-hidden
                className='size-5 shrink-0 text-zinc-400'
              />
              <span className='min-w-0'>
                <span className='block text-sm text-zinc-500 dark:text-zinc-400'>
                  Previous week
                </span>
                <span className='font-medium group-hover:underline'>
                  {weekHeading(previous)}
                </span>
              </span>
            </Link>
          )}
          {next && (
            <Link
              href={weekHref(course, next)}
              rel='next'
              className='group flex items-center justify-end gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-right hover:border-zinc-400 dark:hover:border-zinc-600 sm:col-start-2'
            >
              <span className='min-w-0'>
                <span className='block text-sm text-zinc-500 dark:text-zinc-400'>
                  Next week
                </span>
                <span className='font-medium group-hover:underline'>
                  {weekHeading(next)}
                </span>
              </span>
              <ChevronRight
                aria-hidden
                className='size-5 shrink-0 text-zinc-400'
              />
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
