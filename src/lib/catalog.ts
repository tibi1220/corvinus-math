// Display names and URL slugs for everything under content/. The content
// pipeline (pnpm content) reads the documents listed here; a week without
// documents is shown on the course page, but cannot be opened yet.

// How a document is shown on the website:
// - 'document': converted to HTML with lwarp (readable on the page, with a
//   table of contents), and published as a PDF;
// - 'slides': a beamer deck, published as a PDF and shown on the page as
//   images of its pages;
// - 'exercises': every exercise of the week with its solution (built from the
//   exercise files in exercises/), split into exercises and shown on the
//   Exercises page with their tags, and published as a PDF;
// - 'pdf': only published as a PDF, with no page of its own.
export type DocumentKind = 'document' | 'slides' | 'exercises' | 'pdf';

export type DocumentInfo = {
  // The URL slug, also the name of the PDF (see pdfName) unless pdf says
  // otherwise.
  slug: string;
  pdf?: string;
  // The main .tex file in the week's folder. Files it \input's must be next
  // to it; they are inlined before compiling.
  file: string;
  kind: DocumentKind;
  title: string;
  description: string;
  // Only in the private build (see privateSite): the lecturer's own files,
  // listed apart from the published documents on the week's page.
  lecturer?: boolean;
};

export type WeekInfo = {
  number: number;
  // The title and what the week covers, shown on the course page. Left out
  // until the week's materials are ready, as they may still change.
  title?: string;
  topics?: string;
  // Empty until the week's materials are published.
  documents: DocumentInfo[];
};

export type CourseInfo = {
  slug: string;
  // The folder in content/.
  dir: string;
  name: string;
  description: string;
  // The lecturer, and keywords: the PDF properties of the course-wide exercise
  // collection. (The documents of a week set theirs in document-info.tex.)
  lecturer: { name: string; email: string };
  keywords: string;
  // The old working folder that `pnpm sync` imports new weeks from (it never
  // overwrites content/, the source of truth), relative to
  // this repository.
  source: string;
  weeks: WeekInfo[];
};

// The private build for the lecturer alone (pnpm deploy:private), served
// behind a login, and pnpm dev unless run as pnpm dev:public: it adds the
// read-aloud scripts and their audio to each week, and the course-wide
// Exercises page. Never set for the public site; the GitHub Pages workflow
// does not set it, and pnpm build refuses it.
export const privateSite = process.env.PRIVATE_SITE === '1';

// The lecturer's files of a week, only in the private build.
function lecturerDocuments(): DocumentInfo[] {
  return [
    {
      slug: 'script',
      file: 'script.tex',
      kind: 'document',
      title: 'Script',
      description: 'The read-aloud script of both sessions',
      lecturer: true,
    },
    {
      slug: 'script-print',
      file: 'script-print.tex',
      kind: 'document',
      title: 'Script, print version',
      description: 'The same script, laid out for printing',
      lecturer: true,
    },
  ];
}

// The documents of a regular week: slides, the study guide (key formulas and
// the exercises of the slides with detailed solutions), and all exercises one by one (a
// page, and plain PDFs with and without solutions).
function weekDocuments(): DocumentInfo[] {
  return [
    {
      slug: 'slides',
      file: 'beamer.tex',
      kind: 'slides',
      title: 'Slides',
      description: 'The slides of both sessions',
    },
    {
      slug: 'study-guide',
      file: 'study-guide.tex',
      kind: 'document',
      title: 'Study guide',
      description:
        'Key formulas and the exercises of the slides, each with a detailed, step-by-step solution',
    },
    {
      slug: 'exercises',
      file: 'exercises-solutions.tex',
      kind: 'exercises',
      pdf: 'exercises-solutions',
      title: 'Exercises',
      description: 'Every exercise of the week, by topic, with its solution',
    },
    {
      slug: 'exercises-pdf',
      file: 'exercises.tex',
      kind: 'pdf',
      pdf: 'exercises',
      title: 'Exercises',
      description: 'Every exercise of the week, without solutions',
    },
    ...(privateSite ? lecturerDocuments() : []),
  ];
}

export const courses: CourseInfo[] = [
  {
    slug: 'math-for-finance',
    dir: 'math-for-finance',
    name: 'Mathematics for Finance',
    description: 'MSc · Probability theory, weeks 8–12',
    lecturer: { name: 'Tibor SÁNDOR', email: 'tiborsandor2001@gmail.com' },
    keywords:
      'probability, combinatorics, mathematics for finance, Corvinus University of Budapest',
    source: '../MATH-FOR-FINANCE',
    weeks: [
      {
        number: 8,
        title: 'Combinatorial analysis, sample space, events',
        topics:
          'Counting principle, permutations, combinations, Pascal’s triangle, multinomial coefficients, sample space and events, De Morgan’s laws',
        documents: weekDocuments(),
      },
      {
        number: 9,
        title: 'Probability, conditional probability, random variables',
        topics:
          'Probability of unions and intersections, equally likely outcomes, conditional probability, Bayes’ formula, odds, independent events, discrete random variables, distribution function, expected value, standard deviation',
        documents: weekDocuments(),
      },
      {
        number: 10,
        documents: [],
      },
      {
        number: 11,
        documents: [],
      },
      {
        number: 12,
        documents: [],
      },
    ],
  },
];

// The folder of a week in content/<course>/ and its URL slug (also in the
// names of its PDFs), both with two digits: week-08.
export function weekDir(week: { number: number }) {
  return `week-${String(week.number).padStart(2, '0')}`;
}

export function weekSlug(week: { number: number }) {
  return weekDir(week);
}

// The name of a downloadable PDF, from the course, the week (none for the
// course-wide exercise collection) and the document:
// math-for-finance_week-8_slides. The file is published under this name; the
// browser saves it with the date it was last modified appended
// (math-for-finance_week-8_slides_20261111.pdf).
export function pdfName(
  course: string,
  week: { number: number } | null,
  document: string,
) {
  return [course, ...(week ? [weekSlug(week)] : []), document].join('_');
}
