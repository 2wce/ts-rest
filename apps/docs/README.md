# Documentation

The docs use TanStack Start, Fumadocs MDX and Vite+. All documentation pages
are prerendered into static HTML, with a browser search index. Deployment does
not require a Node server.

Use the repository's Node version and pnpm 12.14.0. Install from the repository
root; docs belongs to the pnpm workspace and shares the root lockfile.

```sh
nvm use
pnpm install --frozen-lockfile
pnpm docs:dev
```

Open http://localhost:3000. Build and preview production from the root:

```sh
pnpm docs:build
pnpm --filter @ts-rest/docs test
pnpm docs:start
```

`docs:start` previews the built site. Development and preview tasks are never
cached. Package scripts also support `pnpm --filter @ts-rest/docs dev`, `build`,
`start` and `typecheck`. The build includes uncached native TypeScript checking. The root esbuild catalog
peer keeps docs and the root Vite+ CLI on the same Vite runtime.

## Content and code examples

- `content/docs`: Markdown/MDX and navigation metadata. URLs remain rooted at `/`.
- `src/lib/source.ts`: Fumadocs macro collection and navigation source.
- `src/routes/$.tsx`: Page loading, metadata and documentation layout.
- `src/routes/api/search[.]json.ts`: Search index generated during prerendering.
- `source.config.ts`: Frontmatter validation, syntax highlighting and Twoslash.
- `vite.config.ts`: Vite+ tasks, plugins and static prerendering.

Fumadocs Twoslash 4 uses the workspace's native TypeScript 7 compiler integration.
Checked snippets retain diagnostics, hover types and completion popups. Examples
compile against the local workspace SDKs for the fork's unreleased major version.
They resolve `zod` to the modern Zod 3 `zod3` alias, while Fumadocs itself uses Zod 4.
The migration guide explains the validator-independent defaults and explicit
`/zod3` compatibility imports. The hidden nested-router setup in `client/fetch.mdx` preserves literal
paths with `as const` to avoid the SDK's inference regression on newer compilers.
Do not disable diagnostics to accommodate SDK or compiler upgrades.

## Static deployment and analytics

Upload `apps/docs/dist/client` to a static host that serves directory `index.html`
files, for example `/client/fetch/index.html` at `/client/fetch`. Search reads the
prerendered `/api/search.json`; client navigation does not call a backend. Unknown
client routes show the app's 404 view. Configure your host to serve the generated
`404.html` with status 404 for unknown direct URLs. Vite preview's SPA fallback
is for local testing; restart preview after rebuilding.

Analytics settings are public Vite variables, embedded during the build:

- `VITE_POSTHOG_KEY`: enables browser analytics. Without a key, analytics stays off.
- `VITE_POSTHOG_HOST`: ingestion URL, default `https://eu.i.posthog.com`.

Replace the previous `NEXT_PUBLIC_POSTHOG_*` environment variables. The Next
`/ingest` proxy is gone; supply a full proxy URL as the host if your deployment
uses one. Cookie consent still controls persistent storage.

References: [TanStack prerendering](https://tanstack.com/start/latest/docs/framework/react/guide/static-prerendering),
[Fumadocs Vite integration](https://www.fumadocs.dev/docs/mdx/vite), and
[Fumadocs static deployment](https://www.fumadocs.dev/docs/deploying/static).
