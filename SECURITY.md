# Security Policy

## Supported release lines

ts-restless has published `4.0.0-alpha.*` prereleases, with all ten public libraries on `4.0.0-alpha.1` as of 2026-11-06. Stable `4.0.0` is not published. npm's public `0.0.0-stage` registration placeholders contain no library code and must not be installed. Security reports affecting the development branch are welcome; each prerelease's notes identify the current evaluation version and known limitations.

Use the explicit `@alpha` channel for prerelease evaluation. Stable release security support and dependency retirement follow the [support policy](docs/support-policy.md). Existing upstream `@ts-rest/*` releases belong to their original project; this policy applies to ts-restless's own releases.

## Reporting a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/2wce/ts-restless/security/advisories/new) on this repository. Private reporting is enabled and reports go to this fork's maintainers. Include affected versions, a minimal reproduction, impact and any proposed mitigation. Keep vulnerability details in that private channel.

The initial maintainer is [@2wce](https://github.com/2wce). General bugs and prerelease feedback belong in [the public issue tracker](https://github.com/2wce/ts-restless/issues).
