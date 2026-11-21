/**
 * Tailwind v4 ships its own pipeline through @tailwindcss/postcss:
 * @import resolution, vendor prefixing and CSS nesting are all built in,
 * and Next.js already minifies production CSS.
 * Adding postcss-import, autoprefixer or cssnano here would only duplicate that work.
 *
 * @type {import('postcss-load-config').Config}
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;