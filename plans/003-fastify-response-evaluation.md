# Fastify Response Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task with the user's selected single executor and checkpoints. Track steps with checkboxes.

**Goal:** Make Fastify consume the existing core response capability while preserving its native lifecycle and observable behavior.

**Architecture:** Replace Fastify's response validation and declaration interpretation with `evaluateResponse`. Map failures to the existing core `TsRestResponseValidationError`, then write the returned body and metadata through Fastify's existing reply methods. Request parsing, validation, hooks, serialization and routing remain at their current boundaries.

**Tech Stack:** TypeScript, Standard Schema, Fastify 4.28.0, Vitest, Supertest, pnpm 12.14.0 and Node 26.12.0; existing strict packed ESM/CommonJS consumers.

**Spec:** [Approved response capability design](001-response-contract-evaluation-design.md), extended to Fastify under [A05 of the adapter epic](../docs/superpowers/plans/2026-11-04-adapter-maintenance-epic.md). The user authorized continuation across response consumers on 2026-11-06. This delivery covers only A05's response portion; A03 and Fastify request adoption remain outstanding.

**Baseline:** `add1db23`, draft [PR #13](https://github.com/2wce/ts-restless/pull/13). Execution branch: `feat/fastify-response-evaluation`, stacked on `feat/response-contract-evaluation`, reusing the existing isolated worktree.

## Global constraints

- Preserve current public APIs, options, native request/reply typing, hook order, route metadata, error classes and fields, and serialization ownership.
- Validation is explicitly enabled or disabled by the caller. Disabled validation invokes no validator. Enabled validation transforms once.
- Preserve permissive undeclared-status behavior. Do not change `strictStatusCodes`, Nest policy or client/custom-fetcher policy.
- Fastify has no Express-style stream bypass: a stream is validated when enabled and handed to native serialization when disabled.
- Do not change package names, versions, peer floors, exports subpaths, release groups, publication controls, workspace layout, header composition, query integrations or other adapter implementations.
- Reuse `validateIfSchema` through `evaluateResponse`; no new validation engine, core API, validator dependency or framework-name switch in core.
- Keep decoding, streams, serialization, headers and native response writing out of the evaluator.
- Request evaluation is outside this response-only slice. Do not mark all of A05 complete.

## File ownership

| File                                                   | Change                                                                                                                       |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `libs/ts-rest/fastify/src/lib/ts-rest-fastify.spec.ts` | Extend the existing native suite with real schema counters, hooks, undeclared statuses and stream policy.                    |
| `libs/ts-rest/fastify/src/lib/ts-rest-fastify.ts`      | Adopt the shared evaluator only in response handling.                                                                        |
| `tests/packaging/validator-independence.test.mjs`      | Extend existing strict ESM/CommonJS consumers with Fastify handler inference and real packed response execution.             |
| `.changeset/fastify-response-evaluation.md`            | Record a Fastify patch. The preceding core minor supplies the required helper under the existing coordinated release policy. |
| `plans/README.md`, adapter epic                        | Record verified outcomes and remaining A05 request work.                                                                     |

No manifests, lockfiles, shared conformance fixtures or schema primitives change.

## Task 1: Preserve Fastify response behavior and adopt core evaluation

**Consumes:**

```typescript
evaluateResponse({
  appRoute,
  response: { status, body },
  validateBody,
}): ResponseEvaluation;
// success: { metadata: { status, bodyKind, contentType }, body }
// failure: { metadata, error: StandardSchemaError }
```

**Produces:** Existing Fastify API and response/error behavior backed by core's shared metadata and optional validation.

- [x] Verify a clean isolated branch and read the approved design, epic, contributing guide and current response path.
- [x] Run `pnpm exec vp test run --project fastify` before edits: 41 tests across three files passed; existing deprecated-context warnings remain.
- [ ] Add JSON and text cases with validation enabled and disabled. A real Standard Schema increments a counter; JSON wraps the handler body so a second evaluation would visibly nest it. Assert native response status/body/media type, zero or one validation call, and that response hooks see the validated body.

The JSON schema and literals are:

```typescript
let calls = 0;
const schema: StandardSchemaV1<unknown, { wrapped: unknown }> = {
  '~standard': {
    version: 1,
    vendor: 'fastify-response-test',
    validate(value) {
      calls += 1;
      return { value: { wrapped: value } };
    },
  },
};
// Handler body: { original: true }
// Enabled: { wrapped: { original: true } }, one call.
// Disabled: { original: true }, zero calls.
```

For text, the validator returns `{ value: String(value) + '!' }`. Handler body `'input'` produces `'input!'` with one call when enabled and `'input'` with zero calls when disabled; content type remains Fastify's explicit `'text/plain'`.

- [ ] Add enabled/disabled undeclared-status cases: declare only status 200 with a validator that rejects all values, return status 201 and `{ original: true }`, and assert native status/body plus zero validator calls.
- [ ] Add enabled/disabled real-stream cases. Use `Readable.from(['streamed'])` and a Standard Schema that records its input then returns `{ issues: [{ message: 'Stream rejected by contract' }] }`. With validation enabled assert status 500, one validation input identical to the stream, and the existing core error with the route and issues. With validation disabled assert status 200, `'streamed'`, explicit text media type and no validator/error. Destroy the test stream and close each app.
- [ ] Run the added cases against the old implementation. They characterize compatibility and should pass. Prove they catch a policy regression by temporarily inverting only the response-validation condition, run the focused compatibility cases and observe the expected failures, then restore the original condition and rerun. No mutation ships.

Run:

```bash
pnpm exec vp test run --project fastify -t 'response evaluation compatibility'
```

- [ ] Replace only the response orchestration with this implementation and update imports:

```typescript
const evaluation = evaluateResponse({
  appRoute,
  response: { status: result.status, body: result.body },
  validateBody: Boolean(options.responseValidation),
});
if (!evaluation.success) {
  throw new TsRestResponseValidationError(appRoute, evaluation.error);
}
if (evaluation.metadata.bodyKind === 'none') {
  return reply.status(evaluation.metadata.status).send();
}
if (evaluation.metadata.contentType !== undefined) {
  reply.header('content-type', evaluation.metadata.contentType);
}
return reply.status(evaluation.metadata.status).send(evaluation.body);
```

- [ ] Run the Fastify suites and `pnpm exec tsc --noEmit -p libs/ts-rest/fastify/tsconfig.spec.json`. Keep all existing native hook/context and shared conformance tests.
- [ ] Extend the existing packed source fixture with `fastify.initServer().router(contract, { convert: async ({ body, headers, request, reply, appRoute }) => ({ status: 200, body: body.toString() }) })`; assert inferred body/header types and typed native route metadata. In the runtime fixture, use real packed ESM and CommonJS Fastify adapters with `app.inject`, response validation enabled/disabled and a counted transforming schema. Assert `'42'`/`42` through native decoding and zero/one calls. Run all four existing validator profiles.
- [ ] Add the patch Changeset and run the final gates below.
- [ ] Review the diff against constraints, update execution evidence and A05's partial status, then commit the separately reviewable slice. Preserve PR #13 and its branch.

## Final gates

| Check                                          | Command                                                                                   | Required evidence                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Native Fastify and shared contract regressions | `pnpm exec vp test run --project core --project express --project fastify`                | No failures.                                                        |
| Fastify source/test typing                     | `pnpm exec tsc --noEmit -p libs/ts-rest/fastify/tsconfig.spec.json`                       | Exit 0.                                                             |
| Inference                                      | `pnpm typecheck`                                                                          | All nine tasks pass.                                                |
| Source regressions                             | `pnpm test`                                                                               | No failures.                                                        |
| Real archives and consumers                    | `pnpm test:packages`                                                                      | All existing strict declaration/runtime and versioning checks pass. |
| Changed-file lint/format                       | `pnpm exec vp lint <changed-source-files>` and `pnpm exec vp fmt <changed-files> --check` | No new errors; inspect formatting output.                           |
| Whitespace                                     | `git diff --check`                                                                        | Exit 0.                                                             |

Native HTTP tests require permission to bind listeners in the sandbox. Packed fixtures need registry access and temporary directories; use normal escalation after a network denial. CI compatibility remains a merge gate, and local checks do not establish publication.

## Execution evidence

Baseline passed on 2026-11-06: 41 Fastify tests in three files. Subsequent outcomes are recorded after running the gates.
