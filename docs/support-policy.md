# Compatibility support and retirement policy

**Recorded:** 2026-11-04. **Status:** Adopted baseline, approved by the user on 2026-11-04. The [A01 inventory](support-inventory.md) records existing version floors, working lines, retained promises, evidence gaps and package ownership. Existing peers and compatibility fixtures remain intact. No retirement notice, removal date or new dependency floor is approved by this policy; individual changes require review under A19 of the [adapter maintenance epic](superpowers/plans/2026-11-04-adapter-maintenance-epic.md).

Support the newest verified dependency major actively, retain a previous supported major for a dated migration window, and remove compatibility in a ts-rest major release. This bounds maintenance work while giving consumers a predictable upgrade path.

## Framework versions and legacy APIs

Older dependency majors and legacy ts-rest APIs have different retirement conditions.

| Surface                                          | Replacement required before retirement                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Older Express, Nest, Fastify or Next major       | A newer supported framework line with verified runtime behavior, native lifecycle integration and public types. |
| Older query-library major                        | A supported integration for the newer major with verified query, mutation and cache behavior.                   |
| Legacy ts-rest helper, wrapper or import path    | An API that covers the supported capabilities, with buildable migration examples.                               |
| Older Zod 3 bridge or historical `/zod3` helpers | A tested migration to Standard Schema or a supported equivalent for each helper being removed.                  |

An upstream major release does not automatically establish ts-rest support. Upstream end-of-support triggers a review of the affected line; it does not silently remove compatibility.

## Support states

| State       | Maintenance commitment                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Active      | The newest verified supported major receives features, compatibility fixes and critical fixes.                                                                                                   |
| Maintenance | The previous supported major receives critical security and correctness fixes during its migration window. New features target the active line.                                                  |
| Deprecated  | A retirement notice identifies the replacement, migration steps, earliest removal date and last compatible ts-rest release line. Critical fixes and compatibility checks continue until removal. |
| Retired     | New ts-rest releases no longer promise compatibility. Existing published versions remain available; any support for their release line must be stated separately.                                |

The target is one active dependency major plus one previous major during migration. Existing broader ranges need explicit retirement decisions before they can reach that target. Record exceptions when a replacement is unavailable or maintaining an additional line has a justified benefit.

Deprecation adds a dated notice to a supported line. It does not authorize dropping its tests or stopping promised critical fixes early. For every state, record the owning package, exact supported range and applicable checks.

## Migration window and removal timing

Give consumers at least six calendar months of notice. The window starts when both the public retirement notice and a released, verified replacement with migration guidance are available. Internal plans, prereleases and unreleased examples do not start the clock.

Remove support in the next scheduled ts-rest major release on or after the earliest removal date. Until that release, retain the promised compatibility and checks. If the release moves, update the notice; passing the date alone does not authorize a breaking minor or patch release.

When adding a new supported dependency major, decide the maintenance status and retirement schedule of the older lines in the same review. When maintaining an old line is no longer viable, make an explicit release decision and communicate its consequences rather than silently reducing support.

The fork's initial major can establish a narrower support baseline before its first stable publication. Document differences from upstream published v3 and provide migration guidance. This initial baseline decision is separate from retiring a compatibility promise already shipped by the fork. The [Standard Schema migration guide](../apps/docs/content/docs/standard-schema-migration.mdx) currently describes an unreleased major.

## Retirement requirements

Retire one selected surface per reviewable change. Before removal:

1. Record its owning package, current support promise, replacement, notice date, earliest removal date and planned major release. Identify the last compatible release line and any continued maintenance commitment.
2. Verify the replacement against installed package tarballs, strict declarations and the relevant runtime or native lifecycle checks. Test the migration examples as consumers would use them.
3. Publish migration guidance covering affected imports, types and observable behavior. API replacements must preserve the supported capabilities or explicitly document the approved breaking differences.
4. Keep the old compatibility checks through the migration window. In the removal change, update peer ranges, exports, implementation, docs, fixtures and a major Changeset together. Retain replacement and shared behavior coverage.
5. Verify removed imports fail clearly, unsupported peer combinations are identified, and supported consumers still pass. Record the remaining compatibility surfaces for later reviews.

Follow the [consumer compatibility workflow](../CONTRIBUTING.md#consumer-compatibility): the full isolated fixture matrix runs in CI. A passing pinned fixture establishes evidence for that installation, not every version allowed by a broad peer range. The A01 inventory reconciles declared floors and supported lines with the checks needed to justify them; unverified floors remain explicit gaps.

## Initial review priorities

The following observations are a checkout snapshot from 2026-11-04, not an adopted support reduction.

| Surface             | Current declaration or boundary                                                            | Next decision                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Express             | Peer range permits majors 4 and 5; isolated fixtures cover both.                           | Focus new work on 5; retain 4 until an explicit retirement decision. Verify isolated v5 types as well as runtime.                              |
| Nest                | Peer ranges permit majors 9 through 12; isolated fixtures cover 9, 10 and 11.              | Focus workspace work on 12; retain broader promises and add isolated 12 coverage before claiming equivalent evidence across lines.             |
| Next                | Peer range permits majors 12 through 16.                                                   | Review the broad range against actual consumer and host coverage before selecting retirements.                                                 |
| Fastify             | Peer range permits major 4 only.                                                           | Deliver and verify support for a newer major before proposing a migration away from 4.                                                         |
| React Query         | Peer range permits majors 4 and 5; v5 has its own import path.                             | Prove the v5 migration before retiring v4. Decide import-path changes separately.                                                              |
| Vue and Solid Query | Each peer range permits major 4 only.                                                      | Deliver and verify replacements before proposing v4 retirement.                                                                                |
| Zod 3               | Standard Schema is the default boundary; older schemas and historical helpers use `/zod3`. | Keep the bridge through the initial migration. Review bridge and helper retirements separately; modern Zod 3 can use Standard Schema directly. |

Sources: library [package manifests](../libs/ts-rest/), the [isolated CI matrix](../.github/workflows/build-test.yml) and the [Standard Schema migration guide](../apps/docs/content/docs/standard-schema-migration.mdx).

A01's [support inventory](support-inventory.md) completes the manifest, lockfile, fixture, compiler, runtime and ownership snapshot. It records retained broad-range exceptions and missing evidence explicitly. No dated retirement exception is necessary yet because no retirement clock has started. Adding dependency floors or narrowing support remains a separately reviewed change.

## Release handling

The current [Changesets configuration](../.changeset/config.json) places `@ts-rest/*` in a fixed group, so compatibility removal currently requires a coordinated major release. Independent adapter versioning can later reduce the release impact through A17; it is not a prerequisite for documenting the policy.

Use support documentation, migration guides and release notes to communicate retirement. Avoid blanket npm deprecation of releases that still contain supported integrations or entry points. Any npm deprecation must identify a specific obsolete or unusable release and explain the replacement accurately.

The retirement change must carry the appropriate Changeset. Publication remains a separate release action under the repository's existing release controls.
