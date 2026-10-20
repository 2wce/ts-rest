import assert from 'node:assert/strict';
import { test } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const archives = resolve(root, 'dist/packages');

// Follow emitted chunks as well as the root; a separate legacy entry must not
// accidentally pull Zod back into the default import/require graph.
async function checkDefaultGraph(path, seen = new Set()) {
  if (seen.has(path)) return;
  seen.add(path);
  const code = await readFile(path, 'utf8');
  assert.doesNotMatch(
    code,
    /(?:from\s*|require\(\s*|import\(\s*)["']zod(?:\/[^"']*)?["']/,
  );
  const map = JSON.parse(await readFile(`${path}.map`, 'utf8'));
  assert.ok(
    map.sources.every((source) => !/(?:^|\/)zod(?:@[^/]+)?\//.test(source)),
    `${path}: default graph must not bundle Zod`,
  );
  const localImports = [
    ...code.matchAll(
      /(?:from\s*|require\(\s*|import\(\s*)["'](\.\/[^"']+\.(?:mjs|js))["']/g,
    ),
  ];
  for (const [, relative] of localImports) {
    await checkDefaultGraph(resolve(dirname(path), relative), seen);
  }
}

test('default core ESM and CommonJS graphs do not load or bundle Zod', async () => {
  for (const extension of ['esm.mjs', 'cjs.js']) {
    await checkDefaultGraph(
      resolve(root, `libs/ts-rest/core/dist/index.${extension}`),
    );
  }
});

const sources = {
  standard: `const schema: StandardSchemaV1<string, number> = {
    '~standard': { version: 1, vendor: 'consumer', validate: (value) =>
      typeof value === 'string' ? { value: Number(value) } : { issues: [{ message: 'Expected string' }] } }
  };`,
  valibot: `import * as v from 'valibot';
  const schema = v.pipe(v.string(), v.transform(Number));`,
  'zod-4': `import { z } from 'zod';
  const schema = z.string().transform(Number);`,
};

for (const [profile, definition] of Object.entries(sources)) {
  test(`packed core and Express support ${profile} with strict ESM/CommonJS declarations`, async () => {
    const consumer = await mkdtemp(join(tmpdir(), `ts-rest-${profile}-`));
    try {
      const dependencies = {
        '@ts-rest/core': `file:${join(archives, 'ts-rest-core.tgz')}`,
        '@ts-rest/express': `file:${join(archives, 'ts-rest-express.tgz')}`,
      };
      for (const name of ['express', '@types/express', '@types/node']) {
        dependencies[name] = JSON.parse(
          await readFile(resolve(root, 'node_modules', name, 'package.json')),
        ).version;
      }
      if (profile === 'valibot') dependencies.valibot = '1.5.0';
      if (profile === 'zod-4') dependencies.zod = '4.6.7';
      await writeFile(
        join(consumer, 'package.json'),
        JSON.stringify({
          name: `consumer-${profile}`,
          private: true,
          dependencies,
        }),
      );
      await writeFile(
        join(consumer, 'pnpm-workspace.yaml'),
        'packages: ["."]\nminimumReleaseAge: 0\n',
      );
      execFileSync(
        'pnpm',
        ['install', '--ignore-scripts', '--no-frozen-lockfile'],
        { cwd: consumer, stdio: 'pipe' },
      );
      if (profile !== 'zod-4') {
        await assert.rejects(access(join(consumer, 'node_modules/zod')), {
          code: 'ENOENT',
        });
      }
      const source = `import { initContract, StandardSchemaV1, SchemaInputOrType, SchemaOutputOrType, ServerInferRequest, ClientInferRequest, ClientInferResponseBody } from '@ts-rest/core';
import { createExpressEndpoints, initServer } from '@ts-rest/express';
${definition}
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
type Input = Expect<Equal<SchemaInputOrType<typeof schema>, string>>;
type Output = Expect<Equal<SchemaOutputOrType<typeof schema>, number>>;
const contract = initContract().router({ convert: { method: 'POST', path: '/convert', body: schema, responses: { 200: schema } } });
type ServerBody = Expect<Equal<ServerInferRequest<typeof contract.convert>['body'], number>>;
type ClientBody = Expect<Equal<ClientInferRequest<typeof contract.convert>['body'], string>>;
type ResponseBody = Expect<Equal<ClientInferResponseBody<typeof contract.convert, 200>, number>>;
void [createExpressEndpoints, initServer];
`;
      for (const extension of ['mts', 'cts']) {
        const file = join(consumer, `consumer.${extension}`);
        await writeFile(file, source);
        execFileSync(
          process.execPath,
          [
            resolve(root, 'node_modules/typescript/bin/tsc'),
            '--noEmit',
            '--strict',
            '--target',
            'es2022',
            '--module',
            'nodenext',
            '--moduleResolution',
            'nodenext',
            '--esModuleInterop',
            file,
          ],
          { cwd: consumer, stdio: 'inherit' },
        );
      }
      const runtime = `import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
for (const name of ['@ts-rest/core', '@ts-rest/express']) {
  const esm = await import(name); const cjs = require(name);
  assert.deepEqual(Object.keys(esm).filter((key) => key !== 'default').sort(), Object.keys(cjs).sort());
}
const { validateIfSchema, StandardSchemaError } = await import('@ts-rest/core');
${definition.replace('schema: StandardSchemaV1<string, number>', 'schema')}
assert.equal(validateIfSchema('42', schema).value, 42);
const failure = validateIfSchema({}, schema).error;
assert.ok(failure instanceof StandardSchemaError);
assert.ok(failure.issues.length > 0);
`;
      const file = join(consumer, 'consumer.mjs');
      await writeFile(file, runtime);
      execFileSync(process.execPath, [file], { cwd: consumer, stdio: 'pipe' });
    } finally {
      await rm(consumer, { recursive: true, force: true });
    }
  });
}
