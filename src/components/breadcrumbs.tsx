'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

export type Crumb = { label: string; href?: string };

const subscribe = () => () => {};
const headerSlot = () => document.getElementById('header-breadcrumbs');
const serverSlot = () => null;

function BreadcrumbTrail({
  items,
  compact = false,
}: {
  items: Crumb[];
  compact?: boolean;
}) {
  return (
    <nav
      aria-label='Breadcrumb'
      className={`${compact ? 'toc-scroll overflow-x-auto py-1' : ''} text-sm text-zinc-500 dark:text-zinc-400`}
    >
      <ol
        className={`flex items-center gap-x-2 gap-y-1 ${compact ? 'w-max whitespace-nowrap' : 'flex-wrap'}`}
      >
        {items.map((item, i) => (
          <li
            key={i}
            className='flex items-center gap-2'
          >
            {i > 0 && <span aria-hidden>/</span>}
            {item.href ? (
              <Link
                href={item.href}
                className='hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline'
              >
                {item.label}
              </Link>
            ) : (
              <span
                className='text-zinc-900 dark:text-zinc-100'
                aria-current='page'
              >
                {item.label}
              </span>
            )}
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

  useEffect(() => {
    if (!sticky || !slot) return;
    // On narrow screens show the current page; ancestors remain reachable
    // by swiping the trail or tabbing through its links.
    const trail = slot.querySelector('nav');
    if (trail) trail.scrollLeft = trail.scrollWidth;
  }, [sticky, slot, items]);

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
      {sticky &&
        slot &&
        createPortal(
          <BreadcrumbTrail
            items={items}
            compact
          />,
          slot,
        )}
    </>
  );
}
