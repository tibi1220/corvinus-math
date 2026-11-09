import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { Prose } from '@/components/prose';
import { pageMetadata } from '@/lib/metadata';
import {
  feedbackFormUrl,
  operator,
  policyDate,
  repositoryUrl,
  siteName,
} from '@/lib/site';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy policy',
  description: `What data ${siteName} handles: no registration, tracking, analytics or cookies.`,
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <>
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }, { label: 'Privacy policy' }]}
      />
      <PageHeader
        title='Privacy policy'
        subtitle={`Effective: ${policyDate}`}
      />
      <Prose>
        <p>
          This policy explains, in line with the EU General Data Protection
          Regulation (GDPR), how {siteName} (the site) handles the data of its
          visitors.{' '}
          <strong>
            In short: the site does not collect, store or share any personal
            data.
          </strong>
        </p>

        <h2>Who runs the site</h2>
        <p>
          The site is run by {operator.name} as a private person, free of charge
          and for no commercial purpose (GitHub:{' '}
          <a href={operator.url}>{operator.github}</a>). Its source code is
          public: <a href={repositoryUrl}>{repositoryUrl}</a>.
        </p>

        <h2>What data does the site handle?</h2>
        <p>
          None. There is no registration, login or newsletter, and the site uses
          no analytics, ads, social media plugins or cookies. Every file (the
          fonts too) is served by the site itself, so your browser sends no
          requests to third parties.
        </p>

        <h2>Hosting</h2>
        <p>
          The site is served by GitHub Pages (GitHub, Inc., United States). When
          you open the site, your browser connects to GitHub&apos;s servers,
          which log visitors&apos; IP addresses for security and to run the
          service. The operator has no access to these logs. The legal basis is
          the legitimate interest in serving the site securely (GDPR Article
          6(1)(f)); the details, including the safeguards for transfers to the
          United States, are in{' '}
          <a href='https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement'>
            GitHub&apos;s privacy statement
          </a>
          .
        </p>

        <h2>Data stored in your browser</h2>
        <p>
          The site remembers the theme you chose in your browser&apos;s local
          storage. This never leaves your device, and you can delete it at any
          time; see the <Link href='/cookies'>cookie policy</Link>.
        </p>

        <h2>Email</h2>
        <p>
          If you write to the email address on the home page, your message is
          handled like any other email: it is used only to answer you and is not
          shared with anyone.
        </p>

        <h2>Anonymous feedback form</h2>
        <p>
          The home page links to an{' '}
          <a href={feedbackFormUrl}>anonymous feedback form</a>. It is not part
          of the site: it is hosted by Google Forms (Google LLC), and opening it
          takes you to Google&apos;s servers. The form does not ask for your
          name or email address, does not require signing in, and only{' '}
          {operator.name} can read the answers. They are used only to improve
          the teaching. Google&apos;s handling of the data is described in{' '}
          <a href='https://policies.google.com/privacy'>
            Google&apos;s privacy policy
          </a>
          . Anything you write in the form yourself (for example your name) is
          not anonymous, so leave it out if you want to stay anonymous.
        </p>

        <h2>Your rights</h2>
        <p>
          Under the GDPR you have the right to ask for information about the
          processing of your personal data, to have it corrected or deleted, to
          restrict its processing and to object to it. As the operator handles
          no personal data, requests about the hosting logs can be sent to
          GitHub. You can lodge a complaint with the Hungarian National
          Authority for Data Protection and Freedom of Information (
          <a href='https://naih.hu'>naih.hu</a>) or go to court.
        </p>

        <h2>Changes</h2>
        <p>
          If the way the site handles data changes, this policy is updated; the
          date it takes effect is at the top of the page.
        </p>
      </Prose>
    </>
  );
}
