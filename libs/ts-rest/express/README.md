# @ts-restless/express

Part of **ts-restless**, a maintained fork of [ts-rest](https://github.com/ts-rest/ts-rest) for contract-first, end-to-end typed REST in TypeScript.

The first stable release is planned as `4.0.0`, with interim `4.0.0-alpha.*` prereleases. New-scope packages are being prepared and are not published yet.

Read the [package migration and prerelease guide](https://github.com/2wce/ts-rest/blob/main/apps/docs/content/docs/ts-restless-migration.mdx) and [Standard Schema migration](https://github.com/2wce/ts-rest/blob/main/apps/docs/content/docs/standard-schema-migration.mdx). Preserve existing public API names while replacing dependencies and imports with `@ts-restless/*`.

Report bugs and prerelease feedback in [the fork's issue tracker](https://github.com/2wce/ts-rest/issues). Upstream contributor credits and MIT licence notices are preserved.

## Workspace development

From the repository root, run `pnpm --filter @ts-restless/express build` to build this library and `pnpm test` for the source test suite. Use the repository's pinned Node and pnpm versions.
