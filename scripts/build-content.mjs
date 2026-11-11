#!/usr/bin/env node
// Builds everything the website needs from the LaTeX sources in content/:
//
// - documents (study guides, exercises) are converted to HTML with lwarp,
//   their math rendered with KaTeX, and written to src/generated/content.json;
// - every document and every slide deck is compiled to a PDF under
//   public/downloads/<course>/<week>/<slug>.pdf;
// - the pages of every slide deck are rendered to images under
//   public/slides/<course>/<week>/<slug>/<page>.png, for the slide viewer.
//
// The documents to build are listed in src/lib/catalog.ts. A document may
// \input other files from its folder; they are inlined before compiling. The
// exercises/ folder of a week (one file per exercise) is copied next to every
// document of that week, as the documents read it while compiling.
//
// Usage: pnpm content [--force] [--watch] [--verbose] [--production]
//
// Each converted file is cached by the hash of its (inlined) source, so only
// changed documents are recompiled. --force ignores the cache. --watch
// rebuilds whenever a .tex file under content/ changes (pnpm dev runs it next
// to next dev). --verbose (on by default with --watch) logs every step.
// --production (pnpm build) leaves out what is only shown in development: the
// course-wide exercise PDFs (see showCourseExercises in src/lib/site.ts).

import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, watch } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import katex from 'katex';
import { courses, pdfName, weekDir, weekSlug } from '../src/lib/catalog.ts';

const execFileAsync = promisify(execFile);

// Runs a command. Its stdin is closed, so that TeX stops at an error instead
// of waiting for an answer at its prompt (lwarpmk runs lualatex
// interactively).
function run(command, args, options) {
  const promise = execFileAsync(command, args, options);
  promise.child.stdin?.end();
  return promise;
}

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');
const OUT_FILE = path.join(ROOT, 'src', 'generated', 'content.json');
const CACHE_DIR = path.join(ROOT, 'node_modules', '.cache', 'lwarp');
const DOWNLOADS_DIR = path.join(ROOT, 'public', 'downloads');
const SLIDES_DIR = path.join(ROOT, 'public', 'slides');

// Bump these whenever the conversion below changes, to invalidate the cache.
const PIPELINE_VERSION = { document: '1', slides: '1' };

// The width of the slide images in pixels (2× the width they are shown at).
const SLIDE_WIDTH = 1600;

let force = process.argv.includes('--force');
const watchMode = process.argv.includes('--watch');
const verbose = watchMode || process.argv.includes('--verbose');
const production = process.argv.includes('--production');

