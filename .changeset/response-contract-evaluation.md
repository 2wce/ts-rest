---
'@ts-restless/core': minor
'@ts-restless/express': patch
---

Add a shared response contract evaluator returning body metadata and structured
validation results. Preserve the existing core response-validation facade and
Express behavior while adopting the evaluator for ordinary responses. Stream
handling, validation enablement, undeclared statuses and error identities remain
unchanged.
