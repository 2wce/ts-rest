import assert from 'node:assert/strict';
import {
  cp,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const baseline = JSON.parse(
  await readFile(new URL('./package-baseline.json', import.meta.url)),
);
const consumer = await mkdtemp(join(tmpdir(), 'ts-rest-consumer-'));
try {
  await cp(
    resolve(root, 'dist/libs/ts-rest'),
    join(consumer, 'node_modules/@ts-rest'),
    { recursive: true },
  );
  for (const name of await readdir(resolve(root, 'node_modules'))) {
    if (name === '@ts-rest' || name.startsWith('.')) continue;
    await symlink(
      resolve(root, 'node_modules', name),
      join(consumer, 'node_modules', name),
    );
  }
  const imports = [];
  for (const [name, before] of Object.entries(baseline)) {
    const pkg = JSON.parse(
      await readFile(
        join(consumer, 'node_modules/@ts-rest', name, 'package.json'),
      ),
    );
    assert.deepEqual(
      Object.keys(pkg.exports).sort(),
      Object.keys(before.exports).sort(),
      `${name}: public subpaths`,
    );
    const source = JSON.parse(
      await readFile(resolve(root, 'libs/ts-rest', name, 'package.json')),
    );
    assert.equal(pkg.version, source.version, `${name}: release version`);
    const peers = { ...before.peerDependencies };
    if (name !== 'core') {
      peers['@ts-rest/core'] = source.version.includes('-')
        ? source.version
        : `~${source.version.split('.').slice(0, 2).join('.')}.0`;
    }
    assert.deepEqual(pkg.peerDependencies, peers, `${name}: peer ranges`);
    assert.deepEqual(
      pkg.peerDependenciesMeta,
      before.peerDependenciesMeta,
      `${name}: optional peers`,
    );
    assert.ok(
      !pkg.devDependencies && !pkg.scripts,
      `${name}: release metadata`,
    );
    for (const subpath of Object.keys(pkg.exports)) {
      if (subpath === './package.json') continue;
      imports.push(before.name + (subpath === '.' ? '' : subpath.slice(1)));
    }
  }
  await writeFile(
    join(consumer, 'consumer.mjs'),
    `import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
for (const name of ${JSON.stringify(imports)}) {
 const esm = await import(name); const cjs = require(name);
 assert.deepEqual(Object.keys(esm).filter(k => k !== 'default').sort(), Object.keys(cjs).sort(), name);
}
const { initContract } = await import('@ts-rest/core');
assert.equal(initContract().router({ get: { method: 'GET', path: '/test', responses: {} } }).get.path, '/test');
await import('reflect-metadata');
const { TsRestInterceptor } = await import('@ts-rest/nest');
const { Reflector } = await import('@nestjs/core');
assert.equal(Reflect.getMetadata('design:paramtypes', TsRestInterceptor)[0], Reflector);
`,
  );
  execFileSync(process.execPath, [join(consumer, 'consumer.mjs')], {
    stdio: 'inherit',
  });
  const files = await readdir(
    join(consumer, 'node_modules/@ts-rest/react-query'),
    { recursive: true },
  );
  for (const name of ['provider-inner', 'use-tsr-query-client']) {
    for (const extension of ['.esm.mjs', '.cjs.js']) {
      const file = files.find((f) => f.endsWith(name + extension));
      assert.ok(file, `${name}: preserved module`);
      assert.match(
        await readFile(
          join(consumer, 'node_modules/@ts-rest/react-query', file),
          'utf8',
        ),
        /["']use client["']/,
      );
    }
  }
  // Both classic Node resolution and conditional ESM/CJS resolution must typecheck.
  await writeFile(
    join(consumer, 'consumer.ts'),
    `import { initContract, ClientInferResponseBody } from '@ts-rest/core';
import { initQueryClient } from '@ts-rest/react-query';
import { initTsrReactQuery } from '@ts-rest/react-query/v5';
import { createFetchHandler } from '@ts-rest/serverless/fetch';
const contract = initContract().router({ get: { method: 'GET', path: '/test', responses: { 200: initContract().type<{ value: string }>() } } });
const value: ClientInferResponseBody<typeof contract.get, 200> = { value: 'ok' };
// @ts-expect-error response inference must reject incompatible body values
const invalid: ClientInferResponseBody<typeof contract.get, 200> = { value: 1 };
void [initQueryClient, initTsrReactQuery, createFetchHandler, value, invalid];
`,
  );
  for (const [compiler, mode] of [
    ['typescript-legacy', 'node'],
    ['typescript-legacy', 'nodenext'],
    ['typescript', 'bundler'],
    ['typescript', 'nodenext'],
  ]) {
    execFileSync(
      process.execPath,
      [
        resolve(root, 'node_modules', compiler, 'bin/tsc'),
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--target',
        'es2019',
        '--module',
        mode === 'node'
          ? 'commonjs'
          : mode === 'bundler'
            ? 'esnext'
            : 'nodenext',
        '--moduleResolution',
        mode,
        join(consumer, 'consumer.ts'),
      ],
      { stdio: 'inherit' },
    );
  }
  console.log(
    `Verified ${Object.keys(baseline).length} packages, ${imports.length} ESM/CJS entry points, types, Nest metadata and React directives.`,
  );
} finally {
  await rm(consumer, { recursive: true, force: true });
}
