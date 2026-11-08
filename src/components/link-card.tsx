import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

export function LinkCard({
  href,
  title,
  description,
  external = false,
}: {
  href?: string;
  title: string;
  description?: string;
  // Another site: opens in a new tab, marked with an icon.
  external?: boolean;
}) {
  const content = (
    <>
      <span className='flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100'>
        {title}
        {external && (
          <ExternalLink
            aria-hidden
            className='size-3.5 text-zinc-400 dark:text-zinc-500'
          />
        )}
      </span>
      {description && (
        <span className='mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400'>
          {description}
        </span>
      )}
    </>
  );

  if (!href) {
    return (
      <div className='block h-full rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 px-4 py-3 opacity-60'>
        {content}
      </div>
    );
  }

  const className =
    'block h-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600';

  if (external) {
    return (
      <a
        href={href}
        target='_blank'
        rel='noopener noreferrer'
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
    >
      {content}
    </Link>
  );
}
