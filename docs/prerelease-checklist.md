# ts-restless prerelease release-PR checklist

The initial stable target is `4.0.0`; interim releases start at `4.0.0-alpha.0`. The project-owned npm organization is `ts-restless`. On 2026-11-04, authenticated npm checks confirmed `2wce` as an organization owner, and GitHub private vulnerability reporting was enabled and verified on the current fork. No packages have been published.

## Automated flow

Ordinary changes land with Changesets. After a push to `main` passes Build & Test and every isolated compatibility fixture, the prerelease job in [build-test.yml](../.github/workflows/build-test.yml) uses the Changesets action to open or update a version PR. The first version PR enters alpha mode and versions the ten public libraries to `4.0.0-alpha.0`; later Changesets advance the numbered prerelease together. The PR includes manifests, changelogs, `.changeset/pre.json` and the refreshed lockfile.

Review and merge that version PR through normal PR CI. After its exact merged commit passes the same main CI and compatibility gates, Changesets publishes unpublished versions under the tag recorded in the committed prerelease state. Alpha/beta/rc versions never use `latest`. The action filters Changesets already consumed by the prerelease state, so retained prerelease Changesets do not continually reopen the same PR. New pending Changesets update the version PR before publication.

The small [coordinator](../scripts/prerelease.mjs) validates the active prestate, allowed tag, exact public package set, namespace and matching numbered versions before building/publishing. It rejects missing/exited/stable/mixed states. Changesets owns version progression, registry checks, tagging and GitHub release creation. CLI 2.x rejects an explicit tag in active pre mode and can otherwise select `latest` for prerelease-only packages. During publication the coordinator temporarily marks the disposable checkout's prestate exited, publishes the unchanged numbered versions under the validated explicit tag, then restores the original prestate even if publication fails. The release PR and committed prerelease state stay active. The workflow serializes release work and skips a stale main commit when a newer commit awaits its own CI. Stable publishing remains paused in [release.yml](../.github/workflows/release.yml).

## Review release state and artifacts

Use the repository's pinned Node/pnpm versions. The automation runs these maintainer scripts in its disposable checkout:

```sh
pnpm prerelease:version
pnpm prerelease:verify
```

`prerelease:version` initializes alpha mode only when prestate is absent, invokes Changesets and refreshes the lockfile. Existing pending major Changesets already target v4; do not first set versions to `4.0.0` and then apply another major bump. Keep private packages private and React Query v5 bundled through public `/v5`. Do not mix snapshot timestamps into this release line. A beta/RC transition requires reviewed Changesets state and the same artifact checks.

The complete CI gates are:

```sh
pnpm check
pnpm test:packages
pnpm build:examples
pnpm test:hosts
pnpm --filter @ts-restless/docs test
```

`test:packages` builds and natively packs `dist/packages/ts-restless-<leaf>.tgz`, installs real external peers in clean consumers, and checks ESM/CJS exports, declarations, Nest metadata, React directives and validator-independent/legacy consumers. Disposable dry runs using actual fork manifests and a controlled initial major prove the first stable/alpha versions, alpha progression, native peers and rejection of unsafe prerelease states. Inspect the release PR's versions and package relationships; ignored upstream archives are not this release's artifacts.

Require all ten isolated CI fixtures to pass on the release commit: Express4/5, Nest9/10/11 and Zod3/Zod4/no-validator/Valibot/ArkType under recorded pinned combinations. Relaxed fixture compiler settings are not a strict claim for every peer version; strict packed consumers provide separate evidence. Preserve external dependency baselines and do not widen peers to permit installation.

Release notes must cover package/import migration, Standard Schema major changes and exact verified lines. F01–F05 may arrive in later prereleases: current Query v5 compatibility, Express request typing, public React19, response validation and modern OpenAPI are separate work. Current Fastify support is major4; the private Query v5 implementation's React19 peer does not widen the public peer range.

## CI authentication and activation

Verify actual ownership and private reporting:

