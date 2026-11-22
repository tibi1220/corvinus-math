import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GameOfLife } from '@/components/game-of-life';

// Unmatched URLs show this page; the static export writes it to 404.html.
// Next.js adds <meta name="robots" content="noindex"> by itself.
export const metadata: Metadata = {
  title: 'Page not found',
};

export default function NotFound() {
  return (
    <section className='relative isolate flex min-h-[26rem] h-[calc(100dvh-16rem)] items-center justify-center overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4'>
      <GameOfLife className='absolute inset-0 -z-10 size-full text-zinc-200 dark:text-zinc-700/70' />
      <div className='max-w-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-900/85 px-6 py-5 text-center shadow-sm backdrop-blur-sm'>
        <p className='font-mono text-sm text-zinc-500 dark:text-zinc-400'>
          404
        </p>
        <h1 className='mt-1 text-2xl font-semibold tracking-tight'>
          Page not found
        </h1>
        <p className='mt-2 text-zinc-600 dark:text-zinc-400'>
          This page does not exist or has moved. Meanwhile, the cells in the
          background keep living by Conway&rsquo;s rules.
        </p>
        <Link
          href='/'
          className='mt-4 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 transition-colors hover:border-zinc-400 dark:hover:border-zinc-500'
        >
          <ArrowLeft
            aria-hidden
            className='size-4'
          />
          Back to the home page
        </Link>
      </div>
    </section>
  );
}