function debug(message) {
  if (!verbose) return;
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[content ${time}] ${message}`);
}

function seconds(start) {
  const total = (performance.now() - start) / 1000;
  if (total < 60) return `${total.toFixed(1)} s`;
  return `${Math.floor(total / 60)} min ${Math.round(total % 60)} s`;
}

async function step(label, name, fn) {
  const start = performance.now();
  debug(`${label}: ${name}`);
  const result = await fn();
  debug(`${label}: ${name} done in ${seconds(start)}`);
  return result;
}

const hash = (...parts) => {
  const h = createHash('sha256');
  for (const part of parts) h.update(part);
  return h.digest('hex');
};

// ---------------------------------------------------------------------------
// Sources

// The source of a .tex file with every \input{file} (from the same folder)
// replaced by that file's source, recursively. Commented-out lines are left
// alone.
async function inlineInputs(dir, file, used = new Set(), depth = 0) {
  if (depth > 10) throw new Error(`${file}: \\input nested too deeply`);
  used.add(path.join(dir, file));
  const source = await fs.readFile(path.join(dir, file), 'utf8');
  const parts = [];
  let last = 0;
  for (const match of source.matchAll(/^([^%\n]*?)\\input\{([^}]+)\}/gm)) {
    const name = match[2].endsWith('.tex') ? match[2] : `${match[2]}.tex`;
    const start = match.index + match[1].length;
    parts.push(source.slice(last, start));
    parts.push(await inlineInputs(dir, name, used, depth + 1));
    last = match.index + match[0].length;
  }
  parts.push(source.slice(last));
  return parts.join('');
}

// ---------------------------------------------------------------------------
// Last-modified dates
//
// The date of a document is the latest date any of its sources changed: the
// date of the last commit that touched the file, or, for a file with
// uncommitted changes (or outside git), the day it was last saved. Dates are
// YYYY-MM-DD.

const isoDate = date =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

// Absolute path → date of the last commit that touched it, for the files
// under content/ without uncommitted changes.
async function commitDates() {
  const dates = new Map();
  try {
    const options = { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 };
    const log = await run(
      'git',
      ['log', '--format=format:%x00%cs', '--name-only', '--', 'content'],
      options,
    );
    let date = null;
    for (const line of log.stdout.split('\n')) {
      if (line.startsWith('\0')) date = line.slice(1);
      else if (line && date && !dates.has(path.join(ROOT, line))) {
        dates.set(path.join(ROOT, line), date);
      }
    }
    const status = await run(
      'git',
      ['status', '--porcelain', '--untracked-files=all', '--', 'content'],
      options,
    );
    for (const line of status.stdout.split('\n').filter(Boolean)) {
      dates.delete(path.join(ROOT, line.slice(3).split(' -> ').at(-1)));
    }
  } catch {
    // Not a git checkout: every file gets the day it was last saved.
  }
  return dates;
}

async function lastModified(files, dates) {
  let latest = '';
  for (const file of files) {
    const date = dates.get(file) ?? isoDate((await fs.stat(file)).mtime);
    if (date > latest) latest = date;
  }
  return latest;
}

// The files of a week's exercises/ folder, which its documents read while
// compiling (see exercises/macros.tex): [{ name, data }], sorted by name.
async function exerciseFiles(dir) {
  const folder = path.join(dir, 'exercises');
  const names = await fs.readdir(folder).catch(() => []);
  const files = [];
  for (const name of names.sort()) {
    if (name.startsWith('.')) continue;
    const data = await fs.readFile(path.join(folder, name));
    files.push({ name: `exercises/${name}`, data });
  }
  return files;
}

async function writeFiles(dir, files) {
  for (const { name, data } of files) {
    await fs.mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await fs.writeFile(path.join(dir, name), data);
  }
}

const filesHash = files =>
  hash(...files.flatMap(({ name, data }) => [name, '\0', data, '\0']));

// The exercises of a week, from the docstrings of exercises/NN-slug.tex (the
// same rules as exercises/exercises.lua): number, slug, title and tags.
function exerciseIndex(files, week) {
  const index = [];
  for (const { name, data } of files) {
    const match = /^exercises\/(\d+)-([\w-]+)\.tex$/.exec(name);
    if (!match) continue;
    const meta = {};
    let inside = false;
    for (const line of data.toString('utf8').split('\n')) {
      if (/^%\s*---\s*$/.test(line)) {
        if (inside) break;
        inside = true;
      } else if (inside) {
        const field = /^%\s*([\w-]+)\s*:\s*(.*?)\s*$/.exec(line);
        if (field) meta[field[1]] = field[2];
      } else if (/\S/.test(line)) {
        break;
      }
    }
    if (!meta.title) throw new Error(`${name} has no title in its docstring`);
    index.push({
      number: `${week.number}.${Number(match[1])}`,
      order: Number(match[1]),
      slug: match[2],
      title: meta.title,
      tags: (meta.tags ?? '').split(/[,\s]+/).filter(Boolean),
    });
  }
  return index.sort((a, b) => a.order - b.order);
}

// Splits the HTML of a week's exercise collection (exercises.tex, built from
// \collectionexercise) at the markers it prints around each exercise.
function splitExercises(html, index) {
  const marker =
    /(?:<p>\s*)?\[\[exercise:([\w-]+):(problem|solution|end)\]\](?:\s*<\/p>)?/g;
  const parts = new Map();
  let open = null;
  let last = 0;
  for (const match of html.matchAll(marker)) {
    if (open)
      parts.get(open.slug)[open.part] = html.slice(last, match.index).trim();
    const [, slug, part] = match;
    if (!parts.has(slug)) parts.set(slug, {});
    open = part === 'end' ? null : { slug, part };
    last = match.index + match[0].length;
  }
  return index.map(exercise => {
    const found = parts.get(exercise.slug);
    if (!found?.problem) {
      throw new Error(`exercise ${exercise.slug} is missing from the HTML`);
    }
    return {
      number: exercise.number,
      slug: exercise.slug,
      title: exercise.title,
      tags: exercise.tags,
      problem: found.problem,
      solution: found.solution ?? '',
    };
  });
}

// The documents of every week, from the catalog.
function discover() {
  const jobs = [];
  for (const course of courses) {
    for (const week of course.weeks) {
      for (const document of week.documents) {
        const dir = path.join(CONTENT_DIR, course.dir, weekDir(week));
        jobs.push({
          course,
          week,
          document,
          dir,
          file: path.join(dir, document.file),
          label: path.relative(ROOT, path.join(dir, document.file)),
        });
      }
    }
  }
  return jobs;
}

// ---------------------------------------------------------------------------
// Macros
//
// lwarp keeps the math as TeX, and KaTeX renders it at build time; KaTeX must
// know the macros the document defines (\newcommand{\P}{\mathbb{P}}, ...).

// The balanced {...} group starting at `start` (which must be a "{"): its
// content and the index after it.
function group(source, start) {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const char = source[i];
    if (char === '\\') {
      i++;
      continue;
    }
    if (char === '{') depth++;
    else if (char === '}' && --depth === 0) {
      return { content: source.slice(start + 1, i), end: i + 1 };
    }
  }
  return null;
}

function documentMacros(source) {
  const macros = {};
  const preamble = source.split('\\begin{document}')[0];
  const definition =
    /\\(?:re)?newcommand\*?\s*\{?(\\[A-Za-z]+)\}?\s*(?:\[(\d)\])?\s*(?=\{)/g;
  for (const match of preamble.matchAll(definition)) {
    const body = group(preamble, match.index + match[0].length);
    if (body) macros[match[1]] = body.content;
  }
  for (const match of preamble.matchAll(
    /\\DeclareMathOperator(\*?)\{(\\[A-Za-z]+)\}\{([^}]*)\}/g,
  )) {
    macros[match[2]] = `\\operatorname${match[1]}{${match[3]}}`;
  }
  return macros;
}

// ---------------------------------------------------------------------------
// lwarp

// Compiled with lualatex, like the PDFs, so the documents keep their own
// preamble. A document stays in one HTML file, and the page shows its title
// and its own table of contents, so \maketitle and \tableofcontents go.
const LWARP_PREAMBLE = [
  '\\usepackage[mathjax,HomeHTMLFilename=index]{lwarp}',
  '\\setcounter{FileDepth}{-5}',
].join('\n');

function toLwarpSource(source) {
  const withLwarp = source.replace(
    /^(\\documentclass(\[[^\]]*\])?\{[^}]*\}\s*\n)/m,
    documentclass => `${documentclass}${LWARP_PREAMBLE}\n`,
  );
  if (withLwarp === source) throw new Error('no \\documentclass found');
  return withLwarp
    .replace(/\\maketitle\b/, '')
    .replace(/\\tableofcontents\b/, '');
}

async function runLwarp(source, files, label) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'lwarp-'));
  try {
    await writeFiles(dir, files);
    await fs.writeFile(path.join(dir, 'document.tex'), toLwarpSource(source));
    const options = { cwd: dir, maxBuffer: 64 * 1024 * 1024 };
    try {
      await step(label, 'lualatex', () =>
        run(
          'lualatex',
          ['-interaction=nonstopmode', '-halt-on-error', 'document.tex'],
          options,
        ),
      );
      await step(label, 'lwarpmk html', () =>
        run('lwarpmk', ['html'], options),
      );
    } catch (error) {
      const log = await fs
        .readFile(path.join(dir, 'document_html.log'), 'utf8')
        .catch(() => fs.readFile(path.join(dir, 'document.log'), 'utf8'))
        .catch(() => '');
      error.message += `\n--- LaTeX log (tail) ---\n${log.split('\n').slice(-30).join('\n')}`;
      throw error;
    }
    const html = await fs.readFile(path.join(dir, 'index.html'), 'utf8');
    return await embedImages(html, dir, options, label);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

// lwarp turns pictures (tikzpicture, ...) into SVG files referenced from the
// HTML. They are inlined as data URIs, so content.json stays self-contained.
const LATEX_IMAGE =
  /<span\s+id="lateximage-[^"]*"\s+class="lateximagesource"\s*>(?:<!--[\s\S]*?-->)?<img\s+src="([^"]+\.svg)"[\s\S]*?><\/span>/g;

async function embedImages(html, dir, options, label) {
  const sources = [...html.matchAll(LATEX_IMAGE)].map(match => match[1]);
  if (sources.length === 0) return html;
  await step(label, `lwarpmk limages (${new Set(sources).size} pictures)`, () =>
    run('lwarpmk', ['limages'], options),
  );
  const images = new Map();
  for (const src of new Set(sources)) {
    const svg = await readFinishedSvg(path.join(dir, src));
    images.set(
      src,
      `<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" alt="" class="lateximage">`,
    );
  }
  return html.replace(LATEX_IMAGE, (_, src) => images.get(src));
}

