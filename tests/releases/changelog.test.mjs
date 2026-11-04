import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'vitest';

const require = createRequire(import.meta.url);
const { generateMDX } = require('../../apps/docs/generate-changelog.cjs');

test('generated changelog routes fork releases to this repository while retaining upstream history', () => {
  const content = generateMDX(
    new Map([
      [
        '4.0.0-alpha.0',
        [
          {
            package: 'core',
            hasContent: true,
            changes: [{ hash: '8d63911c', description: 'Fork release.' }],
          },
        ],
      ],
      [
        '3.52.1',
        [
          {
            package: 'core',
            hasContent: true,
            changes: [{ hash: '1234abcd', description: 'Upstream release.' }],
          },
        ],
      ],
    ]),
  );
  assert.ok(
    content.includes(
      '[8d63911c](https://github.com/2wce/ts-rest/commit/8d63911c)',
    ),
  );
  assert.ok(
    content.includes(
      '[1234abcd](https://github.com/ts-rest/ts-rest/commit/1234abcd)',
    ),
  );
});
