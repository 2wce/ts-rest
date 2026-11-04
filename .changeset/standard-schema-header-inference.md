---
'@ts-restless/core': patch
---

Correct field-record header input/output inference across Standard Schema validators.
Normalize HTTP names for validation and base/route overrides, preserve optional
outputs and transformed values, and retain null removals through nested routers.
Infer plain contract header maps correctly. Whole-object schemas keep their
existing validation and merge semantics and require lowercase header keys.
