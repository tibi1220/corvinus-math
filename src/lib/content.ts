import generated from '@/generated/content.json';
import { withBasePath } from '@/lib/base-path';
import type { Exercise } from '@/lib/exercises';
import {
  courses as courseInfos,
  weekSlug,
  pdfName,
  type CourseInfo,
  type DocumentInfo,
  type WeekInfo,
} from '@/lib/catalog';

// A heading of a document for its table of contents: a section (level 1) or
// a subsection (level 2). The title is HTML, as it may contain math.
export type TocEntry = {
  id: string;
  level: number;
  number: string;
  title: string;
};

// A PDF the pipeline wrote: its size in bytes, and when its sources last
// changed (YYYY-MM-DD).
type PdfInfo = { size: number; modified: string };

// What the content pipeline (scripts/build-content.mjs) wrote for a document.
type GeneratedDocument = {
  slug: string;
  kind: string;
  // When its sources last changed (YYYY-MM-DD).
  modified: string;
  // The size of the PDF in bytes (0: no PDF, as for the exercises).
  size: number;
  // Documents: the HTML and its table of contents.
  html?: string;
  toc?: TocEntry[];
  // Slides: the number of pages and their width / height.
  pages?: number;
  aspect?: number;
  // Exercises: one by one, in number order.
  exercises?: Exercise[];
};

// A recording of a lecturer's document, in the private build only: the slug
// of the document it reads aloud, its file in public/audio and its size.
export type Audio = { document: string; file: string; size: number };

type GeneratedCourse = {
  slug: string;
  // The PDF of every exercise of the course (all weeks), if any.
  collections?: Record<string, PdfInfo>;
  weeks: {
    number: number;
    audio?: Audio[];
    documents: GeneratedDocument[];
  }[];
};

const generatedCourses: GeneratedCourse[] = generated.courses;

export type Document = DocumentInfo & Omit<GeneratedDocument, 'kind'>;

export type Week = Omit<WeekInfo, 'documents'> & {
  slug: string;
  // Only the documents the pipeline has built; empty for a week that is not
  // published yet.
  documents: Document[];
  // The recordings of the lecturer's documents (private build only).
  audio: Audio[];
};

export type Course = Omit<CourseInfo, 'weeks'> & {
  weeks: Week[];
  // The PDF of every exercise of the course (all weeks), if any.
  // The PDFs of every exercise of the course (all weeks), by name:
  // exercises, exercises-solutions.
  collections: Record<string, PdfInfo>;
};

function buildCourse(info: CourseInfo): Course {
  const data = generatedCourses.find(course => course.slug === info.slug);
  return {
    ...info,
    collections: data?.collections ?? {},
    weeks: info.weeks.map(week => {
      const built = data?.weeks.find(w => w.number === week.number);
      const documents = week.documents.flatMap(document => {
        const result = built?.documents.find(d => d.slug === document.slug);
        return result ? [{ ...document, ...result, kind: document.kind }] : [];
      });
      return {
        ...week,
        slug: weekSlug(week),
        documents,
        audio: built?.audio ?? [],
      };
    }),
  };
}

export const courses: Course[] = courseInfos.map(buildCourse);

export function getCourse(slug: string) {
  return courses.find(course => course.slug === slug);
}

export function getWeek(course: Course, slug: string) {
  return course.weeks.find(week => week.slug === slug);
}

export function isPublished(week: Week) {
  return week.documents.length > 0;
}

export function courseHref(course: Course) {
  return `/${course.slug}`;
}

// The exercises of every week of a course (empty if none is published).
export function courseExercises(course: Course) {
  return course.weeks.flatMap(week => weekExercises(week)?.exercises ?? []);
}

// Every exercise of the course, week by week.
export function exercisesHref(course: Course) {
  return `/${course.slug}/exercises`;
}

export function weekHref(course: Course, week: Week) {
  return `/${course.slug}/${week.slug}`;
}

export function documentHref(course: Course, week: Week, document: Document) {
  return `${weekHref(course, week)}/${document.slug}`;
}

// A downloadable PDF: the link (without a date, so it stays the same) and the
// name the browser saves it under, with the date it was last modified:
// math-for-finance_week-8_slides_20261111.pdf.
export type Download = { href: string; filename: string; size: number };

function download(
  course: Course,
  week: Week | null,
  document: string,
  pdf: PdfInfo,
): Download {
  const name = pdfName(course.slug, week, document);
  const folder = week ? `${course.slug}/${week.slug}` : course.slug;
  return {
    href: withBasePath(`/downloads/${folder}/${name}.pdf`),
    filename: `${name}_${pdf.modified.replaceAll('-', '')}.pdf`,
    size: pdf.size,
  };
}

// The attributes of a download link: <a {...downloadLink(file)}>.
export function downloadLink(file: Download) {
  return { href: file.href, download: file.filename };
}

// The PDF of a document of a week.
export function documentDownload(
  course: Course,
  week: Week,
  document: Document,
) {
  return download(course, week, document.pdf ?? document.slug, document);
}

// The plain PDFs of the exercises, without and with solutions.
export type ExerciseDownloads = {
  exercises?: Download;
  solutions?: Download;
};

// ... of a week,
export function weekExerciseDownloads(
  course: Course,
  week: Week,
): ExerciseDownloads {
  const find = (pdf: string) => {
    const document = week.documents.find(d => d.pdf === pdf);
    return document && documentDownload(course, week, document);
  };
  return {
    exercises: find('exercises'),
    solutions: find('exercises-solutions'),
  };
}

// ... and of the whole course.
export function courseExerciseDownloads(course: Course): ExerciseDownloads {
  const find = (name: string) => {
    const pdf = course.collections[name];
    return pdf && download(course, null, name, pdf);
  };
  return {
    exercises: find('exercises'),
    solutions: find('exercises-solutions'),
  };
}

// The documents that have a page of their own (not the PDF-only ones).
export function pages(week: Week) {
  return week.documents.filter(document => document.kind !== 'pdf');
}

// The lecturer's own documents of a week (private build only).
export function lecturerDocuments(week: Week) {
  return week.documents.filter(document => document.lecturer);
}

// The URL of a recording.
export function audioHref(course: Course, week: Week, audio: Audio) {
  return withBasePath(`/audio/${course.slug}/${week.slug}/${audio.file}`);
}

// The image of a slide (pages count from 1).
export function slideImageHref(
  course: Course,
  week: Week,
  document: Document,
  page: number,
) {
  return withBasePath(
    `/slides/${course.slug}/${week.slug}/${document.slug}/${page}.png`,
  );
}

// The exercises of a week, if the week has them.
export function weekExercises(week: Week) {
  return week.documents.find(document => document.kind === 'exercises');
}

// "Week 8: Combinatorial analysis, ...", or "Week 9" for a week without a
// title yet.
export function weekHeading(week: Week) {
  return week.title ? `${weekLabel(week)}: ${week.title}` : weekLabel(week);
}

// "Week 8"
export function weekLabel(week: { number: number }) {
  return `Week ${week.number}`;
}

// "1.2 MB"
export function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
