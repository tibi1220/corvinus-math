#!/usr/bin/env node
// Imports the LaTeX sources of a newly published week from the course's old
// working folder (`source` in src/lib/catalog.ts, e.g. ../MATH-FOR-FINANCE/
// week-9/) into content/<course>/week-NN/: the files listed in the catalog and
// every file they \input.
//
// content/ is the source of truth: a file that already exists there is never
// overwritten. If the working folder has a different version, a warning says
// so; edit the file in content/ instead.
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
let differing = 0;
for (const course of courses) {
  for (const week of course.weeks) {
    if (week.documents.length === 0) continue;
    const from = path.resolve(ROOT, course.source, `week-${week.number}`);
    const to = path.join(CONTENT_DIR, course.dir, weekDir(week));
    if (!existsSync(from)) continue;
    const files = new Set();
    for (const document of week.documents) {
      if (!existsSync(path.join(from, document.file))) continue;
      for (const file of await dependencies(from, document.file)) {
        files.add(file);
      }
    }
    await fs.mkdir(to, { recursive: true });
    for (const file of files) {
      const source = await fs.readFile(path.join(from, file));
      const target = path.join(to, file);
      const existing = await fs.readFile(target).catch(() => null);
      if (existing) {
        if (!existing.equals(source)) {
          differing++;
          console.warn(
            `kept ${path.relative(ROOT, target)} (the copy in ${path.relative(ROOT, from)} differs; content/ is the source of truth)`,
          );
        }
        continue;
      }
      await fs.writeFile(target, source);
      copied++;
      console.log(`imported ${path.relative(ROOT, target)}`);
    }
  }
}
console.log(
  `${copied} file(s) imported into ${path.relative(ROOT, CONTENT_DIR)}/` +
    (differing ? `, ${differing} kept as they are` : ''),
);
