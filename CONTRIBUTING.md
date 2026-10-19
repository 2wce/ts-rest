# Contributing

Use Node 26.12.0 (see `.nvmrc`) and pnpm 12.14.0. Run `nvm use` and
`pnpm install --frozen-lockfile`. Vite+ is pinned locally; no global CLI is needed.

## Commands

- `pnpm build`: build published libraries with Vite+.
- `pnpm test` / `pnpm test:watch`: library and example unit tests.
- `pnpm typecheck`: compile strict and non-strict inference assertions.
- `pnpm test:packages`: verify built ESM/CommonJS exports, declarations,
  Nest injection metadata and React client boundaries. Run `pnpm build` first.
- `pnpm lint`: Oxlint. Existing `any`/unused-variable checks remain warnings.
- `pnpm format` / `pnpm format:check`: Oxfmt.
- `pnpm build:examples`: build framework examples with native commands.
- `pnpm --filter example-nest dev`: build, run and restart the Nest example.
- `pnpm example-microservice:serve`: run microservice development tasks.
- `make e2e`: isolated Nest, Express and validator compatibility fixtures.

Vite+ caches package scripts through `vp run`. Workspace dependencies determine
ordering. Build artifacts stay in `dist/libs/ts-rest` for Changesets releases.

## Host integration examples

Azure and Cloudflare host smoke tests are explicit: `pnpm test:hosts`.
Azure Functions Core Tools remains installed by the root workspace as before.
Build the Azure example before its host test. Serverless adapter unit tests run
directly against the SDK request and context objects.

## Documentation

The current documentation is the Next.js project in `apps/docs`. Install its own
pinned dependencies with `bun install` from `apps/docs`, then run `pnpm docs:start` or `pnpm docs:build`.

## Releases

Changesets versions source manifests. The library build generates release
manifests with existing public peer ranges and conditional exports. Release CI
publishes the packages under `dist/libs/ts-rest`. Do not publish from a source
package directory.
