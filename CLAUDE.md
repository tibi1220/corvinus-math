@AGENTS.md

# Content conventions

- The website and all documents are in US English.
- content/<course>/week-NN/ is the source of truth for every document of a week,
  including the lecturer-only files (script.tex, script-print.tex,
  audio/*-spoken.txt). Edit them here, never in ../MATH-FOR-FINANCE/ (the old
  working folder; `pnpm sync` only imports new weeks from it and never
  overwrites).
- Each exercise is one file, content/<course>/week-NN/exercises/NN-slug.tex
  (format: exercises/macros.tex). Exercises are numbered by week (8.1, ...), in
  topic order (the order in which the lecture covers the topics); the exercises
  that are not on the slides sit next to those of their topic, not at the end.
  Finance examples are exercises tagged `finance` and share the numbering. Refer
  to exercises with Exercise~\exref{slug}, never with a typed number. Exercises
  never mention the AK exercise collection.
- When script.tex changes, update audio/script-spoken.txt and
  audio/script-print-spoken.txt to match. Regenerate audio only when asked.
- Only the documents listed in src/lib/catalog.ts are published. The lecturer's
  read-aloud script (script.tex) and the audio must never be.

# Build cache

`scripts/build-content.mjs` caches every converted document by content hash
(`node_modules/.cache/lwarp`). Do not bump `PIPELINE_VERSION` unless the
conversion output really changes; prefer changes after the cache.

- Never commit or push unless asked.
