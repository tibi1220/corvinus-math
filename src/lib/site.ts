import { basePath } from '@/lib/base-path';
import { privateSite } from '@/lib/catalog';

// Where the site is published. The canonical URLs of the pages, the sitemap
// (app/sitemap.ts) and robots.txt (app/robots.ts) are built from it.

export const siteName = "Tibor Sándor's Math Courses";

export const siteOrigin = 'https://corvinus.tibi1220.hu';

export const siteDescription =
  'Slides, study guides and exercises with detailed solutions for the Math courses I teach at Corvinus University of Budapest.';

// The absolute URL of a route, e.g. '/math-for-finance' →
// 'https://corvinus.tibi1220.hu/math-for-finance/'. Pages are
// exported as <path>/index.html, so their URLs end with a slash.
export function absoluteUrl(path: string) {
  return `${siteOrigin}${basePath}${path.endsWith('/') ? path : `${path}/`}`;
}

// Who runs the site: named in the footer and the privacy policy, and shown as
// the contact card on the home page.
export const operator = {
  name: 'Tibor Sándor',
  role: 'Lecturer, Corvinus University of Budapest',
  email: 'tiborsandor2001@gmail.com',
  github: 'tibi1220',
  url: 'https://github.com/tibi1220',
};

export const repositoryUrl = 'https://github.com/tibi1220/corvinus-math';

// The course-wide Exercises page (every week's exercises together, with its
// PDFs): only with the private features for now (pnpm dev and the private
// build). The page itself is src/app/[course]/exercises/page.dev.tsx, which
// only they compile (see next.config.ts); this flag hides the links to it, and
// without it the pipeline does not make the PDFs.
export const showCourseExercises = privateSite;

// The anonymous feedback form (Google Forms, no sign-in, no email addresses
// collected), linked from the home page and described in the privacy policy.
export const feedbackFormUrl = 'https://forms.gle/t3w2vrRpoRdqZMZw8';

// The date the privacy and cookie policies were last changed.
export const policyDate = 'November 9, 2026';
