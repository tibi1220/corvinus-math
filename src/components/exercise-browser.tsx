'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { TableOfContents } from '@/components/table-of-contents';
import { exerciseAnchor, tagLabel, type Exercise } from '@/lib/exercises';
import { documentClasses } from '@/lib/lwarp-classes';

// The exercises of one week. On the course-wide page every week is a section
// with a heading (title); a week's own page has a single section without one.
export type ExerciseSection = {
  key: string;
  title?: string;
  // The week's page, linked from the heading.
  href?: string;
  exercises: Exercise[];
};

const chipClass =
  'rounded-full border px-2.5 py-0.5 text-xs transition-colors aria-pressed:border-zinc-900 aria-pressed:bg-zinc-900 aria-pressed:text-white dark:aria-pressed:border-zinc-100 dark:aria-pressed:bg-zinc-100 dark:aria-pressed:text-zinc-900';
const plainChip = `${chipClass} border-zinc-200 dark:border-zinc-700`;

// Finance first, then the topics in the order they first appear.
function allTags(exercises: Exercise[]) {
  const tags = [...new Set(exercises.flatMap(exercise => exercise.tags))];
  return tags.sort((a, b) => (a === 'finance' ? -1 : b === 'finance' ? 1 : 0));
}

function TagBadge({ tag }: { tag: string }) {
  return (
    <li
      className={
        tag === 'finance'
          ? 'rounded-full bg-teal-700/10 px-2 py-0.5 text-xs font-medium text-teal-800 dark:bg-teal-400/10 dark:text-teal-300'
          : 'rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
      }
    >
      {tagLabel(tag)}
    </li>
  );
}

function ExerciseCard({
  exercise,
  hidden,
}: {
  exercise: Exercise;
  hidden: boolean;
}) {
  return (
    <li
      id={exerciseAnchor(exercise)}
      hidden={hidden}
      className='scroll-mt-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4'
    >
      <header className='flex flex-wrap items-baseline gap-x-3 gap-y-1.5'>
        <h3 className='font-semibold text-zinc-900 dark:text-zinc-100'>
          <a
            href={`#${exerciseAnchor(exercise)}`}
            className='hover:underline'
          >
            <span className='tabular-nums text-zinc-400 dark:text-zinc-500'>
              {exercise.number}
            </span>{' '}
            {exercise.title}
          </a>
        </h3>
        <ul
          aria-label='Topics'
          className='flex flex-wrap gap-1.5'
        >
          {exercise.tags.map(tag => (
            <TagBadge
              key={tag}
              tag={tag}
            />
          ))}
        </ul>
      </header>
      <div
        className={`mt-2 ${documentClasses}`}
        dangerouslySetInnerHTML={{ __html: exercise.problem }}
      />
      {exercise.solution && (
        <details className='group mt-3 border-t border-zinc-100 dark:border-zinc-800 pt-3'>
          <summary className='inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline [&::-webkit-details-marker]:hidden'>
            <ChevronRight
              aria-hidden
              className='size-4 transition-transform group-open:rotate-90'
            />
            Solution
          </summary>
          <div
            className={`mt-2 ${documentClasses}`}
            dangerouslySetInnerHTML={{ __html: exercise.solution }}
          />
        </details>
      )}
    </li>
  );
}

// Exercises with their tags; the solution opens on demand. The chips at the
// top filter by week (when there are several) and by topic; without
// JavaScript, everything is shown.
export function ExerciseBrowser({ sections }: { sections: ExerciseSection[] }) {
  const [tag, setTag] = useState<string | null>(null);
  const [week, setWeek] = useState<string | null>(null);
  const all = sections.flatMap(section => section.exercises);
  const tags = allTags(all);
  const titled = sections.filter(section => section.title);
  const visible = (section: ExerciseSection, exercise: Exercise) =>
    (!week || section.key === week) && (!tag || exercise.tags.includes(tag));
  const shown = sections.reduce(
    (count, section) =>
      count + section.exercises.filter(e => visible(section, e)).length,
    0,
  );
  // Match the filtered cards, so the TOC never links to a hidden exercise.
  const toc = sections.flatMap(section => {
    const exercises = section.exercises.filter(e => visible(section, e));
    if (!exercises.length) return [];
    return [
      ...(section.title
        ? [
            {
              id: `section-${section.key}`,
              level: 1,
              number: '',
              title: section.title,
            },
          ]
        : []),
      ...exercises.map(exercise => ({
        id: exerciseAnchor(exercise),
        level: section.title ? 2 : 1,
        number: exercise.number,
        title: exercise.title,
      })),
    ];
  });

  return (
    <>
      {toc.length > 0 && (
        <TableOfContents
          entries={toc}
          plainTextTitles
        />
      )}
      <div className='mb-6 flex flex-col gap-2'>
        {titled.length > 1 && (
          <div
            role='group'
            aria-label='Filter by week'
            className='flex flex-wrap items-center gap-2'
          >
            <button
              type='button'
              aria-pressed={week === null}
              onClick={() => setWeek(null)}
              className={plainChip}
            >
              All weeks
            </button>
            {titled.map(section => (
              <button
                key={section.key}
                type='button'
                aria-pressed={week === section.key}
                onClick={() =>
                  setWeek(week === section.key ? null : section.key)
                }
                className={plainChip}
              >
                {section.title}
              </button>
            ))}
          </div>
        )}
        <div
          role='group'
          aria-label='Filter by topic'
          className='flex flex-wrap items-center gap-2'
        >
          <button
            type='button'
            aria-pressed={tag === null}
            onClick={() => setTag(null)}
            className={plainChip}
          >
            All topics
          </button>
          {tags.map(t => (
            <button
              key={t}
              type='button'
              aria-pressed={tag === t}
              onClick={() => setTag(tag === t ? null : t)}
              className={`${chipClass} ${
                t === 'finance'
                  ? 'border-teal-700/40 text-teal-800 dark:border-teal-400/30 dark:text-teal-300'
                  : 'border-zinc-200 dark:border-zinc-700'
              }`}
            >
              {tagLabel(t)}
            </button>
          ))}
          <span
            aria-live='polite'
            className='ml-auto text-sm text-zinc-500 dark:text-zinc-400'
          >
            {shown} of {all.length}
          </span>
        </div>
      </div>

      {sections.map(section => {
        const hidden = section.exercises.every(e => !visible(section, e));
        return (
          <section
            key={section.key}
            id={`section-${section.key}`}
            hidden={hidden}
            className='mb-8 scroll-mt-8'
          >
            {section.title && (
              <h2 className='mb-3 text-lg font-semibold'>
                {section.href ? (
                  <Link
                    href={section.href}
                    className='hover:underline'
                  >
                    {section.title}
                  </Link>
                ) : (
                  section.title
                )}
              </h2>
            )}
            <ol className='grid gap-4'>
              {section.exercises.map(exercise => (
                <ExerciseCard
                  key={exercise.slug}
                  exercise={exercise}
                  hidden={!visible(section, exercise)}
                />
              ))}
            </ol>
          </section>
        );
      })}
      {shown === 0 && (
        <p className='text-zinc-500 dark:text-zinc-400'>
          No exercise matches these filters.
        </p>
      )}
    </>
  );
}
