---
'@ts-rest/core': major
'@ts-rest/express': major
'@ts-rest/fastify': major
'@ts-rest/nest': major
'@ts-rest/next': major
'@ts-rest/serverless': major
'@ts-rest/open-api': major
'@ts-rest/react-query': major
'@ts-rest/solid-query': major
'@ts-rest/vue-query': major
---

Make default core and adapter entry points validator independent through Standard
Schema. Remove Zod-specific public inference types and automatic old-Zod detection
from those entries, and isolate historical Zod helpers under explicit `/zod3`
compatibility entry points.

Default validation failures use StandardSchemaError with the serialized name
ValidationError, including explicitly bridged old schemas. Request error locations
and validator-provided issue fields are retained. Whole-object header schemas now
validate both inputs before merging successful outputs; merge typed Zod
objects before bridging when replacement semantics are required.

See the unreleased Standard Schema migration guide for moved imports and intentional
major-version changes. This Changeset records the future coordinated release;
release workflows remain disabled.