// lwarpmk limages runs pdftocairo in the background on Unix, so wait until
// each SVG has been written completely.
async function readFinishedSvg(file, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const svg = await fs.readFile(file, 'utf8').catch(() => '');
    if (svg.trimEnd().endsWith('</svg>')) return svg;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`timed out waiting for ${path.basename(file)}`);
}

// ---------------------------------------------------------------------------
// HTML post-processing

function decodeNumericEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function unescapeHtml(text) {
  return decodeNumericEntities(text)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function extractFragment(html) {
  const start = html.search(/<a id="[^"]*-autopage-1"><\/a>/);
  const end = html.search(/<a id="[^"]*-autofile-last"><\/a>/);
  if (start === -1 || end === -1) throw new Error('unexpected lwarp output');
  // Keep the anchors of \label (targets of \ref links), drop lwarp's own.
  return html.slice(start, end).replace(/<a id="[^"]*auto[^"]*"><\/a>/g, '');
}

function renderTex(tex, displayMode, macros) {
  return katex.renderToString(tex, {
    displayMode,
    macros: { ...macros },
    throwOnError: true,
    strict: errorCode =>
      errorCode === 'unicodeTextInMathMode' || errorCode === 'symbolNotInFont'
        ? 'ignore'
        : 'warn',
    output: 'htmlAndMathml',
  });
}

function renderMath(html, macros) {
  return html.replace(
    /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g,
    (_, display, inline) =>
      renderTex(
        unescapeHtml(display ?? inline).trim(),
        display !== undefined,
        macros,
      ),
  );
}

// The colored boxes (tcolorbox) come with inline styles in the colors of the
// PDF. They get a class by their frame color instead, so the website can
// style them for both themes (see lwarp-classes.ts).
const BOX_TONES = {
  '#18304B': 'navy',
  '#00787D': 'teal',
  '#BE8214': 'gold',
  '#5D6E81': 'slate',
};

function boxes(html) {
  return html
    .replace(
      /<div\s+class="tcolorbox"\s+style="[^"]*border: 1px solid (#[0-9A-F]{6})[^"]*"\s*>/g,
      (_, color) => `<div class="box box-${BOX_TONES[color] ?? 'plain'}">`,
    )
    .replace(
      /<div\s+class="(tcolorboxtitle|tcolorboxupper)"\s+style="[^"]*"\s*>/g,
      (_, kind) =>
        `<div class="${kind === 'tcolorboxtitle' ? 'box-title' : 'box-body'}">`,
    );
}

