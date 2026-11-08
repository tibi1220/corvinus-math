import Link from 'next/link';

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label='Breadcrumb'
      className='mb-6 text-sm text-zinc-500 dark:text-zinc-400'
    >
      <ol className='flex flex-wrap items-center gap-x-2 gap-y-1'>
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
