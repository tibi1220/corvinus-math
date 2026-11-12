import type { Metadata } from 'next';
import { Geist, STIX_Two_Text } from 'next/font/google';
import Link from 'next/link';
import { Footer } from '@/components/footer';
import { ThemeToggle } from '@/components/theme-toggle';
import { absoluteUrl, siteDescription, siteName } from '@/lib/site';
import { THEME_SCRIPT } from '@/lib/theme';
import 'katex/dist/katex.min.css';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
});

// Formulas use STIX Two, like the PDFs (fontsetup with stixtwo).
const stixTwo = STIX_Two_Text({
  variable: '--font-stix-two',
  subsets: ['latin', 'latin-ext', 'greek'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  // Relative URLs in the metadata (canonical, Open Graph) resolve against it.
  metadataBase: new URL(absoluteUrl('/')),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    'Corvinus University of Budapest',
    'Mathematics for Finance',
    'probability',
    'combinatorics',
    'exercises',
    'solutions',
    'slides',
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang='en'
      data-theme='light'
      // Smooth scrolling (globals.css) is for in-page links only; Next.js
      // turns it off while navigating between pages.
      data-scroll-behavior='smooth'
      // The inline script below may switch data-theme before hydration.
      suppressHydrationWarning
      className={`${geistSans.variable} ${stixTwo.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className='flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100'>
        <header className='site-header sticky top-0 z-50 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'>
          <div className='mx-auto flex h-16 max-w-3xl items-center justify-between gap-3 px-4'>
            <Link
              href='/'
              data-site-title
              className='min-w-0 truncate font-semibold tracking-tight'
            >
              {siteName}
            </Link>
            <div
              id='header-breadcrumbs'
              className='min-w-0 flex-1 empty:hidden'
            />
            <div className='shrink-0'>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className='relative mx-auto w-full max-w-3xl flex-1 px-4 py-8'>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