function tidy(html, macros) {
  return (
    boxes(html)
      // A list item that starts with display math gets its marker in a
      // paragraph of its own; the class lets the website place it.
      .replace(
        /<p>\s*(<span class="listmarker">[^<]*<\/span>)\s*<\/p>/g,
        '<p class="listmarker-only">$1</p>',
      )
      .replace(
        /<ul class="(enumerate|itemize)" style="list-style-type:none">/g,
        '<ul class="$1">',
      )
      // \href{mailto:\myemail}: lwarp leaves the macro in the link.
      .replace(/href="mailto:\\([A-Za-z]+)\s*"/g, (match, name) =>
        macros[`\\${name}`] ? `href="mailto:${macros[`\\${name}`]}"` : match,
      )
      .replace(/(<span class="listmarker">[^<]*<\/span>)\s+/g, '$1')
      // \ref links point into lwarp's own HTML files.
      .replace(/href="[^"#]*\.html#/g, 'href="#')
      .replace(/<p>\s*<\/p>/g, '')
      .replace(/\n{2,}/g, '\n')
      .trim()
  );
}

function toFragment(lwarpHtml, macros) {
  // pdftotext yields decomposed accents; recompose them.
  const fragment = decodeNumericEntities(extractFragment(lwarpHtml)).normalize(
    'NFC',
  );
  return tidy(renderMath(fragment, macros), macros);
}

// The sections (level 1) and subsections (level 2), for the table of
// contents. lwarp sets them as <h4> and <h5>, with the number in a span of its
// own; the title is kept as HTML, as it may contain math.
function tableOfContents(html) {
  return [...html.matchAll(/<h([45]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map(
    ([, level, id, inner]) => {
      const number = /<span class="sectionnumber">([^<]*)<\/span>/.exec(inner);
      return {
        id,
        level: level === '4' ? 1 : 2,
        number: number?.[1].trim() ?? '',
        title: inner.replace(number?.[0] ?? '', '').trim(),
      };
    },
  );
}

// ---------------------------------------------------------------------------
// Line breaks around inline math (from the BME Matek pipeline): punctuation
// that touches a formula is moved into it, so a line cannot start with it.

function spanEnd(html, start) {
  const tags = /<\/?span\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let tag; (tag = tags.exec(html));) {
    depth += tag[0][1] === '/' ? -1 : 1;
    if (depth === 0) return tag.index + tag[0].length;
  }
  return html.length;
}

const INLINE_MATH = '<span class="katex">';
const FORMULA_END = '</span></span></span>';
const FIRST_BOX =
  /<span class="katex-base"><span class="katex-strut"[^>]*><\/span>/;
const punctuation = text => `<span class="math-punct">${text}</span>`;
const isWordChar = char => !/[\s<>]/.test(char);
function wordBefore(text) {
  let i = text.length;
  while (i > 0 && isWordChar(text[i - 1])) i--;
  return text.slice(i);
}
const WORD_AFTER = /[^\s<>]*/y;
function wordAfter(text, i) {
  WORD_AFTER.lastIndex = i;
  return WORD_AFTER.exec(text)[0];
}

function glueMathPunctuation(html) {
  let out = '';
  let rest = 0;
  for (
    let start = html.indexOf(INLINE_MATH);
    start !== -1;
    start = html.indexOf(INLINE_MATH, rest)
  ) {
    const end = spanEnd(html, start);
    let before = html.slice(rest, start);
    let math = html.slice(start, end);
    let post = '';
    if (!before.endsWith('<span class="katex-display">')) {
      const pre = wordBefore(before);
      post = wordAfter(html, end);
      if (pre && FIRST_BOX.test(math)) {
        before = before.slice(0, before.length - pre.length);
        math = math.replace(FIRST_BOX, box => box + punctuation(pre));
      }
      if (post && math.endsWith(FORMULA_END)) {
        math = `${math.slice(0, -FORMULA_END.length)}${punctuation(post)}${FORMULA_END}`;
      } else {
        post = '';
      }
    }
    out += before + math;
    rest = end + post.length;
  }
  return out + html.slice(rest);
}

// ---------------------------------------------------------------------------
// PDFs and slide images

async function writeIfChanged(file, data) {
  const previous = await fs.readFile(file).catch(() => null);
  if (previous?.equals(data)) return false;
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, data);
  return true;
}

// Two lualatex runs resolve the table of contents and cross-references.
async function compilePdf(source, files, label, runs = 2) {
  const cached = path.join(
    CACHE_DIR,
    `${hash(`${runs}`, source, filesHash(files))}.pdf`,
  );
  const hit = await fs.readFile(cached).catch(() => null);
  if (hit && !force) return hit;

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'pdf-'));
  try {
    await writeFiles(dir, files);
    await fs.writeFile(path.join(dir, 'document.tex'), source);
    try {
      for (let i = 0; i < runs; i++) {
        await step(label, `PDF: lualatex run ${i + 1}/${runs}`, () =>
          run(
            'lualatex',
            ['-interaction=nonstopmode', '-halt-on-error', 'document.tex'],
            { cwd: dir, maxBuffer: 64 * 1024 * 1024 },
          ),
        );
      }
    } catch (error) {
      const log = await fs
        .readFile(path.join(dir, 'document.log'), 'utf8')
        .catch(() => '');
      error.message += `\n--- LaTeX log (tail) ---\n${log.split('\n').slice(-30).join('\n')}`;
      throw error;
    }
    const pdf = await fs.readFile(path.join(dir, 'document.pdf'));
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cached, pdf);
    return pdf;
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}

