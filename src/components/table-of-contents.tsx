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
  plainTextTitles,
}: {
  entries: TocEntry[];
  active: string | null;
  onNavigate?: () => void;
  plainTextTitles: boolean;
}) {
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const element = list.current;
    const scroller = element?.closest<HTMLElement>('[data-toc-scroll]');
    if (!element || !scroller) return;

    const keepActiveVisible = () => {
      const link = element.querySelector<HTMLElement>(
        '[aria-current="location"]',
      );
      if (!link || !scroller.clientHeight) return;
      const bounds = scroller.getBoundingClientRect();
      const item = link.getBoundingClientRect();
      const top = Math.max(bounds.top, 65) + 12;
      const bottom = Math.min(bounds.bottom, window.innerHeight) - 12;
      const delta =
        item.top < top
          ? item.top - top
          : item.bottom > bottom
            ? item.bottom - bottom
            : 0;

      // Scroll only this list: scrollIntoView can also move the document.
      if (delta) {
        scroller.scrollBy({
          top: delta,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
            .matches
            ? 'instant'
            : 'smooth',
        });
      }
    };

    keepActiveVisible();
    // Also reveal the current link when a popup opens, a breakpoint changes,
    // or the list's available height changes without changing the section.
    const observer = new ResizeObserver(keepActiveVisible);
    observer.observe(scroller);
    observer.observe(element);
    return () => observer.disconnect();
  }, [active]);

  return (
    <ol
      ref={list}
      className='space-y-1'
    >
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
            {plainTextTitles ? (
              <span>{entry.title}</span>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: entry.title }} />
            )}
          </a>
        </li>
      ))}
    </ol>
  );
}

// The table of contents of a material. On wide screens it is a sidebar left
// of the text; on smaller ones a button floating in the bottom left corner
// opens it. Either way it highlights the section being read.
export function TableOfContents({
  entries,
  plainTextTitles = false,
}: {
  entries: TocEntry[];
  plainTextTitles?: boolean;
}) {
  const [active, setActive] = useState<string | null>(entries[0]?.id ?? null);
  const current = entries.some(entry => entry.id === active)
    ? active
    : (entries[0]?.id ?? null);
  const [open, setOpen] = useState(false);
  const popup = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headings = entries
      .map(entry => document.getElementById(entry.id))
      .filter(heading => heading !== null);
    let frame = 0;
    // The current section is the last one whose heading has scrolled past
    // the top of the window, or the first section at the top of the page.
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const passed = headings.filter(
          heading => heading.getBoundingClientRect().top <= ACTIVE_OFFSET,
        );
        setActive(passed.at(-1)?.id ?? headings[0]?.id ?? null);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // Opening exercise solutions can move headings without scrolling.
    const observer = new ResizeObserver(update);
    const main = popup.current?.closest('main');
    if (main) observer.observe(main);
    return () => {
      observer.disconnect();
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
      {/* The rail is bounded by main, so the sticky list moves up before
          reaching the footer. Keep it outside the centered text column. */}
      <div className='absolute inset-y-8 right-[calc(100%+0.5rem)] hidden w-56 xl:block'>
        <nav
          aria-label='Table of contents'
          data-toc-scroll
          className='toc-scroll sticky top-24 max-h-[min(100%,calc(100dvh-8rem))] overflow-y-auto pr-2 text-sm'
        >
          <p className='mb-2 font-medium text-zinc-900 dark:text-zinc-100'>
            Contents
          </p>
          <TocList
            entries={entries}
            active={current}
            plainTextTitles={plainTextTitles}
          />
        </nav>
      </div>

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
            data-toc-scroll
            className='toc-scroll absolute bottom-full left-0 mb-2 max-h-[70dvh] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm shadow-lg'
          >
            <TocList
              entries={entries}
              active={current}
              plainTextTitles={plainTextTitles}
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
