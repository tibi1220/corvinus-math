<p align="center">
  <img src="src/app/icon.svg" width="72" alt="Corvinus Math logo">
</p>

<h1 align="center">Corvinus Math</h1>

<p align="center">
  Slides, exercise sheets and detailed solutions for the math courses I teach
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
- **Read online or download**: exercise sheets and solutions are converted to
  HTML (typeset math, figures, colored boxes, table of contents); every document
  is also a PDF.
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

| Document               | Source file             | Shown as           |
| ---------------------- | ----------------------- | ------------------ |
| Slides                 | `beamer.tex`            | slide viewer + PDF |
| Exercises              | `handout.tex`           | web page + PDF     |
| Exercises w/ solutions | `handout-solutions.tex` | web page + PDF     |

A week folder also holds lecturer-only files, tracked in git but never
published, because only the documents listed in the catalog are built:

```text
content/math-for-finance/week-08/
├── beamer.tex, handout*.tex        # published
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

| Command        | What it does                                                                        |
| -------------- | ----------------------------------------------------------------------------------- |
| `pnpm sync`    | Import a new week's sources from the old working folder (never overwrites)          |
| `pnpm dev`     | Content watcher and development server                                              |
| `pnpm content` | Compile the content only (`--force` ignores the cache, `--verbose` logs every step) |
| `pnpm build`   | Compile the content, then build the static site into `out/`                         |
| `pnpm lint`    | ESLint                                                                              |
| `pnpm format`  | Prettier                                                                            |

### How the pipeline works

[`scripts/build-content.mjs`](scripts/build-content.mjs) turns `content/` into
everything the site needs:

1. Each document (with its `\input` files inlined) is compiled with `lualatex`
   to a PDF, written to `public/downloads/`.
2. Documents are converted to HTML with [lwarp](https://ctan.org/pkg/lwarp);
   TikZ pictures become inline SVGs, colored boxes (tcolorbox) get classes by
   their frame color, and the math is rendered with [KaTeX](https://katex.org/)
   at build time, using the macros the document defines. The result goes to
   `src/generated/content.json`.
3. The pages of each slide deck are rendered to PNG images in `public/slides/`.

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
