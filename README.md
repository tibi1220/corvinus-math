<p align="center">
  <img src="src/app/icon.svg" width="72" alt="Corvinus Math logo">
</p>

<h1 align="center">Corvinus Math</h1>

<p align="center">
  Slides, study guides and exercises with detailed solutions for the math
  courses I teach
  at Corvinus University of Budapest.
  <br>
  <a href="https://corvinus.tibi1220.hu/"><strong>corvinus.tibi1220.hu</strong></a>
</p>

---

Every document is written in LaTeX. A build pipeline turns them into a static
website and into downloadable PDFs, so the same source serves both.

## Features

- **Courses and weeks**: each course lists the weeks I teach; a week opens once
  its materials are published.
- **Read online or download**: study guides (key formulas and every exercise
  with a detailed solution) are converted to HTML (typeset math, figures,
  colored boxes, table of contents); every document is also a PDF.
- **Exercises one by one**: every exercise, numbered by week (8.1, 8.2, …), with
  its topics as tags to filter by and its solution on demand, on each week's
  page and in one collection for the whole course (filter by week and topic; for
  now only in development, `page.dev.tsx`, while a single week is published;
  `pnpm build` leaves out its PDFs too). Both are also plain PDFs, without
  solutions and with each solution right after its exercise; the course PDFs
  join the weekly ones.
- **Slide viewer**: beamer decks are shown page by page (arrow keys, full
  screen, shareable page links), and downloadable as PDF.
- **Typeset math**: formulas rendered with KaTeX in STIX Two, the font of the
  PDFs; TikZ figures are rendered to SVG.
- **Light and dark theme**, no JavaScript needed to read the content.

Currently covered: **Mathematics for Finance** (MSc), week 8.

## Writing content

All sources live in this repository, in `content/<course>/week-NN/`, and are
edited here. The documents to publish are listed in
[`src/lib/catalog.ts`](src/lib/catalog.ts), week by week:

| Document             | Source file               | Shown as                                  |
| -------------------- | ------------------------- | ----------------------------------------- |
| Slides               | `beamer.tex`              | slide viewer + PDF                        |
| Study guide          | `study-guide.tex`         | web page + PDF                            |
| Exercises            | `exercises-solutions.tex` | web page, exercise by exercise; plain PDF |
| Exercises (PDF only) | `exercises.tex`           | plain PDF, without solutions              |

### Exercises

Every exercise is a file of its own in the week's `exercises/` folder,
`NN-slug.tex`: `NN` is its number within the week (`01-license-plates.tex` is
Exercise 8.1 in week 8), the slug is how the documents refer to it. Finance
examples are ordinary exercises with the tag `finance`, so all exercises share
one numbering. A file starts with a docstring, then holds every version of the
exercise:

```latex
% ---
% title: PIN codes
% tags: finance, counting, permutations
% ---

\begin{problem}
  \begin{context} Background, left out on the slides. \end{context}
  The statement.
\end{problem}

\begin{slides}            % one frame of the deck (repeat for more frames)
  \small \exstatement \pause \sol The short solution on the slide.
\end{slides}

\begin{solution}
  The detailed solution.
\end{solution}
```

The documents place them with `\exerciseframe{slug}` (slides),
`\studyexercise{slug}` (study guide), `\scriptexercise{slug}` (script) and
`\allexercises` (`exercises.tex`, `exercises-solutions.tex`), and refer to them
with `Exercise~\exref{slug}`, so renumbering an exercise only means renaming its
file.
[`exercises/macros.tex`](content/math-for-finance/week-08/exercises/macros.tex)
documents the format; `exercises/exercises.lua` reads the docstrings (LuaLaTeX).

A week folder also holds lecturer-only files, tracked in git but never
published, because only the documents listed in the catalog are built:

