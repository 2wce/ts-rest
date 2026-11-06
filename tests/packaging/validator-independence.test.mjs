import assert from 'node:assert/strict';
import { test } from 'vitest';
import { execFileSync } from 'node:child_process';
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
  access,
  readdir,
} from 'node:fs/promises';
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
  const moduleEdges = [
    ...code.matchAll(
      /\b(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*)["']([^"']+)["']/g,
    ),
  ].map((match) => match[1]);
  assert.ok(
    moduleEdges.every(
      (specifier) => specifier !== 'zod' && !specifier.startsWith('zod/'),
    ),
    `${path}: default graph must not load Zod`,
  );
  try {
    const map = JSON.parse(await readFile(`${path}.map`, 'utf8'));
    assert.ok(
      map.sources.every((source) => !/(?:^|\/)zod(?:@[^/]+)?\//.test(source)),
      `${path}: default graph must not bundle Zod`,
    );
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // The packer omits maps for generated re-export-only entries. Every
    // implementation chunk must still have its own inspected sourcemap.
    const implementation = code
      .replace(/export\s*\{[^}]*\}\s*from\s*["'][^"']+["'];?/g, '')
      .replace(
        /import\s*\{[\w$\s,]+\}\s*from\s*["']\.{1,2}\/[^"']+\.[cm]?js["'];?/g,
        '',
      )
      .replace(/export\s*\{[\w$\s,]+\}\s*;?/g, '')
      .replace(
        /Object\.defineProperty\(exports, Symbol\.toStringTag, \{ value: "Module" \}\);/g,
        '',
      )
      .replace(/(?:const|let) \w+ = require\(["'][^"']+["']\);/g, '')
      .replace(/exports\.\w+ = \w+\.\w+;/g, '')
      .replace(
        /Object\.defineProperty\(exports, "\w+", \{\s*enumerable: true,\s*get: function\(\) \{\s*return \w+\.\w+;\s*\}\s*\}\);/g,
        '',
      );
    assert.equal(
      implementation.trim(),
      '',
      `${path}: implementation requires a sourcemap`,
    );
  }
  for (const relative of moduleEdges.filter(
    (specifier) => specifier.startsWith('.') && /\.[cm]?js$/.test(specifier),
  )) {
    await checkDefaultGraph(resolve(dirname(path), relative), seen);
  }
}

for (const name of [
  'core',
  'express',
  'fastify',
  'nest',
  'next',
  'serverless',
]) {
  test(`packed default ${name} ESM and CommonJS graphs do not load or bundle Zod`, async () => {
    const unpacked = await mkdtemp(join(tmpdir(), 'ts-restless-graph-'));
    try {
      execFileSync('tar', [
        '-xzf',
        join(archives, `ts-restless-${name}.tgz`),
        '-C',
        unpacked,
      ]);
      const packageRoot = join(unpacked, 'package');
      const pkg = JSON.parse(
        await readFile(join(packageRoot, 'package.json'), 'utf8'),
      );
      for (const [subpath, target] of Object.entries(pkg.exports)) {
        if (subpath === './package.json' || subpath === './zod3') continue;
        for (const format of ['import', 'require']) {
          await checkDefaultGraph(resolve(packageRoot, target[format].default));
        }
      }
    } finally {
      await rm(unpacked, { recursive: true, force: true });
    }
  });
}

const sources = {
  standard: `const schema: StandardSchemaV1<string, number> = {
    '~standard': { version: 1, vendor: 'consumer', validate: (value) =>
      typeof value === 'string' ? { value: Number(value) } : { issues: [{ message: 'Expected string' }] } }
  };`,
  valibot: `import * as v from 'valibot';
  const schema = v.pipe(v.string(), v.transform(Number));`,
  'zod-4': `import { z } from 'zod';
  const schema = z.string().transform(Number);`,
  'zod-3-legacy': `import { z } from 'zod';
  import { toStandardSchema } from '@ts-restless/core/zod3';
  const schema = toStandardSchema(z.string().transform(Number));`,
};

