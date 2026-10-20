---
'@ts-rest/nest': minor
'@ts-rest/next': minor
'@ts-rest/serverless': minor
'@ts-rest/open-api': patch
---

Support Nest 12 and Next 15/16 while retaining older framework peer ranges.
Register optional Nest contract paths as concrete route alternatives for Express
5 compatibility. Paths keep the selected framework's native route priority.
Update the Zod 3 OpenAPI converter to the compatible 1.14 release without
changing the OpenAPI public type major.
