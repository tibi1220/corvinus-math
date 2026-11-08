import generated from '@/generated/content.json';
import { withBasePath } from '@/lib/base-path';
import {
  courses as courseInfos,
  weekSlug,
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

// What the content pipeline (scripts/build-content.mjs) wrote for a document.
type GeneratedDocument = {
  slug: string;
  kind: string;
  // The size of the PDF in bytes.
  size: number;
  // Documents: the HTML and its table of contents.
  html?: string;
  toc?: TocEntry[];
  // Slides: the number of pages and their width / height.
  pages?: number;
  aspect?: number;
};

type GeneratedCourse = {
  slug: string;
  weeks: { number: number; documents: GeneratedDocument[] }[];
};

const generatedCourses: GeneratedCourse[] = generated.courses;

export type Document = DocumentInfo & Omit<GeneratedDocument, 'kind'>;

export type Week = Omit<WeekInfo, 'documents'> & {
  slug: string;
  // Only the documents the pipeline has built; empty for a week that is not
  // published yet.
  documents: Document[];
};

export type Course = Omit<CourseInfo, 'weeks'> & { weeks: Week[] };

function buildCourse(info: CourseInfo): Course {
  const data = generatedCourses.find(course => course.slug === info.slug);
  return {
    ...info,
    weeks: info.weeks.map(week => {
      const built = data?.weeks.find(w => w.number === week.number);
      const documents = week.documents.flatMap(document => {
        const result = built?.documents.find(d => d.slug === document.slug);
        return result ? [{ ...document, ...result, kind: document.kind }] : [];
      });
      return { ...week, slug: weekSlug(week), documents };
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

export function weekHref(course: Course, week: Week) {
  return `/${course.slug}/${week.slug}`;
}

export function documentHref(course: Course, week: Week, document: Document) {
  return `${weekHref(course, week)}/${document.slug}`;
}

// The PDF written by the content pipeline.
export function downloadHref(course: Course, week: Week, document: Document) {
  return withBasePath(
    `/downloads/${course.slug}/${week.slug}/${document.slug}.pdf`,
  );
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

// "Week 8"
export function weekLabel(week: { number: number }) {
  return `Week ${week.number}`;
}

// "1.2 MB"
export function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
