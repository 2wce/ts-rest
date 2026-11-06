# Next Response Evaluation Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` task by task with the user's single-executor checkpoints.

**Goal:** Make the native Next API adapter consume core response evaluation while preserving its observable behavior.

**Architecture:** Replace the response validation/declaration branches in `handlerFactory` with `evaluateResponse`. Next keeps status coercion, native writes, routing, request validation and error callbacks. Map evaluator failures to the existing core `TsRestResponseValidationError`.

**Tech Stack:** TypeScript, Standard Schema, Vitest 5.0.5, pnpm 12.14.0; workspace Next 16.4.2, strict packed Next 12.3.7 baseline. CI pins Node 26.12.0; local Node is 24.21.0.

**Spec:** [Approved response design](001-response-contract-evaluation-design.md), extended to the response portion of [A06](../docs/superpowers/plans/2026-11-04-adapter-maintenance-epic.md#a06--next-adoption-of-shared-operations). The user approved this slice on 2026-11-06.

## Global constraints

- Preserve validation enablement, one transform when enabled, zero when disabled, native errors and undeclared statuses.
- Keep `Number(result.status)` and native `status`, `json`, `send`, `end` and `setHeader` behavior.
- Keep custom error callbacks supplied with the original request and response objects; ordinary errors retain identity.
- Preserve both `createNextRouter` and `createSingleRouteHandler`; no request-policy or public-signature changes.
- Do not change dependency floors, support claims, manifests, lockfile, release controls, client policy or other adapters.
- A06 remains partial until A03 request evaluation and Next request adoption are complete.

## Files and ownership

| File                                              | Responsibility                                                                         |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `libs/ts-rest/next/src/lib/ts-rest-next.spec.ts`  | Extend established response tests for both entry points and native callback semantics. |
| `libs/ts-rest/next/src/lib/ts-rest-next.ts`       | Consume the shared result and retain native response/error dispatch.                   |
| `tests/packaging/validator-independence.test.mjs` | Extend existing strict ESM/CommonJS consumers and real packed adapter execution.       |
| `.changeset/next-response-evaluation.md`          | Record a public Next patch under the existing fixed release group.                     |
| `plans/README.md`, adapter epic                   | Update verified delivery and remaining request work.                                   |

## Task 1: Characterize existing Next responses

**Consumes:** Existing `createNextRouter(contract, implementation, options)` and `createSingleRouteHandler(route, implementation, options)` plus `mockReq`, `mockSingleUrlReq` and native response spies.

**Produces:** Behavior regressions that pass before and after extraction.

- [x] Run `pnpm exec vp test run --project next` for the clean baseline.
- [x] Add a response compatibility section parameterized over router/single entry points. Cover omitted/false/true validation, JSON and explicit media types, no-body output, undeclared status, wrapped declared errors, validation failures and thrown native errors.
- [x] Use a counted synchronous Standard Schema validator; assert native body/status/media type and zero/one validation calls together. Example transformation:

```ts
const validate = vi.fn((value: unknown) => ({ value: { wrapped: value } }));
const schema: StandardSchemaV1<unknown, { wrapped: unknown }> = {
  '~standard': { version: 1, vendor: 'next-response-test', validate },
};
```

- [x] Verify both entry points pass the original `req`/`res` into the handler and error callback. Check failure `appRoute`, `cause` and untouched native writes.
- [x] Run the Next suite against the old implementation. Temporarily invert its validation enablement, observe the counter/body assertions fail, restore and rerun. Commit this usable compatibility checkpoint.

## Task 2: Adopt the existing core capability

**Consumes:** `evaluateResponse({ appRoute: AppRoute, response: { status: number; body?: unknown }, validateBody: boolean }): ResponseEvaluation`.

**Produces:** Native Next writes sourced from `metadata.status`, `metadata.bodyKind`, `metadata.contentType` and `body`; the existing core exception for schema issues.

- [x] Replace the imports of `validateResponse`, `isAppRouteNoBody` and `isAppRouteOtherResponse` with `evaluateResponse` and `TsRestResponseValidationError`.
- [x] Replace the response-only block with this flow:

```ts
const evaluation = evaluateResponse({
  appRoute: route,
  response: { status: Number(result.status), body: result.body },
  validateBody: responseValidation,
});
if (!evaluation.success) {
  throw new TsRestResponseValidationError(route, evaluation.error);
}
if (evaluation.metadata.bodyKind === 'none') {
  res.status(evaluation.metadata.status).end();
  return;
}
if (evaluation.metadata.contentType !== undefined) {
  res.setHeader('content-type', evaluation.metadata.contentType);
  res.status(evaluation.metadata.status).send(evaluation.body);
  return;
}
res.status(evaluation.metadata.status).json(evaluation.body);
```

- [x] Run core/Express/Fastify/Next source regressions and Next source/test typing. Confirm schema configuration errors still propagate through the existing callback boundary.
- [x] Add `.changeset/next-response-evaluation.md` with `"@ts-restless/next": patch` and describe preserved behavior under shared core response evaluation. Commit the adoption checkpoint.

## Task 3: Verify packed consumers and record delivery

**Consumes:** Existing four validator profiles, strict NodeNext `.mts`/`.cts` compilation and installed ESM/CommonJS adapter runtime fixture.

**Produces:** Packed handler inference and execution evidence without source aliases or compiler suppression.

- [ ] Extend the existing source fixture with a Next single handler and router implementation. Assert transformed handler body/header types and native `NextApiRequest`/`NextApiResponse` context.
- [ ] Extend the runtime fixture to invoke both real packed entry points in ESM and CommonJS with response validation enabled/disabled. Capture status, JSON body and validator calls through the installed Next 12 API resolver and real localhost HTTP requests, expecting `42` with one call or `'42'` with zero calls across all four validator profiles.
- [ ] Run `pnpm test:packages`, full `pnpm check`, `pnpm exec tsc --noEmit -p libs/ts-rest/next/tsconfig.spec.json`, and `pnpm --filter example-next build`.
- [ ] Run changed-file formatting and `git diff --check`. Review imports, response dispatch, public signatures and every stated constraint; retain all existing request, route and legacy tests.
- [ ] Record exact results and current merged PR #14/#15 evidence in the plan index and epic. Mark only A06's response portion complete locally, with CI pending; A03 and Next request adoption remain outstanding.
- [ ] Commit final evidence and publish a draft PR from `feat/next-response-evaluation`; require the existing CI compatibility gates before merge. No merge or npm publication is part of this slice.

## Execution evidence

- Baseline: 32 Next tests passed.
- Compatibility checkpoint `c7e32709`: 28 additional cases across both entry points; all 60 Next tests passed against the old implementation. Inverting validation produced 14 expected failures; the restored policy passed.
- Adoption: 326 core/Next tests and Next source/test typing passed.
- Full `pnpm check`: 728 tests and all configured typechecks passed, with zero lint errors and 393 existing warnings.
- Packed suite: 21 tests in four files passed. All four validator profiles exercise strict ESM/CommonJS handler inference and real Next 12.3.7 HTTP serialization for router/single handlers with zero/one response validation calls.
- Local runtime: Node 24.21.0 and pnpm 12.14.0; CI must verify pinned Node 26.12.0.

