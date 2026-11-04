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

Configure repository secrets without printing or committing their values:

- `RELEASE_PR_TOKEN`: a dedicated GitHub credential with access to this repository and contents/pull-requests write permissions. It must trigger ordinary CI for the release PR. The default `GITHUB_TOKEN` does not trigger those PR workflows.
- `NPM_TOKEN`: npm publishing access to `@ts-restless/*`, including the initial package creation, with the noninteractive publishing requirements satisfied. Local `npm login` does not configure this CI secret. Scope and rotate this credential according to npm's supported token policy.

The workflow checks that both secrets are present before external mutations, but secret presence does not prove their permissions. Verify the chosen publishing identity and provenance configuration for the destination. A future trusted-publishing setup can replace npm token authentication after the packages and npm trust relationships exist; it is not configured by this change.

The job is default-off behind repository variable `PRERELEASE_ENABLED`. Keep it unset until the identity branch is reviewed, its full CI passes, and the credentials are configured. Then set `PRERELEASE_ENABLED=true` and the next successful main push will open/update the release PR. Publication follows its merge and successful CI automatically; there is no prerelease manual-dispatch workflow. Stable automation remains disabled.

After publication, verify every package/version and dist-tag. Update README/docs/security status from "not published yet" only after registry verification, including actual release notes. Reserve `latest` for a separately approved stable release.

## Stable exit

After selected launch fixes/support claims pass and stable publication is approved, disable the prerelease job before preparing the stable release branch:

```sh
pnpm exec changeset pre exit
pnpm version-packages-update-lockfile
```

Review the coordinated `4.0.0` state, repeat applicable checks and separately activate the stable release path. The prerelease coordinator deliberately rejects the exited/stable state. A dry run or merge alone does not publish stable packages.
