'use client';

import { ChevronLeft, ChevronRight, Maximize } from 'lucide-react';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

// The URL hash as an external store: changed by the viewer (notifyHash) or by
// the visitor (hashchange).
const hashListeners = new Set<() => void>();

function subscribeToHash(listener: () => void) {
  hashListeners.add(listener);
  window.addEventListener('hashchange', listener);
  return () => {
    hashListeners.delete(listener);
    window.removeEventListener('hashchange', listener);
  };
}

function notifyHash() {
  for (const listener of hashListeners) listener();
}

const readHash = () => location.hash;

// Shows a slide deck one page at a time, from the page images written by the
// content pipeline. Arrow keys, Page Up/Down and space turn the pages; the
// current page is kept in the URL hash (#12), so a page can be shared or
// reloaded. The images of the neighboring pages are preloaded.
export function SlideViewer({
  images,
  aspect,
  title,
}: {
  images: string[];
  aspect: number;
  title: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const last = images.length;
  // The page lives in the URL hash; the server render (and the first render
  // in the browser) shows page 1.
  const hash = useSyncExternalStore(subscribeToHash, readHash, () => '');
  const fromHash = Number(hash.slice(1));
  const page =
    Number.isInteger(fromHash) && fromHash >= 1 && fromHash <= last
      ? fromHash
      : 1;

  const go = useCallback(
    (next: number) => {
      const clamped = Math.min(last, Math.max(1, next));
      // replaceState keeps the history clean (no entry per page) but fires no
      // hashchange event, so the store is told by hand.
      history.replaceState(null, '', `#${clamped}`);
      notifyHash();
    },
    [last],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select')) return;
      if (['ArrowRight', 'PageDown', ' '].includes(event.key)) {
        event.preventDefault();
        go(page + 1);
      } else if (['ArrowLeft', 'PageUp'].includes(event.key)) {
        event.preventDefault();
        go(page - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        go(1);
      } else if (event.key === 'End') {
        event.preventDefault();
        go(last);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, page, last]);

  // Preload the neighbors, so turning a page shows the next one at once.
  useEffect(() => {
    for (const neighbor of [page + 1, page - 1]) {
      if (neighbor < 1 || neighbor > last) continue;
      const image = new Image();
      image.src = images[neighbor - 1];
    }
  }, [page, last, images]);

  function fullscreen() {
    frame.current?.requestFullscreen?.().catch(() => {});
  }

  // Clicking the left third of a slide goes back, anywhere else forward.
  function onSlideClick(event: React.MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    go(event.clientX - box.left < box.width / 3 ? page - 1 : page + 1);
  }

  const button =
    'inline-flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1.5 hover:border-zinc-400 dark:hover:border-zinc-600 disabled:opacity-40 disabled:hover:border-zinc-200 dark:disabled:hover:border-zinc-800';

  return (
    <div>
      <div
        ref={frame}
        onClick={onSlideClick}
        className='relative flex cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white [&:fullscreen]:rounded-none [&:fullscreen]:border-0 [&:fullscreen]:bg-black'
        style={{ aspectRatio: aspect }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- a static
            export has no image optimization */}
        <img
          src={images[page - 1]}
          alt={`${title}, page ${page} of ${last}`}
          className='max-h-full max-w-full select-none'
          draggable={false}
        />
      </div>
      <div className='mt-3 flex items-center justify-between gap-3'>
        <div className='flex gap-2'>
          <button
            type='button'
            onClick={() => go(page - 1)}
            disabled={page === 1}
            aria-label='Previous page'
            title='Previous page (←)'
            className={button}
          >
            <ChevronLeft
              aria-hidden
              className='size-5'
            />
          </button>
          <button
            type='button'
            onClick={() => go(page + 1)}
            disabled={page === last}
            aria-label='Next page'
            title='Next page (→)'
            className={button}
          >
            <ChevronRight
              aria-hidden
              className='size-5'
            />
          </button>
        </div>
        <label className='flex flex-1 items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400'>
          <span className='sr-only'>Page</span>
          <input
            type='range'
            min={1}
            max={last}
            value={page}
            onChange={event => go(Number(event.target.value))}
            className='flex-1 accent-zinc-700 dark:accent-zinc-300'
          />
          <span className='tabular-nums whitespace-nowrap'>
            {page} / {last}
          </span>
        </label>
        <button
          type='button'
          onClick={fullscreen}
          aria-label='Full screen'
          title='Full screen'
          className={button}
        >
          <Maximize
            aria-hidden
            className='size-5'
          />
        </button>
      </div>
    </div>
  );
}
