# Project Overview

This is a static blog project named "audio-review" built using the `astro-erudite` template. It uses [Astro](https://astro.build/) for its core framework, [React](https://react.dev/) for interactive components, and [Tailwind CSS](https://tailwindcss.com/) for styling. The content is written in [MDX](https://mdxjs.com/).

The project is configured for internationalization (i18n) with Japanese (`ja`) as the default locale and English (`en`) as a secondary locale.

## Building and Running

The following scripts are available to build and run the project:

*   **`pnpm install`**: Installs the project dependencies.
*   **`pnpm dev`**: Starts the development server at `http://localhost:1234`.
*   **`pnpm build`**: Builds the static site for production. The output is placed in the `dist/` directory.
*   **`pnpm preview`**: Previews the production build locally.
*   **`pnpm prettier`**: Formats the code using Prettier.

## Development Conventions

*   **Content:** Articles, author information are stored as MDX or Markdown files in the `src/content/` directory.
    *   Review articles are in `src/content/reviews/`.
    *   Column articles are in `src/content/columns/`.
    *   Author profiles are in `src/content/authors/`.
*   **Styling:** The project uses Tailwind CSS for styling. The color palette is defined in `src/styles/global.css`.
*   **Configuration:** The main site configuration is in `src/consts.ts`. The Astro configuration is in `astro.config.ts`.
*   **Internationalization (i18n):** The `astro.config.ts` file contains the i18n configuration. The default locale is Japanese (`ja`).
*   **Code Formatting:** Prettier is used for code formatting. Run `pnpm prettier` to format the code.
