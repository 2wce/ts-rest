import {
  defineConfig,
  defineDocs,
  frontmatterSchema,
  metaSchema,
} from 'fumadocs-mdx/config';
import { transformerTwoslash } from 'fumadocs-twoslash';
import { resolve } from 'node:path';
import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins';
import {
  transformerNotationDiff,
  transformerNotationHighlight,
} from '@shikijs/transformers';

// Shared frontmatter and metadata validation for the Vite MDX collection.
export const docs = defineDocs({
  docs: {
    schema: frontmatterSchema,
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash({
          twoslashOptions: {
            compilerOptions: {
              // Published SDK examples use Zod 3; Fumadocs tooling uses Zod 4.
              paths: { zod: [resolve('node_modules/zod3/index.d.ts')] },
            },
          },
        }),
        transformerNotationDiff({}),

        transformerNotationHighlight({}),
      ],
    },
  },
});
