import { mkdir, cp, readFile, writeFile } from 'node:fs/promises';
// Changesets must discover built release manifests, while versioning continues
// to use source manifests. A separate workspace avoids mutating source config.
await mkdir('dist', { recursive: true });
await writeFile(
  'dist/package.json',
  JSON.stringify(
    { name: 'ts-rest-release', private: true, workspaces: ['libs/ts-rest/*'] },
    null,
    2,
  ) + '\n',
);
await writeFile(
  'dist/pnpm-workspace.yaml',
  "packages:\n  - 'libs/ts-rest/*'\n",
);
await cp('.changeset', 'dist/.changeset', { recursive: true });

// Pending changesets also reference the private v5 source package. Keep its
// identity discoverable; private packages are excluded from publication.
const v5 = JSON.parse(
  await readFile('libs/ts-rest/react-query-v5/package.json', 'utf8'),
);
await mkdir('dist/libs/ts-rest/react-query-v5', { recursive: true });
await writeFile(
  'dist/libs/ts-rest/react-query-v5/package.json',
  JSON.stringify(
    { name: v5.name, version: v5.version, private: true },
    null,
    2,
  ) + '\n',
);
