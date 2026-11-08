import { THEME_STORAGE_KEY } from '@/lib/theme';

// Everything the site stores in the visitor's browser. The site sets no
// cookies; the cookie policy (/cookies) lists these items, so add every new
// one here.

export const storedItems: {
  key: string;
  purpose: string;
  value: string;
}[] = [
  {
    key: THEME_STORAGE_KEY,
    purpose: 'Remembers the chosen theme (light or dark).',
    value: '"light" or "dark"',
  },
];
