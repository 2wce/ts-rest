# Example database

Private PostgreSQL database package shared by the Nest and Next examples. It
owns the existing Post schema, Prisma CLI and generated client. The published
ts-rest libraries do not depend on it.

## Generate the client

From the workspace root:

```sh
pnpm examples:generate
```

Generation does not connect to PostgreSQL. It writes the client and native engine
to `generated/client` inside this package. Vite+ restores that output from its
cache when the schema and dependencies are unchanged. Workspace installation
does not generate it.

Nest/Next build and development tasks, full unit tests and lint/check commands
depend on generation. Core builds and direct core tests do not. Applications
import `PrismaClient` and `Post` from `@ts-rest/example-database`.

## Run a database example

Set `DATABASE_URL` in your shell to your PostgreSQL connection string, then
create the example tables:

```sh
pnpm --filter @ts-rest/example-database exec prisma db push
pnpm nest
# Or start the Next example:
pnpm --filter example-next dev
```

`prisma db push` changes the configured database schema; use a development
database. The application processes inherit `DATABASE_URL` from your shell.
Controller tests mock their post services and do not require a running database.

## Build one example

```sh
pnpm --filter example-nest build
pnpm --filter example-next build
```

Nest runs from its local `dist` directory and keeps this package external, so the
generated client's engine paths stay valid.
