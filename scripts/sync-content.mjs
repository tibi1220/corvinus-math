#!/usr/bin/env node
// Copies the LaTeX sources of the published documents from the course's
// working folder (`source` in src/lib/catalog.ts, e.g. ../MATH-FOR-FINANCE/
// week-8/) into content/<course>/week-NN/: the files listed in the catalog and
// every file they \input. Lecturer-only files (the script, audio) are never
// listed, so they are never copied.
//
// Usage: pnpm sync

import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { courses, weekDir } from '../src/lib/catalog.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content');

// The files a .tex file \input's or \include's, recursively.
async function dependencies(dir, file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const source = await fs.readFile(path.join(dir, file), 'utf8');
  for (const match of source.matchAll(
    /^[^%\n]*\\(?:input|include)\{([^}]+)\}/gm,
  )) {
    const name = match[1].endsWith('.tex') ? match[1] : `${match[1]}.tex`;
    await dependencies(dir, name, seen);
  }
  return seen;
}

let copied = 0;
for (const course of courses) {
  for (const week of course.weeks) {
    if (week.documents.length === 0) continue;
    const from = path.resolve(ROOT, course.source, `week-${week.number}`);
    const to = path.join(CONTENT_DIR, course.dir, weekDir(week));
    if (!existsSync(from)) {
      console.warn(`warning: ${from} does not exist, skipped`);
      continue;
    }
    const files = new Set();
    for (const document of week.documents) {
      for (const file of await dependencies(from, document.file)) {
        files.add(file);
      }
    }
    await fs.mkdir(to, { recursive: true });
    for (const file of files) {
      const source = await fs.readFile(path.join(from, file));
      const target = path.join(to, file);
      const previous = await fs.readFile(target).catch(() => null);
      if (previous?.equals(source)) continue;
      await fs.writeFile(target, source);
      copied++;
      console.log(`copied ${path.relative(ROOT, target)}`);
    }
  }
}
console.log(
  `${copied} file(s) updated in ${path.relative(ROOT, CONTENT_DIR)}/`,
);
