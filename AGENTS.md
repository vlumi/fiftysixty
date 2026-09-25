# Development rules

The same rules as [nebulosa](https://github.com/vlumi/nebulosa), whose toolchain this repo copies. Read [SCOPE.md](SCOPE.md) for what is being built and [ARCHITECTURE.md](ARCHITECTURE.md) for how.

## Commits and pull requests

- Incremental, honest history: each commit is one coherent step that builds and makes sense on its own, one concern per commit.
- Pull requests are sized by concern too: not padded with unrelated changes, not split into fragments that only make sense together. No huge blobs, no tiny noise (fix-typo-in-previous-commit churn). Squash locally *before* pushing.
- Commit messages describe the step, not the process.
- Every concrete chunk of work is a branch and a pull request against `main`, rebased on `main` before pushing. Rewriting and force-pushing an open PR branch to keep its history clean is fine; `main` is never rewritten. The bootstrap was committed directly; everything since goes through a PR.
- Gate a push on `npm run lint && npm run lint:md && npm run format:check && npm test && npm run build`, which is what CI runs, plus `npm run test:e2e` when the map or the page changed.

## Comments

- Minimal. A comment only where the code cannot be made to say it; prefer renaming and refactoring over explaining.
- No narration ("increment counter"), no changelog comments, no restating types.

## Code

- Clean and well-structured, but built iteratively: working first, then dedicated cleanup and review rounds. Don't gold-plate mid-feature; do flag debt worth a cleanup pass.
- en-US throughout: code, comments, docs, interface.
- Data parsing lives in pure modules with tests on real rows; the map and panels read the store, never the CSVs.
- The data files are fetched, never committed; `public/data/` is gitignored. Region geometry and the interconnector table are committed, since they are small and hand-curated.

## Documentation

- Markdown paragraphs are one line each; the editor wraps. `.markdownlint.jsonc` encodes this.
- When a milestone lands, mark it done in SCOPE.md, move its design from *Planned* to *Built* in ARCHITECTURE.md, and add a capture to `docs/screenshots/` with `scripts/screenshot.mjs`: a numbered desktop and phone pair, an entry at the top of its README, and the README's own captures replaced with the new pair.