for (const [profile, definition] of Object.entries(sources)) {
  test(`packed core and adapters support ${profile} with strict ESM/CommonJS declarations`, async () => {
    const consumer = await mkdtemp(join(tmpdir(), `ts-restless-${profile}-`));
    try {
      const dependencies = {
        '@ts-restless/core': `file:${join(archives, 'ts-restless-core.tgz')}`,
        '@ts-restless/express': `file:${join(archives, 'ts-restless-express.tgz')}`,
      };
      for (const name of ['fastify', 'nest', 'next', 'serverless']) {
        dependencies[`@ts-restless/${name}`] =
          `file:${join(archives, `ts-restless-${name}.tgz`)}`;
      }
      for (const name of [
        'express',
        'fastify',
        'next',
        '@nestjs/common',
        '@nestjs/core',
        'rxjs',
        'reflect-metadata',
        'react',
        'react-dom',
        '@types/express',
        '@types/node',
        '@types/react',
        '@types/react-dom',
        '@types/aws-lambda',
        '@azure/functions',
      ]) {
        dependencies[name] = JSON.parse(
          await readFile(resolve(root, 'node_modules', name, 'package.json')),
        ).version;
      }
      // Pin the supported framework baseline independently from the validators.
      // Next 16 currently has unrelated upstream declaration failures.
      dependencies.next = '12.3.7';
      if (profile === 'valibot') dependencies.valibot = '1.5.0';
      if (profile === 'zod-4') dependencies.zod = '4.6.7';
      if (profile === 'zod-3-legacy') {
        dependencies.zod = '3.22.3';
        dependencies.typescript = '5.7.3';
      }
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
      if (!dependencies.zod) {
        await assert.rejects(access(join(consumer, 'node_modules/zod')), {
          code: 'ENOENT',
        });
        const installed = await readdir(join(consumer, 'node_modules/.pnpm'));
        assert.ok(
          installed.every((name) => !name.startsWith('zod@')),
          'no-Zod consumer must not install Zod transitively',
        );
      }
      const source = `import { initContract, evaluateResponse, ResponseMetadata, ResponseEvaluation, StandardSchemaV1, SchemaInputOrType, SchemaOutputOrType, ServerInferRequest, ClientInferRequest, ClientInferResponseBody } from '@ts-restless/core';
import { createExpressEndpoints, initServer } from '@ts-restless/express';
import * as fastify from '@ts-restless/fastify';
import * as nest from '@ts-restless/nest';
import * as next from '@ts-restless/next';
import * as serverless from '@ts-restless/serverless';
import * as fetch from '@ts-restless/serverless/fetch';
import * as aws from '@ts-restless/serverless/aws';
import * as azure from '@ts-restless/serverless/azure';
import * as serverlessNext from '@ts-restless/serverless/next';
${definition}
const optionalHeader: StandardSchemaV1<string | undefined> = {
  '~standard': { version: 1, vendor: 'consumer', validate: (value) =>
    value === undefined || typeof value === 'string' ? { value } : { issues: [{ message: 'Expected optional string' }] } }
};
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
type Input = Expect<Equal<SchemaInputOrType<typeof schema>, string>>;
type Output = Expect<Equal<SchemaOutputOrType<typeof schema>, number>>;
const contract = initContract().router({ convert: { method: 'POST', path: '/convert', body: schema, headers: { 'X-Count': schema, 'X-Note': optionalHeader }, responses: { 200: schema } } });
const evaluated: ResponseEvaluation = evaluateResponse({
  appRoute: contract.convert,
  response: { status: 200, body: '12' },
  validateBody: true,
});
const responseMetadata: ResponseMetadata = evaluated.metadata;
if (evaluated.success) {
  const evaluatedBody: unknown = evaluated.body;
  void evaluatedBody;
} else {
  const issueMessage: string = evaluated.error.issues[0].message;
  void issueMessage;
}
// @ts-expect-error callers must explicitly choose validation enablement
evaluateResponse({ appRoute: contract.convert, response: { status: 200, body: '12' } });
void responseMetadata;
type ServerBody = Expect<Equal<ServerInferRequest<typeof contract.convert>['body'], number>>;
type ClientBody = Expect<Equal<ClientInferRequest<typeof contract.convert>['body'], string>>;
type ResponseBody = Expect<Equal<ClientInferResponseBody<typeof contract.convert, 200>, number>>;
type ClientHeaders = Expect<Equal<ClientInferRequest<typeof contract.convert>['headers'], { 'x-count': string; 'x-note'?: string }>>;
type ServerHeaders = Expect<Equal<ServerInferRequest<typeof contract.convert>['headers'], { 'x-count': number; 'x-note'?: string }>>;
const c = initContract();
const plain = c.router({ get: { method: 'GET', path: '/plain', headers: c.type<{ 'x-key': 'route' }>(), responses: { 200: null } } }, { baseHeaders: c.type<{ 'X-Key': string; 'X-Note'?: string }>() });
type PlainInput = Expect<Equal<ClientInferRequest<typeof plain.get>['headers'], { 'x-key': 'route'; 'x-note'?: string }>>;
type PlainOutput = Expect<Equal<ServerInferRequest<typeof plain.get>['headers'], { 'x-key': 'route'; 'x-note'?: string }>>;
const valid: ClientInferRequest<typeof contract.convert> = { body: '12', headers: { 'x-count': '12' } };
// @ts-expect-error required transformed header cannot be omitted
const missing: ClientInferRequest<typeof contract.convert> = { body: '12', headers: {} };
// @ts-expect-error client must supply the schema input type
const wrong: ClientInferRequest<typeof contract.convert> = { body: '12', headers: { 'x-count': 12 } };
void [valid, missing, wrong];
const implementation = initServer().router(contract, { convert: async ({ body, headers }) => {
  type HandlerBody = Expect<Equal<typeof body, number>>;
  type HandlerHeaders = Expect<Equal<typeof headers['x-count'], number>>;
  return { status: 200, body: body.toString() };
} });
void implementation;
void [createExpressEndpoints, initServer, fastify, nest, next, serverless, fetch, aws, azure, serverlessNext];
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
      if (profile === 'zod-3-legacy') {
        // Classic Node resolution predates conditional package exports. The
        // compatibility entry must still resolve, and its types must compile
        // against actual pre-Standard-Schema Zod rather than workspace aliases.
        const file = join(consumer, 'legacy.ts');
        await writeFile(
          file,
          `import { toStandardSchema, ZodInputOrType, ZodInferOrType } from '@ts-restless/core/zod3';
import { SchemaInputOrType, SchemaOutputOrType } from '@ts-restless/core';
import { z } from 'zod';
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
const original = z.string().transform(Number);
const schema = toStandardSchema(original);
type Input = Expect<Equal<SchemaInputOrType<typeof schema>, string>>;
type Output = Expect<Equal<SchemaOutputOrType<typeof schema>, number>>;
type LegacyInput = Expect<Equal<ZodInputOrType<typeof original>, string>>;
type LegacyOutput = Expect<Equal<ZodInferOrType<typeof original>, number>>;
`,
        );
        execFileSync(
          process.execPath,
          [
            join(consumer, 'node_modules/typescript/bin/tsc'),
            '--noEmit',
            '--strict',
            '--target',
            'es2022',
            '--module',
            'commonjs',
            '--moduleResolution',
            'node',
            file,
          ],
          { cwd: consumer, stdio: 'inherit' },
        );
      }
      const runtime = `import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
for (const name of ['@ts-restless/core', '@ts-restless/express', '@ts-restless/fastify', '@ts-restless/nest', '@ts-restless/next', '@ts-restless/serverless', '@ts-restless/serverless/fetch', '@ts-restless/serverless/aws', '@ts-restless/serverless/azure', '@ts-restless/serverless/next']) {
  const esm = await import(name); const cjs = require(name);
  assert.deepEqual(Object.keys(esm).filter((key) => key !== 'default').sort(), Object.keys(cjs).sort());
}
${definition.replace('schema: StandardSchemaV1<string, number>', 'schema')}
for (const { validateIfSchema, validateMultiSchemaObject, initContract, StandardSchemaError, evaluateResponse } of [await import('@ts-restless/core'), require('@ts-restless/core')]) {
  assert.equal(validateIfSchema('42', schema).value, 42);
  const failure = validateIfSchema({}, schema).error;
  assert.ok(failure instanceof StandardSchemaError);
  assert.ok(failure.issues.length > 0);
  const responseRoute = initContract().router({ get: {
    method: 'GET', path: '/response', responses: { 200: schema },
  } }).get;
  const accepted = evaluateResponse({
    appRoute: responseRoute, response: { status: 200, body: '42' }, validateBody: true,
  });
  assert.deepEqual(accepted, {
    success: true,
    metadata: { status: 200, bodyKind: 'value', contentType: undefined }, body: 42,
  });
  const rejected = evaluateResponse({
    appRoute: responseRoute, response: { status: 200, body: {} }, validateBody: true,
  });
  assert.equal(rejected.success, false);
  assert.ok(rejected.error instanceof StandardSchemaError);
  assert.ok(rejected.error.issues.length > 0);
  const original = {};
  const disabled = evaluateResponse({
    appRoute: responseRoute, response: { status: 200, body: original }, validateBody: false,
  });
  assert.equal(disabled.success, true);
  assert.equal(disabled.body, original);
  const headers = initContract().router({ get: { method: 'GET', path: '/headers', headers: { 'X-Count': schema }, responses: { 200: null } } }).get.headers;
  assert.equal(validateMultiSchemaObject({ 'X-COUNT': '42' }, headers).value['x-count'], 42);
  const missing = validateMultiSchemaObject({}, headers).error;
  assert.ok(missing instanceof StandardSchemaError);
  assert.deepEqual(missing.issues[0].path, ['x-count']);
}
${
  profile === 'zod-3-legacy'
    ? `
const original = z.object({ value: z.string() });
const legacyFailure = original.safeParse({ value: 1 }).error;
for (const compat of [await import('@ts-restless/core/zod3'), require('@ts-restless/core/zod3')]) {
  const adapted = compat.toStandardSchema(original);
  assert.notEqual(adapted, original);
  assert.equal('~standard' in original, false);
  assert.equal(compat.isZodObject(adapted), true);
  const historical = compat.zodErrorResponse(legacyFailure);
  assert.equal(historical.name, 'ZodError');
  assert.equal(compat.ZodErrorSchema.safeParse(historical).success, true);
  assert.equal(compat.ZodErrorSchema.safeParse({ ...historical, name: 'ValidationError' }).success, false);
  assert.deepEqual(adapted['~standard'].validate({ value: 1 }).issues, legacyFailure.issues);
}
`
    : ''
}
`;
      const file = join(consumer, 'consumer.mjs');
      await writeFile(file, runtime);
      execFileSync(process.execPath, [file], { cwd: consumer, stdio: 'pipe' });
    } finally {
      await rm(consumer, { recursive: true, force: true });
    }
  });
}