```sh
npm whoami --registry=https://registry.npmjs.org
npm org ls ts-restless --json --registry=https://registry.npmjs.org
gh api repos/2wce/ts-rest/private-vulnerability-reporting
```

Configure npm trusted publishing for each of the ten public packages. The release job uses GitHub-hosted Ubuntu runners with `id-token: write`; pinned Node 26 provides npm 11.20.0 locally, and the job checks npm >=11.5.1. The repository's pnpm 12 publish path supports OIDC and provenance. Public registry metadata reads need no npm token.

In each package's npm settings, add a GitHub Actions trusted publisher with these exact fields:

| Field                | Value                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------- |
| Organization or user | `2wce`                                                                                      |
| Repository           | `ts-rest`                                                                                   |
| Workflow filename    | `build-test.yml`                                                                            |
| Environment name     | Leave empty; this job does not use a GitHub environment                                     |
| Allowed actions      | Enable direct `npm publish`; current new trust configurations otherwise permit staging only |

Names include all ten entries in the package migration table: core, express, fastify, nest, next, serverless, react-query, open-api, solid-query and vue-query. Keep private packages excluded. The public manifests already point to the actual fork repository, as npm requires. Package settings are case-sensitive; the workflow filename is the filename alone.

The workflow has no `NPM_TOKEN` or `NODE_AUTH_TOKEN` publishing secret. GitHub issues a short-lived OIDC identity, and the package manager exchanges it for scoped registry access. GitHub trusted publishing automatically adds provenance for these public packages/public repository; explicit npm/pnpm provenance settings retain that requirement. Local `npm whoami` is not a check of OIDC permissions. Verify the actual publication's registry provenance before declaring the setup complete.

A dedicated repository secret `RELEASE_PR_TOKEN` is still required for GitHub contents/pull-requests write access so generated release PRs trigger ordinary PR CI. It is a GitHub PR credential, independent of npm publishing. Prefer a project-owned GitHub App identity when configuring this credential. Never print or commit its value.

### First-package registration

The new package names need npm package records before their per-package trust settings can be configured. Organization ownership alone does not establish those relationships. This branch does not register packages or create bootstrap releases.

[npm staged publishing](https://docs.npmjs.com/staged-publishing/) can register new names using authenticated maintainer access: staging an unregistered name creates a publicly available `0.0.0-stage` placeholder, while the submitted contents remain staged. That placeholder changes the public package history and requires an explicit registration decision. Another bootstrap approach is an initial provenance-bearing CI publication using a short-lived bootstrap credential, followed by OIDC-only publishing. Neither bootstrap path is performed or enabled by this workflow; agree the first-registration approach before taking external publication actions.

Do not activate automation until each package has its trusted publisher configured. Current npm trust configurations must complete their first successful publish within two days or be recreated. Configure them near the ready-to-publish release, with direct publish permission, then enable the workflow. After successful OIDC publication, restrict token-based publishing in npm package settings as appropriate; do not claim that restriction is configured by this source change.

The job is default-off behind repository variable `PRERELEASE_ENABLED`. Keep it unset until the identity branch is reviewed, its full CI passes, the GitHub release-PR credential is configured, and the npm package trust relationships are ready. Then set `PRERELEASE_ENABLED=true`; the next successful main push opens/updates the release PR. Its merge and successful CI publish automatically under the recorded prerelease tag. Stable automation remains disabled.

Official requirements: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) and [pnpm publish](https://pnpm.io/cli/publish). The actual registry publish is the authentication proof; successful local tests or the presence of `id-token: write` do not establish that trust is configured.

After publication, verify every package/version and dist-tag. Update README/docs/security status from "not published yet" only after registry verification, including actual release notes. Reserve `latest` for a separately approved stable release.

## Stable exit

After selected launch fixes/support claims pass and stable publication is approved, disable the prerelease job before preparing the stable release branch:

```sh
pnpm exec changeset pre exit
pnpm version-packages-update-lockfile
```

Review the coordinated `4.0.0` state, repeat applicable checks and separately activate the stable release path. The prerelease coordinator deliberately rejects the exited/stable state. A dry run or merge alone does not publish stable packages.
