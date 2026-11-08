'use client';

import { Moon, Sun } from 'lucide-react';
import { THEME_STORAGE_KEY } from '@/lib/theme';

// The saved theme is applied before the first paint by the inline script in
// the root layout (THEME_SCRIPT); this button only switches and saves it.
// Both icons are rendered and CSS shows the right one, so the server-rendered
// HTML never depends on the theme.
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Without storage the choice only lasts until the next page load.
    }
  }

  return (
    <button
      type='button'
      onClick={toggle}
      aria-label='Light or dark theme'
      title='Light or dark theme'
      className='rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
    >
      <Moon
        aria-hidden
        className='size-5 dark:hidden'
      />
      <Sun
        aria-hidden
        className='hidden size-5 dark:block'
      />
    </button>
  );
}