```text
content/math-for-finance/week-08/
├── beamer.tex, study-guide*.tex    # published
├── exercises.tex                   # published: plain PDF without solutions
├── exercises-solutions.tex         # published: plain PDF with solutions, Exercises page
├── exercises/                      # one file per exercise, plus macros.tex
├── document-info.tex               # PDF properties and date of every document
├── script.tex                      # read-aloud teaching script (not published)
├── script-print.tex                # printable script, without the background boxes
└── audio/
    ├── script-spoken.txt           # text-to-speech version of script.tex
    └── script-print-spoken.txt     # text-to-speech version of script-print.tex
```

Compile a lecturer-only document with `latexmk script-print.tex` inside its
folder (the `build/` output is ignored by git).

To publish a new week, give it `documents: weekDocuments()` in the catalog. If
its sources are still in the old working folder (`source` in the catalog, e.g.
`../MATH-FOR-FINANCE/week-9/`), `pnpm sync` imports them once; it never
overwrites a file that is already in `content/`.

## Development

Requirements:

- [Node.js](https://nodejs.org/) 24 or newer and [pnpm](https://pnpm.io/) (the
  version pinned in `package.json`)
- A TeX Live installation with `lualatex` and `lwarp`, and `pdftotext`,
  `pdftoppm` and `pdfinfo` from [Poppler](https://poppler.freedesktop.org/)

```sh
pnpm install
pnpm dev        # http://localhost:3000
```

| Command        | What it does                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------ |
| `pnpm sync`    | Import a new week's sources from the old working folder (never overwrites)                             |
| `pnpm dev`     | Content watcher and development server                                                                 |
| `pnpm content` | Compile the content only (`--force` ignores the cache, `--verbose` logs every step)                    |
| `pnpm build`   | Compile the content (`--production`: no development-only PDFs), then build the static site into `out/` |
| `pnpm lint`    | ESLint                                                                                                 |
| `pnpm format`  | Prettier                                                                                               |

### How the pipeline works

[`scripts/build-content.mjs`](scripts/build-content.mjs) turns `content/` into
everything the site needs:

1. Each document (with its `\input` files inlined, and the week's `exercises/`
   folder next to it) is compiled with `lualatex` to a PDF, written to
   `public/downloads/`.
2. Documents are converted to HTML with [lwarp](https://ctan.org/pkg/lwarp);
   TikZ pictures become inline SVGs, colored boxes (tcolorbox) get classes by
   their frame color, and the math is rendered with [KaTeX](https://katex.org/)
   at build time, using the macros the document defines. The result goes to
   `src/generated/content.json`. The HTML of `exercises-solutions.tex` is split
   into exercises, with the titles and tags of their docstrings.
3. The pages of each slide deck are rendered to PNG images in `public/slides/`.

The PDFs are published under names without a date, so links never change:
`downloads/math-for-finance/week-08/math-for-finance_week-08_slides.pdf`, and
`downloads/math-for-finance/math-for-finance_exercises.pdf` for the course-wide
exercises. The download links save them with the date their sources last
changed, `math-for-finance_week-08_slides_20261111.pdf`: the date of the last
commit that touched any of the document's files, or the day a file was saved if
it has uncommitted changes. The same date is printed on the title page of every
PDF ("Last updated: November 11, 2026") and stored in its properties, next to
the author (with email address), title, subject and keywords: hyperref, set in
each week's `document-info.tex` (compiled locally, the date is today).

Everything is cached by the hash of its source in `node_modules/.cache/lwarp`,
so only changed documents are recompiled. All generated output is ignored by
git.

The site itself is a [Next.js](https://nextjs.org/) static export, styled with
[Tailwind CSS](https://tailwindcss.com/). It is built on the same design as
[BME Matek](https://github.com/tibi1220/bme-math).

## Deployment

Every push to `main` runs
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): it compiles the
content in a TeX Live container, builds the site and publishes it to GitHub
Pages. To set it up on a new repository, choose **GitHub Actions** as the source
under **Settings → Pages**, with `corvinus.tibi1220.hu` as the custom domain.
The site is built for the root of that domain.
