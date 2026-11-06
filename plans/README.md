# Response architecture work

These documents refine A04 and the response portion of A05 in the existing adapter epic. Read the approved design and execution plan together. Implementation preserves current behavior; the client-policy correction in F04 and other host migrations remain separately scoped.

| Document                                                                              | Existing work                                               | Status                      |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------------------------- |
| [001 Response contract evaluation design](001-response-contract-evaluation-design.md) | A04, with F04 kept separate                                 | Approved 2026-11-05         |
| [002 Core evaluation and Express adoption](002-response-contract-evaluation.md)       | A04 implementation; depends on 001 and completed A02        | Merged in PR #13; CI passed |
| [003 Fastify response adoption](003-fastify-response-evaluation.md)                   | Response portion of A05; depends on A04, independent of A03 | DONE locally; CI pending    |

Plan 002 has three sequential tasks: characterize compatibility, establish the core capability and packed API evidence, then adopt it in Express and run the final gates. Original planning baseline: `aaae50b5`; delivery rebased onto `2bbc84e4` to exclude the already merged Changesets correction. Implemented on `feat/response-contract-evaluation`; all required local gates passed on 2026-11-06.

## Alternatives considered

- A monorepo directory relocation does not establish response ownership and is outside this slice.
- A universal host dispatcher would absorb native lifecycle responsibilities that remain adapter-owned.
- A selector-only utility does not consolidate response metadata and validation orchestration sufficiently.

## Execution evidence (2026-11-06)

- Compatibility checkpoint: `a15a7077` (originally `f35c9387`), 286 core/Express tests passed before production extraction; all nine inference tasks passed.
- Core capability checkpoint: `e763bd33` (originally `2826c302`), 266 core tests and all nine inference tasks passed. The first new evaluator run failed for the missing response module, then passed after implementation. Packed checks passed against real installed ESM/CommonJS exports and strict declarations.
- Completed adoption: 301 focused core/Express tests passed, including native JSON/text transform counts, stream bypass and existing middleware/conformance cases.
- Final `pnpm typecheck`, `pnpm test` and `pnpm test:packages` all exited 0; the final packed suite passed 20 tests across four files. Changed-file formatting and whitespace checks passed.
- [PR #13](https://github.com/2wce/ts-restless/pull/13) merged as `d588e194` on 2026-11-06 after Build & Test, all ten compatibility fixtures and the aggregate compatibility gate passed. The fresh pre-PR source run passed 692 tests. No publication, dependency-floor change or host/client-policy migration is included.

The fresh worktree required `pnpm --filter @ts-restless/core build` before the existing non-strict inference fixture could resolve its declaration path. No configuration or schema-primitive changes were needed. Subagent dispatch did not deliver readable instructions, so execution and diff review used the user's selected single-executor workflow with checkpoints.

## Fastify response adoption evidence (2026-11-06)

Plan 003 is implemented on `feat/fastify-response-evaluation`, rebased onto the merged A04 commit `d588e194`. Fastify now uses the same core evaluation result for validation, no-body handling and explicit media types. Its native hooks, serialization, error identity and existing stream validation policy are preserved.

Local gates passed: 350 focused tests, 700 full-source tests, all nine inference tasks, Fastify source/test typing, 20 packed tests in four files, changed-file formatting/whitespace and targeted lint (one existing warning). The compatibility checkpoint proved the tests detect an inverted validation policy. Real packed ESM/CommonJS adapters execute transforming responses under all four validator profiles. See [plan 003](003-fastify-response-evaluation.md#execution-evidence) for details and the local runtime version.

A05 remains partial: response adoption is verified locally, its CI is pending, and request adoption depends on unimplemented A03. Next, Nest and serverless response adoption and the client-policy correction remain separate slices.
