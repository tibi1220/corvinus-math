// Styles the HTML produced by lwarp (paragraphs, enumerate/itemize lists with
// inline .listmarker spans, tables, pictures, colored boxes) and the KaTeX
// output inside it.
export const lwarpClasses = [
  'math-document min-w-0 leading-relaxed text-zinc-800 dark:text-zinc-200',
  '[&_p]:my-2',
  '[&_ul]:my-3 [&_ul]:space-y-2',
  '[&_li]:relative [&_li]:pl-7 [&_li>p:first-child]:-indent-7',
  '[&_li_p]:my-1 [&_li_p:first-child]:mt-0',
  '[&_.listmarker]:inline-block [&_.listmarker]:w-7 [&_.listmarker]:indent-0 [&_.listmarker]:font-medium',
  '[&_.katex]:indent-0',
  // An item that starts with display math gets its marker in a paragraph of
  // its own; collapse it so the marker sits next to the formula.
  '[&_li>p.listmarker-only]:my-0',
  '[&_li>p.listmarker-only>.listmarker]:absolute [&_li>p.listmarker-only>.listmarker]:left-0',
  '[&_li>p.listmarker-only+p]:mt-0',
  '[&_li>p.listmarker-only+p>.katex-display:first-child]:mt-0',
  '[&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1',
  // Pictures (TikZ) that lwarp rendered to SVG.
  '[&_.center]:my-3 [&_.center]:text-center',
  '[&_.lateximage]:inline-block [&_.lateximage]:h-auto [&_.lateximage]:max-w-full',
  // In the dark theme the pictures are inverted; turning the hue back keeps
  // their colors (blue stays blue). Blending with the page makes the white
  // background take the page's color.
  '[&_.lateximage]:mix-blend-darken',
  'dark:[&_.lateximage]:invert dark:[&_.lateximage]:hue-rotate-180 dark:[&_.lateximage]:mix-blend-lighten',
].join(' ');

// The colored boxes of the documents (tcolorbox), by the color of their frame
// in the PDF: navy for exercises, teal for finance examples and answers, gold
// for remarks, slate for key formulas (see BOX_TONES in
// scripts/build-content.mjs).
const boxClasses = [
  '[&_.box]:my-5 [&_.box]:overflow-hidden [&_.box]:rounded-lg [&_.box]:border',
  '[&_.box-title]:px-4 [&_.box-title]:py-1.5 [&_.box-title]:font-semibold [&_.box-title]:text-white [&_.box-title_p]:my-0',
  '[&_.box-body]:px-4 [&_.box-body]:py-1.5',
  '[&_.box_.box]:my-3',
  // Navy: exercises.
  '[&_.box-navy]:border-[#18304B]/60 [&_.box-navy]:bg-[#18304B]/[0.04] [&_.box-navy>.box-title]:bg-[#18304B]',
  'dark:[&_.box-navy]:border-sky-900 dark:[&_.box-navy]:bg-sky-950/20 dark:[&_.box-navy>.box-title]:bg-sky-900',
  // Teal: finance examples and answers.
  '[&_.box-teal]:border-teal-700/60 [&_.box-teal]:bg-teal-50/60 [&_.box-teal>.box-title]:bg-teal-700',
  'dark:[&_.box-teal]:border-teal-800 dark:[&_.box-teal]:bg-teal-950/30 dark:[&_.box-teal>.box-title]:bg-teal-800',
  // Gold: remarks, common mistakes.
  '[&_.box-gold]:border-amber-600/60 [&_.box-gold]:bg-amber-50/70 [&_.box-gold]:text-[0.95em]',
  'dark:[&_.box-gold]:border-amber-900/70 dark:[&_.box-gold]:bg-amber-950/30',
  // Slate: key formulas.
  '[&_.box-slate]:border-slate-400 [&_.box-slate]:bg-white [&_.box-slate>.box-title]:bg-slate-500',
  'dark:[&_.box-slate]:border-slate-700 dark:[&_.box-slate]:bg-zinc-900 dark:[&_.box-slate>.box-title]:bg-slate-700',
  '[&_.box-plain]:border-zinc-300 dark:[&_.box-plain]:border-zinc-700',
].join(' ');

// A whole document (a study guide): sections, boxes, figures
// and tables, on top of lwarpClasses.
export const documentClasses = [
  lwarpClasses,
  boxClasses,
  // Justified like the PDF, with hyphenation (the page is lang="en").
  'text-justify hyphens-auto',
  // The table of contents jumps here; leave some room above the heading.
  '[&_h4]:scroll-mt-8 [&_h5]:scroll-mt-8',
  '[&_h4]:mt-12 [&_h4]:mb-4 [&_h4]:text-xl [&_h4]:font-semibold [&_h4]:tracking-tight [&_h4]:text-zinc-900 dark:[&_h4]:text-zinc-100',
  '[&_h5]:mt-10 [&_h5]:mb-3 [&_h5]:text-lg [&_h5]:font-semibold [&_h5]:text-zinc-900 dark:[&_h5]:text-zinc-100',
  '[&_.sectionnumber]:text-zinc-400 dark:[&_.sectionnumber]:text-zinc-500',
  // Tables (booktabs rules) and side-by-side minipages.
  '[&_table]:mx-auto [&_table]:my-4 [&_td]:px-3 [&_td]:py-1.5',
  '[&_tr.tbrule]:border-t [&_tr.tbrule]:border-zinc-400 [&_tr.hline]:border-t [&_tr.hline]:border-zinc-300 dark:[&_tr.tbrule]:border-zinc-500 dark:[&_tr.hline]:border-zinc-700',
  '[&_.minipage]:inline-block [&_.minipage]:max-w-full [&_.minipage]:align-top',
  '[&_a[href^="mailto:"]]:underline [&_kbd]:font-mono [&_kbd]:text-[0.9em]',
  '[&_a[href^="#"]]:underline [&_a[href^="#"]]:decoration-zinc-400 [&_a[href^="#"]]:underline-offset-2',
].join(' ');
