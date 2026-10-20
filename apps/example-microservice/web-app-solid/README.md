# Solid microservice example

This frontend calls the posts example service, which calls the users service.

## Running locally

From the repository root, use the Node and pnpm versions in `.nvmrc` and
`package.json`, then install the workspace dependencies:

```sh
nvm use
pnpm install --frozen-lockfile
```

Start both services and all three frontends together:

```sh
pnpm example-microservice:serve
```

Open [http://localhost:5005](http://localhost:5005). The users service listens
on port 5002 and the posts service on port 5003.

To start only this frontend, run the following from the repository root. The
backend services must already be running.

```sh
pnpm --filter example-microservice-web-app-solid dev
```

## Building

```sh
pnpm --filter example-microservice-web-app-solid build
```

The production build writes to this application's `dist` directory.
