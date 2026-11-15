'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

export type Crumb = { label: string; href?: string };

const subscribe = () => () => {};
const headerSlot = () => document.getElementById('header-breadcrumbs');
const serverSlot = () => null;

function BreadcrumbTrail({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label='Breadcrumb'
      className='text-sm text-zinc-500 dark:text-zinc-400'
    >
      <ol className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        {items.map((item, i) => (
          <li
            key={i}
            className='flex items-center gap-2'
          >
            {i > 0 && <span aria-hidden>/</span>}
            <CrumbLabel item={item} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

function CrumbLabel({
  item,
  className = '',
}: {
  item: Crumb;
  className?: string;
}) {
  return item.href ? (
    <Link
      href={item.href}
      className={`${className} hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline`}
    >
      {item.label}
    </Link>
  ) : (
    <span
      className={`${className} text-zinc-900 dark:text-zinc-100`}
      aria-current='page'
    >
      {item.label}
    </span>
  );
}

// The trail in the header, once the page's own trail has scrolled away. It
// shows the whole path and never scrolls sideways (no swiping or
// rubber-banding on phones). If the path does not fit, labels are cut with an
// ellipsis, in order of importance: first the crumbs in the middle (the
// course), then Home and the parent, the current page last. The flex-shrink
// factors are 10^4 apart, so a crumb loses (practically) nothing until the
// ones before it in that order are as short as they can get; a minimum width
// keeps at least a letter of every ancestor.
function shrinkClass(i: number, last: number) {
  if (i === last) return 'min-w-0 shrink';
  if (i === 0) return 'min-w-[1.75em] shrink-[10000]';
  if (i === last - 1) return 'min-w-[2.75em] shrink-[10000]';
  return 'min-w-[2.75em] shrink-[100000000]';
}

function HeaderTrail({ items }: { items: Crumb[] }) {
  const last = items.length - 1;
  return (
    <nav
      aria-label='Breadcrumb'
      className='header-trail min-w-0 text-sm text-zinc-500 dark:text-zinc-400'
    >
      <ol className='flex min-w-0 items-center gap-1.5 whitespace-nowrap'>
        {items.map((item, i) => (
          <li
            key={i}
            title={item.label}
            className={`flex items-center gap-1.5 ${shrinkClass(i, last)}`}
          >
            {i > 0 && (
              <span
                aria-hidden
                className='shrink-0'
              >
                /
              </span>
            )}
            <CrumbLabel
              item={item}
              className='min-w-0 truncate'
            />
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const origin = useRef<HTMLDivElement>(null);
  const [sticky, setSticky] = useState(false);
  // The header is server-rendered; defer portal access until hydration.
  const slot = useSyncExternalStore(subscribe, headerSlot, serverSlot);

  useEffect(() => {
    const element = origin.current;
    if (!element || !slot) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSticky(entry.boundingClientRect.bottom <= 65),
      { rootMargin: '-65px 0px 0px 0px', threshold: [0, 1] },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [slot]);

  return (
    <>
      <div
        ref={origin}
        className='mb-6'
        style={{ visibility: sticky ? 'hidden' : undefined }}
        inert={sticky}
      >
        <BreadcrumbTrail items={items} />
      </div>
      {sticky && slot && createPortal(<HeaderTrail items={items} />, slot)}
    </>
  );
}
