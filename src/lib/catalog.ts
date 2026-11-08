// Display names and URL slugs for everything under content/. The content
// pipeline (pnpm content) reads the documents listed here; a week without
// documents is shown on the course page, but cannot be opened yet.

// How a document is shown on the website:
// - 'document': converted to HTML with lwarp (readable on the page, with a
//   table of contents), and published as a PDF;
// - 'slides': a beamer deck, published as a PDF and shown on the page as
//   images of its pages.
export type DocumentKind = 'document' | 'slides';

export type DocumentInfo = {
  // The URL slug, also the name of the PDF: slides → slides.pdf.
  slug: string;
  // The main .tex file in the week's folder. Files it \input's must be next
  // to it; they are inlined before compiling.
  file: string;
  kind: DocumentKind;
  title: string;
  description: string;
};

export type WeekInfo = {
  number: number;
  title: string;
  // What the week covers, shown on the course page.
  topics: string;
  // Empty until the week's materials are published.
  documents: DocumentInfo[];
};

export type CourseInfo = {
  slug: string;
  // The folder in content/.
  dir: string;
  name: string;
  description: string;
  // The old working folder that `pnpm sync` imports new weeks from (it never
  // overwrites content/, the source of truth), relative to
  // this repository.
  source: string;
  weeks: WeekInfo[];
};

// The three documents of a regular week: slides, exercises, solutions.
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
      slug: 'exercises',
      file: 'handout.tex',
      kind: 'document',
      title: 'Exercises',
      description: 'The exercise sheet, without solutions',
    },
    {
      slug: 'solutions',
      file: 'handout-solutions.tex',
      kind: 'document',
      title: 'Exercises with solutions',
      description: 'Every exercise with a detailed solution',
    },
  ];
}

export const courses: CourseInfo[] = [
  {
    slug: 'math-for-finance',
    dir: 'math-for-finance',
    name: 'Mathematics for Finance',
    description: 'MSc · Probability theory, weeks 8–12',
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
        title:
          'Probability, conditional probability, discrete random variables',
        topics:
          'Axioms of probability, conditional probability, Bayes’ formula, odds, independence, discrete random variables',
        documents: [],
      },
      {
        number: 10,
        title: 'Continuous random variables, joint distributions',
        topics:
          'Densities, uniform, exponential and normal distributions, joint distributions, independence of random variables',
        documents: [],
      },
      {
        number: 11,
        title: 'Sums of random variables, limit theorems',
        topics:
          'Sums of random variables, covariance, correlation, the law of large numbers, the central limit theorem',
        documents: [],
      },
      {
        number: 12,
        title: 'Review and the fourth midterm',
        topics: 'Review of weeks 8–11 and a mock midterm',
        documents: [],
      },
    ],
  },
];

// The folder of a week in content/<course>/, and its URL slug: week-08 and
// week-8.
export function weekDir(week: { number: number }) {
  return `week-${String(week.number).padStart(2, '0')}`;
}

export function weekSlug(week: { number: number }) {
  return `week-${week.number}`;
}
