Search (Pagefind) Integration

- Install: `pnpm add -D pagefind@1.4.0`
- Build index after site build via package.json `postbuild` script:
  - `pagefind --site dist --glob reviews/** --glob columns/**`
- Test: `pnpm build && pnpm preview`, then open any page and use the header magnifier or `Ctrl/⌘+K`.

Files added
- `src/components/SearchModal.astro`: Modal with Pagefind UI. Included once in `src/layouts/Layout.astro`.
- `src/components/SearchButton.astro`: Magnifier button that opens the modal. Added to `src/components/Header.astro`.

Notes
- Dev server (`pnpm dev`) won’t have an index under `/pagefind/`; run `pnpm build && pnpm preview` to test search.
- Index scope is restricted to Reviews and Columns via `--glob`. If your output paths differ, adjust patterns to match `dist` structure.
- Optional: add per-article filters for future faceting
  - Reviews: `<meta name="pagefind:filters" content="section=reviews">`
  - Columns: `<meta name="pagefind:filters" content="section=columns">`
  - Then enable UI pre-filtering by uncommenting `filters` in `SearchModal.astro`.
