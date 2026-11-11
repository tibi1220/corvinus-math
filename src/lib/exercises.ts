// The exercises of a week, one by one (the Exercises page). Kept apart from
// content.ts, which loads all generated content, so that client components
// can use it.

// One exercise (exercises/NN-slug.tex in the week's folder): its number (8.1),
// title and tags from the docstring, and the statement and solution as HTML.
export type Exercise = {
  number: string;
  slug: string;
  title: string;
  tags: string[];
  problem: string;
  solution: string;
};

// The anchor of an exercise on the Exercises page: 8.1 → exercise-8-1.
export function exerciseAnchor(exercise: { number: string }) {
  return `exercise-${exercise.number.replace('.', '-')}`;
}

// How a tag is shown: permutations-with-repetition → permutations with
// repetition.
const TAG_LABELS: Record<string, string> = {
  'de-morgan': 'De Morgan’s laws',
  'venn-diagrams': 'Venn diagrams',
  'inclusion-exclusion': 'inclusion–exclusion',
};

export function tagLabel(tag: string) {
  return TAG_LABELS[tag] ?? tag.replaceAll('-', ' ');
}
