import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const cli = join(root, 'node_modules/@changesets/cli/bin.js');
const archive = 'nest.tgz';

async function workspace() {
  const cwd = await mkdtemp(join(tmpdir(), 'ts-rest-version-'));
  await mkdir(join(cwd, '.changeset'));
  await cp(
    join(root, '.changeset/config.json'),
    join(cwd, '.changeset/config.json'),
  );
  await writeFile(
    join(cwd, 'package.json'),
    JSON.stringify({
      name: 'version-test',
      private: true,
      workspaces: ['libs/ts-rest/*'],
    }),
  );
  await writeFile(
    join(cwd, 'pnpm-workspace.yaml'),
    "packages:\n  - 'libs/ts-rest/*'\n",
  );
  for (const name of ['core', 'nest', 'react-query-v5']) {
    await mkdir(join(cwd, 'libs/ts-rest', name), { recursive: true });
    await writeFile(
      join(cwd, 'libs/ts-rest', name, 'package.json'),
      JSON.stringify({
        name: `@ts-rest/${name}`,
        version: '3.52.1',
        private: name === 'react-query-v5',
        ...(name === 'nest'
          ? {
              peerDependencies: {
                '@ts-rest/core': 'workspace:^',
                '@nestjs/core': '^9 || ^10 || ^11 || ^12',
              },
            }
          : {}),
      }),
    );
  }
  return cwd;
}

function changeset(cwd, ...args) {
  execFileSync(process.execPath, [cli, ...args], { cwd, stdio: 'pipe' });
}

async function bump(cwd, type, ...args) {
  await writeFile(
    join(cwd, '.changeset/test-bump.md'),
    `---\n"@ts-rest/core": ${type}\n---\nTest release.\n`,
  );
  changeset(cwd, 'version', ...args);
}

async function assertVersion(cwd, version, peer) {
  const pkg = JSON.parse(
    await readFile(join(cwd, 'libs/ts-rest/nest/package.json')),
  );
  assert.equal(pkg.version, version);
  assert.equal(pkg.peerDependencies['@ts-rest/core'], 'workspace:^');
  execFileSync(
    'pnpm',
    [
      '--dir',
      join(cwd, 'libs/ts-rest/nest'),
      'pack',
      '--out',
      join(cwd, archive),
      '--silent',
    ],
    { stdio: 'pipe' },
  );
  const published = JSON.parse(
    execFileSync('tar', ['-xOf', join(cwd, archive), 'package/package.json'], {
      encoding: 'utf8',
    }),
  );
  assert.equal(published.peerDependencies['@ts-rest/core'], peer);
  assert.equal(pkg.peerDependencies['@nestjs/core'], '^9 || ^10 || ^11 || ^12');
  const privatePkg = JSON.parse(
    await readFile(join(cwd, 'libs/ts-rest/react-query-v5/package.json')),
  );
  assert.equal(privatePkg.private, true);
  assert.equal(privatePkg.peerDependencies, undefined);
}

await test('patch and minor releases pack native caret peers without an unintended major bump', async () => {
  const cwd = await workspace();
  try {
    await bump(cwd, 'patch');
    await assertVersion(cwd, '3.52.2', '^3.52.2');
    await bump(cwd, 'minor');
    await assertVersion(cwd, '3.53.0', '^3.53.0');
    await bump(cwd, 'major');
    await assertVersion(cwd, '4.0.0', '^4.0.0');
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});

await test('snapshot prereleases pack native caret peers using the calculated release version', async () => {
  const cwd = await workspace();
  try {
    await bump(cwd, 'minor', '--snapshot', 'rc');
    const core = JSON.parse(
      await readFile(join(cwd, 'libs/ts-rest/core/package.json')),
    );
    assert.match(core.version, /^3\.53\.0-rc\.\d+$/);
    await assertVersion(cwd, core.version, `^${core.version}`);
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
