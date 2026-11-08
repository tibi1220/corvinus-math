@AGENTS.md

# Content conventions

- The website and all documents are in US English.
- The LaTeX sources are written in ../MATH-FOR-FINANCE/week-N/ and copied here
  with `pnpm sync`; edit them there, not in content/.
- Only the documents listed in src/lib/catalog.ts are published. The lecturer's
  read-aloud script (script.tex) and the audio must never be.

# Build cache

`scripts/build-content.mjs` caches every converted document by content hash
(`node_modules/.cache/lwarp`). Do not bump `PIPELINE_VERSION` unless the
conversion output really changes; prefer changes after the cache.

- Never commit or push unless asked.
