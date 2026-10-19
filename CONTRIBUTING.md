# Contributing

Use Node 26.12.0 (see `.nvmrc`) and pnpm 12.14.0. Run `nvm use` and
`pnpm install --frozen-lockfile`. Vite+ is pinned locally; no global CLI is needed.

## Commands

- `pnpm build`: build published libraries with Vite+.
- `pnpm test` / `pnpm test:watch`: library and example unit tests.
- `pnpm check`: format, type-aware lint and native TypeScript checks, then
  unit tests and inference assertions.
- `pnpm typecheck`: run seven isolated strict/non-strict inference projects
  with the native TypeScript 7 compiler; these checks always run uncached.
- `pnpm test:packages`: verify built ESM/CommonJS exports, declarations,
  Nest injection metadata and React client boundaries. Run `pnpm build` first.
- `pnpm lint`: Oxlint with native type checking. Existing lint debt remains
  warnings; compiler errors fail the command.
- `pnpm format` / `pnpm format:check`: Oxfmt.
- `pnpm build:examples`: build framework examples with native commands.
- `pnpm nest`: generate the example database client, build, run and restart Nest.
- `pnpm exec vp run example-next#dev`: generate the client and start Next.
- `pnpm exec vp run example-nest#build` / `example-next#build`: build one database example.
- `pnpm example-microservice:serve`: run microservice development tasks.
- `make e2e`: isolated Nest, Express and validator compatibility fixtures.

Vite+ caches build scripts through `vp run`. Inference checks use `--no-cache`: a
negative probe showed native compiler file reads were not fully captured on this
host, so automatic caching could replay success after a new failing assertion. Workspace dependencies determine
ordering. Build artifacts stay in `dist/libs/ts-rest` for Changesets releases.

## Shared configuration

`tsconfig.base.json` contains common compiler settings. Root presets specialize
it for libraries, tests, declaration packing, Node examples and browser examples:
`tsconfig.library.json`, `tsconfig.test.json`, `tsconfig.pack.json`,
`tsconfig.node.json` and `tsconfig.web.json`.

The presets use TypeScript's `${configDir}` variable for standard source/test
globs, so inherited patterns select files in the consuming package. Package
configs only declare exceptions, such as Node types, JSX behavior and the
non-strict fixture. Public libraries retain source/test solution references to
keep Node and Vitest globals out of their portable declaration projects. Vite+
owns build ordering; these references are for editor/checker project selection,
and are not a `tsc --build` pipeline. Source-only private libraries and Node
examples need one config. Next retains its framework-specific config.

`tools/vite/library.ts` shares the library pack task and its explicit cache
inputs/outputs. Package Vite configs declare entry points; React Query also
declares its combined declaration config and v5 cache inputs. Pack overrides use
Vite's `mergeConfig`. `tools/vite/pack.ts` owns public artifacts and the shared
Node example pack preset. `tools/vite/swc.ts` shares the Nest decorator transform.
Root Vitest settings are inherited by library projects with `extends: true`.

## Workspace packages and dependencies

Workspace packages export their TypeScript source files. Unit tests and examples
consume those exports directly, so normal development does not require a library
build or TypeScript path aliases. The React Query v5 subpath re-exports the
isolated v5 workspace; its release build uses `tsconfig.react-query-pack.json`
to include both source trees in native declaration generation.

Declare example dependencies in the package that uses them. Runtime imports go
in `dependencies`, tooling/tests/types in `devDependencies`, and local packages
use `workspace:*`. Use `catalog:` for versions shared through
`pnpm-workspace.yaml`. Published library dependencies and peer ranges keep their
consumer-facing version specs. Shared test tooling stays at the root.

The workspace compiler is TypeScript 7.0.2, with Node types 26.6.5. The
`typescript-legacy` alias pins 5.2.2 solely to check published declarations with
older consumers. Next 13 and the Vue example also select that same 5.2.2 version
locally because their build tools use the classic JavaScript compiler API.
The pnpm `packageExtensions` entry declares Vue SFC compiler's missing
TypeScript peer, so it resolves the example's local compiler automatically.
No custom compiler registration or native bridge is needed. The ts-rest Vue
adapter itself builds and checks with TypeScript 7. The Vue example's `.ts`
files are checked by the native workspace checker; this does not add `.vue`
template type checking.

Standalone `test-projects` keep their own compiler versions and run through
`make e2e`; they are excluded from the root native lint checker. The non-strict
fixture retains its own compiler settings. New type-aware lint rules start as
warnings; the unbound-method rule is disabled in specs because assertions on
mock methods do not invoke those methods. There is no blanket compiler-error
suppression.

TypeScript 7 uses its native language server. The old VS Code `typescript.tsdk`
setting has been removed because this package no longer contains the classic
JavaScript editor SDK.

## Example database

`libs/example-database` owns the shared PostgreSQL schema, Prisma CLI and client
for Nest and Next. Those applications depend on `@ts-rest/example-database`;
published ts-rest libraries do not. Workspace installation does not generate a
Prisma client. `pnpm examples:generate` generates it explicitly. Vite+ task
dependencies also generate it before Nest/Next build and development tasks and
before the full `pnpm test`, `pnpm lint` and `pnpm check` workflows. Generated
client files and engines stay inside the private package and are ignored by Git,
lint and formatting.

`pnpm build` and `pnpm exec vp test run --project core` do not run generation.
To install only core and its dependencies, use
`pnpm --filter @ts-rest/core... install --frozen-lockfile` in a fresh checkout.
The [database README](libs/example-database/README.md) describes PostgreSQL setup.

## Example build outputs

All example build outputs stay in their application directory. Vite and Vite+
packing use their built-in `dist` default; Wrangler's dry-run build writes to
local `dist`, and Next keeps its local `.next` output. Node example start/watch
commands and Azure's function entry point resolve those local files. This lets
Node resolve dependencies from the owning application's `node_modules`.

Workspace discovery excludes `dist`, `.next` and generated-client directories,
so artifact manifests never become additional workspace packages.

Published libraries still build into `dist/libs/ts-rest`, the release staging
layout used by Changesets and standalone compatibility fixtures.

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
