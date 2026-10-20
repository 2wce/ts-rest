# Contributing

Use Node 26.12.0 (see `.nvmrc`) and pnpm 12.14.0. Run `nvm use` and
`pnpm install --frozen-lockfile`. Vite+ is pinned locally; no global CLI is needed.

## Command roles

Use `pnpm install` to manage dependencies and `pnpm <script>` as the user and CI
entry point. Workspace scripts use `vp` for builds, tests, checks and task
orchestration. When a workspace workflow calls another script, use `vp run`
so Vite+ can expand its task graph and preserve prerequisites and caching.
Use `pnpm exec` for one-off tools and `pnpm --filter <package> <script>` for
individual packages.

The docs app is part of the same pnpm workspace; root docs scripts select its
Vite+ tasks. Bun remains in consumer compatibility fixtures that explicitly
test Bun installs, builds and runtime behavior. It is not needed for normal
workspace development or documentation.

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
- `pnpm --filter example-next dev`: generate the client and start Next.
- `pnpm --filter example-nest build` / `pnpm --filter example-next build`:
  build one database example.
- `pnpm example-microservice:serve`: run microservice development tasks.
- `make e2e`: isolated Nest, Express and validator compatibility fixtures.

Vite+ caches build scripts through `vp run`. Inference checks use `--no-cache`: a
negative probe showed native compiler file reads were not fully captured on this
host, so automatic caching could replay success after a new failing assertion. Workspace dependencies determine
ordering. Build artifacts stay in `dist/libs/ts-rest` for Changesets releases.

## Example commands

All eleven example apps expose `build` and `dev` package scripts. From the
repository root, use `pnpm --filter <package-name> build` or
`pnpm --filter <package-name> dev`. Server examples also expose `start` where
there is a built application to run; build them first.

Nest and Next use thin script aliases to Vite+ `build-app` and `dev-app` tasks.
Those tasks generate the shared database client before invoking the framework
command. Vite+ expands nested task calls and preserves prerequisite ordering.
Use `pnpm exec vp run <package-name>#build` or `#dev` for the same task graph.

Microservice package names share the `example-microservice-` prefix, so
`pnpm example-microservice:serve` selects both services and all three frontends.
The users/posts services use ports 5002/5003; React, Solid and Vue use
5004/5005/5006 respectively. React and Solid call the posts service. Vue calls
the Nest blog API on port 3334; configure its database and run `pnpm nest`
separately when using Vue. See the
[database setup](libs/example-database/README.md#run-a-database-example).

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

The private `@ts-rest/build-config` workspace package shares the library pack
task, cache inputs/outputs, public artifact generation, Node example pack preset
and Nest decorator transform. Consumers declare it in `devDependencies` as
`workspace:*` and import presets by package name. It owns its Vite+/SWC tooling
and exports TypeScript source directly, so it needs no build task. Its source,
manifest and compiler config are explicit library build cache inputs.

Package Vite configs declare entry points; React Query also declares its combined
declaration config and v5 cache inputs. Pack overrides use Vite's `mergeConfig`.
Root `vite.config.ts` owns workspace orchestration, and library Vitest projects
inherit its settings with `extends: true`. The [build-config README](libs/build-config/README.md)
describes the presets. Release staging and package consumer checks remain under
`tools/vite`.

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
The current workspace framework baselines are Next 16.4.2 and Nest 12.2.0
(with Swagger 12.0.2). Nest tests use the matching platform adapters and their
local Fastify 5.12.7 dependency. The standalone Fastify adapter retains its 4.x
baseline. Nest 9/10/11 compatibility fixtures keep their separate installations.
The docs' published SDK examples use local Nest 11 dependencies.

Contracts keep `:param?` optional path syntax. The Nest adapter registers
concrete path alternatives through Nest's built-in path arrays so the same
contract works with older Express versions, Express 5 and Fastify. Native
framework route priority still applies: Express follows registration order,
while Fastify prioritizes static segments. Avoid ambiguous optional paths such
as `/:region?/users/:id?`: `/users/users` binds `region` on Express and `id` on
Fastify. This middle-optional path was previously unsupported on Fastify.

OpenAPI generation and its root tests share `@anatine/zod-openapi` 1.14.2 and
`openapi3-ts` 2.x. Moving to newer OpenAPI type majors requires a separate
consumer compatibility review. Path inference tests use exact `Equal`/`Expect`
assertions from the core test helpers. Runtime builds inline helpers; no direct
`tslib` or SWC helpers dependency is needed.

The root also declares esbuild 0.28.2 as a catalog toolchain peer so Vite+ and
TanStack plugins resolve the same Vite runtime across root and docs. Without
that shared peer, pnpm can create separate runtime copies whose development
environment classes are incompatible.

The workspace compiler is TypeScript 7.0.2, with Node types 26.6.5. The
`typescript-legacy` alias pins 5.2.2 solely to check published declarations with
older consumers. The Vue example also selects 5.2.2 locally for its classic
compiler API. Next 16 and the Nest Swagger example select TypeScript 5.9.3
through the `classic-tooling` catalog because their integrations still need the
JavaScript compiler API. Library builds and workspace checks use TypeScript 7.
The pnpm `packageExtensions` entry declares the Vue SFC compiler's missing
TypeScript peer. Each app resolves its local compiler and React types
automatically.
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

## Release automation

Releases are paused while the fork groundwork lands. Pushes to `main` do not
trigger the stable release workflow, and both stable and prerelease jobs are
blocked, including manual runs. Build/test CI remains active. Changesets and
release scripts stay in place for a future release.

To resume releases, restore the `push` trigger for `main` in
`.github/workflows/release.yml` and remove the `if: ${{ false }}` job guards from
both release workflows.

## Host integration examples

Azure and Cloudflare host smoke tests are explicit: `pnpm test:hosts`. Vite+
builds the Azure example before running the tests, including on a fresh checkout.
The tests launch the hosts through the Azure `start` and Cloudflare `dev` package
scripts. Azure Functions Core Tools remains installed by the root workspace as
before. Serverless adapter unit tests run directly against the SDK request and
context objects.

## Documentation

The documentation in `apps/docs` uses TanStack Start and Fumadocs on Vite+.
The root workspace installation and lockfile own its dependencies. Twoslash 4
uses the native TypeScript 7 integration, so docs shares the catalog compiler.
Published SDK snippets resolve Zod 3 through an alias; Fumadocs tooling uses
Zod 4. Keep snippet diagnostics enabled. The hidden nested-router setup in the
fetch example uses literal path annotations for the published SDK's inference
regression on newer compilers.

```sh
pnpm install --frozen-lockfile
pnpm docs:dev
pnpm docs:build
pnpm --filter @ts-rest/docs test
pnpm docs:start
```

`docs:build` prerenders every content URL and `/api/search.json` into
`apps/docs/dist/client`, then runs native type checking. The docs build/typecheck task is uncached, so
new source type errors cannot be hidden by an incomplete native compiler cache. `docs:start` previews
that static production output. Dev and preview tasks are uncached. Docs remains
outside the main library lint/format scope and has its own build/type checks and
static output regression tests, also run in CI.

Deploy the client output on a static host with directory index support; no
search or application server is required. Set `VITE_POSTHOG_KEY` and optionally
`VITE_POSTHOG_HOST` at build time to enable analytics. The old Next environment
names and `/ingest` rewrites no longer apply. See [the docs app README](apps/docs/README.md)
for content structure and hosting details.

## Releases

Changesets versions source manifests. The library build generates release
manifests with existing public peer ranges and conditional exports. Release CI
publishes the packages under `dist/libs/ts-rest`. Do not publish from a source
package directory.
