import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { Prose } from '@/components/prose';
import { pageMetadata } from '@/lib/metadata';
import { policyDate, siteName } from '@/lib/site';
import { storedItems } from '@/lib/storage';

export const metadata: Metadata = pageMetadata({
  title: 'Cookie policy',
  description: `${siteName} uses no cookies; only the chosen theme is kept in the browser's local storage.`,
  path: '/cookies',
});

export default function CookiesPage() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Cookie policy' }]}
      />
      <PageHeader
        title='Cookie policy'
        subtitle={`Effective: ${policyDate}`}
      />
      <Prose>
        <p>
          <strong>The site uses no cookies</strong>, neither its own nor
          third-party ones. There is no tracking, analytics or advertising.
        </p>

        <h2>Local storage</h2>
        <p>
          The site keeps the following in your browser&apos;s local storage. It
          stays on your device, is never sent to a server, and does not expire:
          it is kept until you delete it.
        </p>
      </Prose>
      <div className='my-6 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'>
        <table className='w-full text-left text-sm'>
          <thead className='border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'>
            <tr>
              <th className='px-4 py-2 font-medium'>Name</th>
              <th className='px-4 py-2 font-medium'>Purpose</th>
              <th className='px-4 py-2 font-medium'>Value</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-zinc-200 dark:divide-zinc-800'>
            {storedItems.map(item => (
              <tr key={item.key}>
                <td className='px-4 py-2 font-mono whitespace-nowrap'>
                  {item.key}
                </td>
                <td className='px-4 py-2'>{item.purpose}</td>
                <td className='px-4 py-2 whitespace-nowrap'>{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Prose>
        <h2>Why is no consent asked for?</h2>
        <p>
          This item only records a choice you made yourself and is needed only
          for the feature you asked for (keeping the theme). Under the ePrivacy
          Directive (Article 5(3)), such storage needs no consent.
        </p>

        <h2>Deleting it</h2>
        <p>
          You can remove it by clearing the site&apos;s data in your browser
          settings. The site then shows the light theme again.
        </p>
        <p>
          Data handling in general is covered by the{' '}
          <Link href='/privacy'>privacy policy</Link>.
        </p>
      </Prose>
    </>
  );
}