// The pages of a deck as PNGs (cached by the hash of the PDF): returns the
// images in page order and the page's aspect ratio (width / height).
async function slideImages(pdf, label) {
  const dir = path.join(
    CACHE_DIR,
    `slides-${PIPELINE_VERSION.slides}-${hash(pdf).slice(0, 32)}`,
  );
  if (!existsSync(path.join(dir, 'done'))) {
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, 'slides.pdf'), pdf);
    await step(label, 'slide images', () =>
      run(
        'pdftoppm',
        [
          '-png',
          '-scale-to-x',
          String(SLIDE_WIDTH),
          '-scale-to-y',
          '-1',
          'slides.pdf',
          'page',
        ],
        { cwd: dir, maxBuffer: 64 * 1024 * 1024 },
      ),
    );
    await fs.writeFile(path.join(dir, 'done'), '');
  }
  const pages = (await fs.readdir(dir))
    .filter(name => /^page-\d+\.png$/.test(name))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  const { stdout } = await run('pdfinfo', [path.join(dir, 'slides.pdf')]);
  const [, width, height] = /Page size:\s+([\d.]+) x ([\d.]+)/.exec(stdout);
  return {
    files: pages.map(name => path.join(dir, name)),
    aspect: Number(width) / Number(height),
  };
}

