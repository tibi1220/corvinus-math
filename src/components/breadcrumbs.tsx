import Link from 'next/link';

export type Crumb = { label: string; href?: string };

function CrumbLabel({ item }: { item: Crumb }) {
  return item.href ? (
    <Link
      href={item.href}
      className='min-w-0 truncate hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline'
    >
      {item.label}
    </Link>
  ) : (
    <span
      className='min-w-0 truncate text-zinc-900 dark:text-zinc-100'
      aria-current='page'
    >
      {item.label}
    </span>
  );
}

// The trail never scrolls sideways (no swiping or rubber-banding on phones).
// If the path does not fit, labels are cut with an ellipsis, in order of
// importance: first the crumbs in the middle (the course), then Home and the
// parent, the current page last. The flex-shrink factors are 10^4 apart, so a
// crumb loses (practically) nothing until the ones before it in that order are
// as short as they can get; a minimum width keeps at least a letter of every
// ancestor.
function shrinkClass(i: number, last: number) {
  if (i === last) return 'min-w-0 shrink';
  if (i === 0) return 'min-w-[1.75em] shrink-[10000]';
  if (i === last - 1) return 'min-w-[2.75em] shrink-[10000]';
  return 'min-w-[2.75em] shrink-[100000000]';
}

// The page's trail, shown in the header in place of the site title (see
// globals.css). The header belongs to the root layout, which cannot see the
// page's crumbs, so the page renders the trail as the first thing in <main>
// and pulls it up into the header: -mt-24 cancels main's top padding (py-8)
// and the header's height (h-16), mb-8 gives the padding back. Sticky at the
// top, it stays over the header while the page scrolls, also through
// overscroll, and it is in the server-rendered HTML, so nothing swaps in after
// loading. The right padding keeps it clear of the theme toggle (size-8 plus
// the header's gap-3). It must be the first child of the page.
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const last = items.length - 1;
  return (
    <div
      data-header-trail
      className='pointer-events-none sticky top-0 z-[60] -mt-24 mb-8 flex h-16 items-center pr-11'
    >
      <nav
        aria-label='Breadcrumb'
        className='pointer-events-auto min-w-0 text-sm text-zinc-500 dark:text-zinc-400'
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
              <CrumbLabel item={item} />
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
