# Vue example

This frontend calls the Nest blog API on port 3334.

## Running locally

From the repository root, use the Node and pnpm versions in `.nvmrc` and
`package.json`, then install the workspace dependencies:

```sh
nvm use
pnpm install --frozen-lockfile
```

Follow the [example database setup](../../../libs/example-database/README.md#run-a-database-example)
to configure PostgreSQL and `DATABASE_URL`. Start the Nest backend in one terminal:

```sh
pnpm nest
```

In a second terminal, start this frontend:

```sh
pnpm --filter example-microservice-web-app-vue dev
```

Open [http://localhost:5006](http://localhost:5006).

`pnpm example-microservice:serve` also starts this frontend alongside the React
and Solid frontends and the users/posts services. Vue still requires the Nest
backend to be running separately.

## Building

```sh
pnpm --filter example-microservice-web-app-vue build
```

The production build writes to this application's `dist` directory.
