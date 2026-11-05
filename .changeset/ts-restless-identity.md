---
'@ts-restless/core': major
---

Launch the maintained fork as **ts-restless**, with the ten public packages under
`@ts-restless/*` and the first stable target `4.0.0`. Interim numbered alpha
releases are available before the remaining compatibility work is complete.
Replace upstream dependencies and imports as a matched package set; public API
identifiers and supported subpaths, including `/zod3` and React Query `/v5`, remain.
Report bugs and prerelease feedback at https://github.com/2wce/ts-restless/issues.

This major includes the Standard Schema default API and the separately documented
legacy Zod bridge. A prerelease does not widen framework support: public React
peers cover React 16.8–18, Fastify support remains on major 4, and Query v5 evidence
is limited to the pinned compatibility baseline. OpenAPI still has its existing
converter boundary. Follow the package and Standard Schema migration guides in
the repository before moving from upstream v3.
