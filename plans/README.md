# Response architecture work

These documents refine A04 of the existing adapter epic. Read the approved design and execution plan together. Implementation preserves current behavior; the client-policy correction in F04 and other host migrations remain separately scoped.

| Document                                                                              | Existing work                                        | Status                                 |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- |
| [001 Response contract evaluation design](001-response-contract-evaluation-design.md) | A04, with F04 kept separate                          | Approved 2026-11-05                    |
| [002 Core evaluation and Express adoption](002-response-contract-evaluation.md)       | A04 implementation; depends on 001 and completed A02 | DONE locally; CI compatibility pending |

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
- Existing CI `Compatibility Fixtures` remains a merge gate; it was not run locally. No publication, dependency-floor change or host/client-policy migration is included.

The fresh worktree required `pnpm --filter @ts-restless/core build` before the existing non-strict inference fixture could resolve its declaration path. No configuration or schema-primitive changes were needed. Subagent dispatch did not deliver readable instructions, so execution and diff review used the user's selected single-executor workflow with checkpoints.
