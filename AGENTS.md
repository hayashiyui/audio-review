# Repository Guidelines

## Global Instruction
**Reason in English. reply to the user in Japanese.**

## Project Structure & Module Organization
- `src/pages`: Astro pages and routes.
- `src/components`: Reusable UI (`*.astro`, `*.tsx`).
- `src/content`: MD/MDX content collections and config.
- `src/lib`: Utilities and data helpers (TypeScript).
- `public/`: Static assets (favicons, images, fonts).
- `scripts/`: Maintenance scripts (e.g., `optimize-images.js`).
- `dist/`: Build output (generated).
- `doc/`: Additional documentation and templates.

## Build, Test, and Development Commands
- `pnpm dev` (or `pnpm dev`): Start local dev server with HMR.
- `pnpm build`: Type-check (`astro check`) then build static site to `dist/`.
- `pnpm preview`: Serve the built site from `dist/` for verification.
- `pnpm prettier`: Format `ts/tsx/css/astro` files using project Prettier config.

## Coding Style & Naming Conventions
- **Formatting**: Prettier enforced (no semicolons, single quotes). Run before commits.
- **Indentation**: 2 spaces; keep lines focused and readable.
- **Files**: Components PascalCase (`BlogCard.astro`), utilities camelCase (`data-utils.ts`), content slugs kebab-case (`focal-utopia-sg.mdx`).
- **Types**: Prefer explicit types in `src/lib` and exported APIs.
- **Imports**: Group std/libs/local; avoid deep relative chains—prefer aliases if configured.

## Testing Guidelines
- No formal test runner is configured. Validate changes by:
  - Running `pnpm build` and `pnpm preview` locally.
  - Checking `astro check` output for type/content issues.
  - Verifying pages render and MDX content (TOC, code blocks, images) behaves as expected.

## Commit & Pull Request Guidelines
- **Commits**: Imperative, concise, and scoped (e.g., "Add ReviewsCard layout").
- **Branches**: Short, kebab-case (`feature/related-articles-grid`).
- **PRs**: Include summary, motivation, screenshots for UI changes, and manual-test notes. Link related issues.
- **Checks**: Ensure `pnpm prettier`, `pnpm build`, and local preview pass before requesting review.

## Architecture & Tips
- **Stack**: Astro + MDX + React islands, Tailwind CSS v4, TypeScript.
- **Content**: Configure collections in `src/content.config.ts`; place review articles in `src/content`.
- **Images**: Prefer `public/images`. Optimize via `node scripts/optimize-images.js` when adding large assets.
- **Patches**: `patch-package` runs postinstall; commit any patch files in `patches/` if you modify dependencies.
