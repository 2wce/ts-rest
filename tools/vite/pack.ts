import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import swc from 'unplugin-swc';
import type { PackUserConfig } from 'vite-plus/pack';
import { decoratorOptions } from './swc';

// Keep release metadata generation in a supported build hook, rather than
// intercepting logs from the build tool. Changesets still versions source manifests.
export function libraryPack(
  name: string,
  entry: Record<string, string>,
): PackUserConfig {
  const outDir = resolve('../../../dist/libs/ts-rest', name);
  return {
    entry,
    outDir,
    format: ['esm', 'cjs'] as Array<'esm' | 'cjs'>,
    target: 'es2019',
    dts: true,
    tsconfig: 'tsconfig.lib.json',
    sourcemap: true,
    unbundle: name === 'react-query',
    deps: { neverBundle: [/^@ts-rest\//], dts: { neverBundle: true } },
    outExtensions: ({ format }: { format: string }) => ({
      js: format === 'es' ? '.esm.mjs' : '.cjs.js',
      dts: format === 'es' ? '.esm.d.mts' : '.cjs.d.ts',
    }),
    plugins:
      name === 'nest'
        ? [swc.rollup(decoratorOptions('tsconfig.lib.json'))]
        : [],
    hooks: {
      'build:done': async () => {
        const pkg = JSON.parse(await readFile('package.json', 'utf8'));
        delete pkg.scripts;
        delete pkg.devDependencies;
        if (name !== 'core') {
          const coreVersion = pkg.version.includes('-')
            ? pkg.version
            : `~${pkg.version.split('.').slice(0, 2).join('.')}.0`;
          pkg.peerDependencies = {
            ...pkg.peerDependencies,
            '@ts-rest/core': coreVersion,
          };
        }
        pkg.main = './index.cjs.js';
        pkg.module = './index.esm.mjs';
        pkg.types = './index.cjs.d.ts';
        pkg.exports = { './package.json': './package.json' };
        const subpaths: Record<string, string[]> = {};
        for (const key of Object.keys(entry)) {
          pkg.exports[key === 'index' ? '.' : `./${key}`] = {
            import: {
              types: `./${key}.esm.d.mts`,
              default: `./${key}.esm.mjs`,
            },
            require: { types: `./${key}.cjs.d.ts`, default: `./${key}.cjs.js` },
          };
          if (key !== 'index') subpaths[key] = [`./${key}.cjs.d.ts`];
        }
        if (Object.keys(subpaths).length) pkg.typesVersions = { '*': subpaths };
        await writeFile(
          resolve(outDir, 'package.json'),
          JSON.stringify(pkg, null, 2) + '\n',
        );
        await copyFile(resolve('../../../LICENCE'), resolve(outDir, 'LICENSE'));
        await copyFile('README.md', resolve(outDir, 'README.md'));
        await copyFile('CHANGELOG.md', resolve(outDir, 'CHANGELOG.md'));
      },
    },
  };
}

// Node examples share their runtime/packing policy and state local entry/output.
export function nodePack(
  outDir: string,
  entry = 'src/main.ts',
): PackUserConfig {
  return {
    entry: { main: entry },
    outDir,
    format: 'cjs',
    target: 'node26',
    dts: false,
    tsconfig: 'tsconfig.json',
    deps: { neverBundle: true, alwaysBundle: [/^@ts-rest\//] },
  };
}