// ---------------------------------------------------------------------------
// Driver

async function convertDocument(source, files, label) {
  const macros = documentMacros(source);
  const cached = path.join(
    CACHE_DIR,
    `${hash(PIPELINE_VERSION.document, katex.version, source, filesHash(files))}.html`,
  );
  let html = force ? null : await fs.readFile(cached, 'utf8').catch(() => null);
  const fromCache = html !== null;
  if (!fromCache) {
    html = toFragment(await runLwarp(source, files, label), macros);
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(cached, html);
  }
  return { html: glueMathPunctuation(html), fromCache };
}

// 2026-11-11 → November 11, 2026
const longDate = iso =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

const escapeTex = text =>
  text.replace(/[&%$#_{}]/g, char => `\\${char}`).replace(/~/g, '\\~{}');

// The course-wide exercise collections, made of the PDFs of the weeks with
// the same name (see the catalog): every exercise, with and without
// solutions.
const COLLECTIONS = [
  { name: 'exercises', title: 'Exercises' },
  { name: 'exercises-solutions', title: 'Exercises with solutions' },
];

// A course-wide collection: a title page and a table of contents, then the
// PDF of every week, page by page.
async function exerciseCollection(course, collection, parts, modified, label) {
  const weeks = parts.map(job => job.week);
  const first = weeks[0].number;
  const last = weeks.at(-1).number;
  const subtitle = `${collection.title}, ${first === last ? `week ${first}` : `weeks ${first}–${last}`}`;
  const pdfDate = `D:${modified.replaceAll('-', '')}000000`;
  const files = parts.map(job => ({
    name: `week-${job.week.number}.pdf`,
    data: job.pdf,
  }));
  const includes = parts.map(
    ({ week }) =>
      `\\includepdf[pages=-,addtotoc={1,section,1,{Week ${week.number}${week.title ? `: ${escapeTex(week.title)}` : ''}},week${week.number}}]{week-${week.number}.pdf}`,
  );
  const source = [
    '\\documentclass[11pt,a4paper]{scrartcl}',
    '\\usepackage[stixtwo]{fontsetup}',
    '\\usepackage[english]{babel}',
    '\\usepackage{pdfpages}',
    '\\usepackage[a4paper,margin=2cm]{geometry}',
    '\\usepackage[hidelinks]{hyperref}',
    '\\hypersetup{',
    `  pdftitle={${escapeTex(`${course.name} – ${subtitle}`)}},`,
    `  pdfauthor={${escapeTex(`${course.lecturer.name} <${course.lecturer.email}>`)}},`,
    `  pdfsubject={${escapeTex(`${course.name}, ${subtitle}`)}},`,
    `  pdfkeywords={${escapeTex(course.keywords)}},`,
    `  pdfcreationdate={${pdfDate}},`,
    `  pdfmoddate={${pdfDate}},`,
    '  pdflang={en-US},',
    '}',
    `\\title{${escapeTex(course.name)}}`,
    `\\subtitle{${escapeTex(subtitle)}}`,
    `\\author{${escapeTex(course.lecturer.name)}\\\\[2pt]`,
    '  \\normalsize Corvinus University of Budapest\\\\',
    `  \\normalsize\\href{mailto:${course.lecturer.email}}{\\texttt{${course.lecturer.email}}}}`,
    `\\date{Last updated: ${longDate(modified)}}`,
    '\\begin{document}',
    '\\maketitle',
    '\\tableofcontents',
    ...includes,
    '\\end{document}',
    '',
  ].join('\n');
  return compilePdf(source, files, label);
}

async function mapConcurrent(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
  return results;
}

async function listFiles(dir) {
  const entries = await fs
    .readdir(dir, { recursive: true, withFileTypes: true })
    .catch(() => []);
  return entries
    .filter(e => e.isFile())
    .map(e => path.join(e.parentPath, e.name));
}

// Removes the files in `dir` that the build did not write, then the folders
// left empty.
async function prune(dir, keep) {
  for (const file of await listFiles(dir)) {
    if (!keep.has(file)) await fs.rm(file);
  }
  const folders = (
    await fs
      .readdir(dir, { recursive: true, withFileTypes: true })
      .catch(() => [])
  )
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(entry.parentPath, entry.name))
    .sort((a, b) => b.length - a.length);
  for (const folder of folders) {
    if ((await fs.readdir(folder)).length === 0) await fs.rmdir(folder);
  }
}

// Returns false when some document failed; content.json is then left as it
// was.
async function build() {
  const buildStart = performance.now();
  const jobs = discover();
  const dates = await commitDates();
  const limit = Math.max(1, Math.min(4, os.availableParallelism() - 1));
  debug(`build started: ${jobs.length} documents (${limit} in parallel)`);

  const written = new Set();
  let failed = 0;
  let compiled = 0;

  const results = await mapConcurrent(jobs, limit, async job => {
    const { course, week, document, label } = job;
    try {
      if (!existsSync(job.file)) {
        throw new Error(`${label} is missing; run pnpm sync`);
      }
      const used = new Set();
      const source = await inlineInputs(job.dir, document.file, used);
      const files = await exerciseFiles(job.dir);
      const base = path.join(course.slug, weekSlug(week), document.slug);
      const modified = await lastModified(
        [...used, ...files.map(({ name }) => path.join(job.dir, name))],
        dates,
      );

      // The date on the title page and in the PDF (see document-info.tex).
      const pdf = await compilePdf(
        `\\def\\lastmodified{${modified}}\n${source}`,
        files,
        label,
      );
      const pdfFile = path.join(
        DOWNLOADS_DIR,
        course.slug,
        weekSlug(week),
        `${pdfName(course.slug, week, document.pdf ?? document.slug)}.pdf`,
      );
      if (await writeIfChanged(pdfFile, pdf)) {
        console.log(`compiled ${path.relative(ROOT, pdfFile)}`);
      }
      written.add(pdfFile);
      const entry = {
        slug: document.slug,
        kind: document.kind,
        size: pdf.length,
        modified,
      };

      if (document.kind === 'slides') {
        const { files: images, aspect } = await slideImages(pdf, label);
        for (const [i, file] of images.entries()) {
          const target = path.join(SLIDES_DIR, base, `${i + 1}.png`);
          await writeIfChanged(target, await fs.readFile(file));
          written.add(target);
        }
        return { ...entry, pages: images.length, aspect };
      }

      if (document.kind === 'pdf') {
        job.pdf = pdf;
        job.modified = modified;
        return entry;
      }

      const { html, fromCache } = await convertDocument(source, files, label);
      if (!fromCache) {
        compiled++;
        console.log(`converted ${label}`);
      }
      if (document.kind === 'exercises') {
        job.pdf = pdf;
        job.modified = modified;
        return {
          ...entry,
          exercises: splitExercises(html, exerciseIndex(files, week)),
        };
      }
      return {
        ...entry,
        html,
        toc: tableOfContents(html),
      };
    } catch (error) {
      failed++;
      console.error(`\n✗ ${label}\n${error.message}\n`);
      return null;
    }
  });

  if (failed > 0) {
    console.error(
      `${failed} document(s) failed; ${path.relative(ROOT, OUT_FILE)} was not updated.`,
    );
    return false;
  }

  // The exercises of every week of a course in one PDF, with and without
  // solutions: course → { [name]: { size, modified } }.
  const collections = new Map();
  for (const course of production ? [] : courses) {
    for (const collection of COLLECTIONS) {
      const parts = jobs.filter(
        job =>
          job.course === course &&
          job.pdf &&
          (job.document.pdf ?? job.document.slug) === collection.name,
      );
      if (parts.length === 0) continue;
      const label = `${course.slug} ${collection.name} collection`;
      try {
        const modified = parts
          .map(job => job.modified)
          .reduce((a, b) => (a > b ? a : b));
        const pdf = await exerciseCollection(
          course,
          collection,
          parts,
          modified,
          label,
        );
        const pdfFile = path.join(
          DOWNLOADS_DIR,
          course.slug,
          `${pdfName(course.slug, null, collection.name)}.pdf`,
        );
        if (await writeIfChanged(pdfFile, pdf)) {
          console.log(`compiled ${path.relative(ROOT, pdfFile)}`);
        }
        written.add(pdfFile);
        collections.set(course, {
          ...collections.get(course),
          [collection.name]: { size: pdf.length, modified },
        });
      } catch (error) {
        console.error(`\n✗ ${label}\n${error.message}\n`);
        return false;
      }
    }
  }

  await prune(DOWNLOADS_DIR, written);
  await prune(SLIDES_DIR, written);

  const output = {
    courses: courses.map(course => ({
      slug: course.slug,
      collections: collections.get(course),
      weeks: course.weeks
        .filter(week => week.documents.length > 0)
        .map(week => ({
          number: week.number,
          documents: week.documents.map(document =>
            results.find(
              (result, i) =>
                jobs[i].course === course &&
                jobs[i].week === week &&
                jobs[i].document === document,
            ),
          ),
        })),
    })),
  };
  const json = `${JSON.stringify(output, null, 2)}\n`;
  if (await writeIfChanged(OUT_FILE, Buffer.from(json))) {
    debug(`${path.relative(ROOT, OUT_FILE)} updated`);
  }
  console.log(
    `${jobs.length} documents (${compiled} converted) → ${path.relative(ROOT, OUT_FILE)}, public/downloads, public/slides`,
  );
  debug(`build finished in ${seconds(buildStart)}`);
  return true;
}

function watchContent() {
  let timer = null;
  let running = false;
  let pending = false;

  async function rebuild() {
    if (running) {
      pending = true;
      return;
    }
    running = true;
    try {
      await build();
    } catch (error) {
      console.error(error);
    } finally {
      running = false;
      force = false;
    }
    if (pending) {
      pending = false;
      await rebuild();
    }
  }

  watch(CONTENT_DIR, { recursive: true }, (_event, filename) => {
    if (!/\.(tex|lua)$/.test(filename ?? '')) return;
    clearTimeout(timer);
    timer = setTimeout(rebuild, 200);
  });
  console.log(
    `watching ${path.relative(ROOT, CONTENT_DIR)}/ for .tex and .lua changes`,
  );
  rebuild();
}

if (watchMode) {
  watchContent();
} else if (!(await build())) {
  process.exit(1);
}
