#!/usr/bin/env node
// pnpm deploy:private: builds the private version of the site, for the
// lecturer alone, and copies it to a server that serves it behind a login.
//
// The private build is the public one plus what must never be published: each
// week's read-aloud scripts (script.tex, script-print.tex) and their audio in
// the US male voice (audio/*-michael.mp3), and the pages that are otherwise
// only in development (see privateSite in src/lib/catalog.ts).
//
// Afterwards it removes out/, so the private build is only ever on the
// server. The private files it leaves in public/ are what pnpm dev shows
// anyway; pnpm build removes them before building the public site.
//
// Where it goes comes from .env.dev (not in git; .env.dev.example lists the
// settings):
//   PRIVATE_DEPLOY_HOST  the server, as ssh and rsync know it
//   PRIVATE_DEPLOY_DIR   the folder on it that holds the site
//   PRIVATE_BASE_PATH    the address the server serves that folder at
// Variables already set in the environment win over the file.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ENV_FILE = path.join(ROOT, '.env.dev');
const OUT_DIR = path.join(ROOT, 'out');

if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

// Each setting, checked: they end up in an ssh command and in every URL.
const settings = {
  PRIVATE_DEPLOY_HOST: /^[\w.@-]+$/,
  PRIVATE_DEPLOY_DIR: /^[\w.~/-]+$/,
  PRIVATE_BASE_PATH: /^(\/[\w.-]+)+$/,
};
for (const [name, pattern] of Object.entries(settings)) {
  const value = process.env[name];
  if (!value || !pattern.test(value)) {
    console.error(
      `${name} is ${value ? `not valid: ${value}` : 'not set'}. ` +
        `Set it in ${path.relative(ROOT, ENV_FILE)} (see .env.dev.example).`,
    );
    process.exit(1);
  }
}
const host = process.env.PRIVATE_DEPLOY_HOST;
const target = process.env.PRIVATE_DEPLOY_DIR.replace(/\/$/, '');
const basePath = process.env.PRIVATE_BASE_PATH;

function run(command, args, env = {}) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    throw new Error(`${command} failed (exit code ${result.status})`);
  }
}

const privateEnv = { PRIVATE_SITE: '1', PAGES_BASE_PATH: basePath };
let failed = false;
try {
  run(process.execPath, ['scripts/build-content.mjs'], privateEnv);
  run('pnpm', ['exec', 'next', 'build'], privateEnv);
  run('ssh', [host, `mkdir -p '${target}'`]);
  run('rsync', ['-az', '--delete', `${OUT_DIR}/`, `${host}:${target}/`]);
  console.log(`\nDeployed to ${host}:${target}, served at ${basePath}/`);
} catch (error) {
  failed = true;
  console.error(`\n${error.message}`);
} finally {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
