'use client';

import { List } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { TocEntry } from '@/lib/content';

// How far below the top of the window a heading counts as the current one.
const ACTIVE_OFFSET = 120;

function TocList({
  entries,
  active,
  onNavigate,
}: {
  entries: TocEntry[];
  active: string | null;
  onNavigate?: () => void;
}) {
  return (
    <ol className='space-y-1'>
      {entries.map(entry => (
        <li
          key={entry.id}
          className={entry.level === 2 ? 'pl-4' : ''}
        >
          <a
            href={`#${entry.id}`}
            onClick={onNavigate}
            aria-current={entry.id === active ? 'location' : undefined}
            className={`flex gap-1.5 border-l-2 py-0.5 pl-2 transition-colors ${
              entry.id === active
                ? 'border-zinc-900 dark:border-zinc-100 font-medium text-zinc-900 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <span className='tabular-nums'>{entry.number}</span>
            <span dangerouslySetInnerHTML={{ __html: entry.title }} />
          </a>
        </li>
      ))}
    </ol>
  );
}

// The table of contents of a material. On wide screens it is a sidebar left
// of the text; on smaller ones a button floating in the bottom left corner
// opens it. Either way it highlights the section being read.
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const popup = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headings = entries
      .map(entry => document.getElementById(entry.id))
      .filter(heading => heading !== null);
    let frame = 0;
    // The current section is the last one whose heading has scrolled past
    // the top of the window.
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const passed = headings.filter(
          heading => heading.getBoundingClientRect().top <= ACTIVE_OFFSET,
        );
        setActive(passed.at(-1)?.id ?? null);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [entries]);

  // The open list closes on Escape and on a click outside of it.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!popup.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <>
      {/* Left of the text column (max-w-3xl, i.e. 24rem on each side of the
          center), where xl screens have room. */}
      <nav
        aria-label='Table of contents'
        className='fixed top-24 right-[calc(50%+24.5rem)] hidden max-h-[calc(100vh-8rem)] w-56 overflow-y-auto text-sm xl:block'
      >
        <p className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
          Contents
        </p>
        <TocList
          entries={entries}
          active={active}
        />
      </nav>

      <div
        ref={popup}
        // globals.css keeps the footer clear of the button.
        data-floating-toc
        className='fixed bottom-4 left-4 z-40 xl:hidden'
      >
        {open && (
          <nav
            id='toc-popup'
            aria-label='Table of contents'
            className='absolute bottom-full left-0 mb-2 max-h-[70vh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm shadow-lg'
          >
            <TocList
              entries={entries}
              active={active}
              onNavigate={() => setOpen(false)}
            />
          </nav>
        )}
        <button
          type='button'
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls='toc-popup'
          className='flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm font-medium shadow-lg hover:border-zinc-400 dark:hover:border-zinc-600'
        >
          <List
            aria-hidden
            className='size-4'
          />
          Contents
        </button>
      </div>
    </>
  );
}
