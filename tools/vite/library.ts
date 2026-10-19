import { mergeConfig, type UserConfig } from 'vite';
import type { PackUserConfig } from 'vite-plus/pack';
import { libraryPack } from './pack';

// Vite+ tasks are declared per package; share policy through a normal Vite config.
export function libraryConfig(
  name: string,
  entry: Record<string, string>,
  options: { pack?: PackUserConfig; workspaceInputs?: string[] } = {},
): UserConfig {
  const config: UserConfig = {
    run: {
      tasks: {
        pack: {
          command: 'vp pack',
          dependsOn: [
            { task: 'pack', from: ['dependencies', 'devDependencies'] },
          ],
          cache: {
            input: [
              'src/**',
              'package.json',
              'vite.config.ts',
              'tsconfig*.json',
              'README.md',
              'CHANGELOG.md',
              { pattern: 'LICENCE', base: 'workspace' },
              { pattern: 'tools/vite/**', base: 'workspace' },
              { pattern: 'tsconfig*.json', base: 'workspace' },
              { pattern: 'pnpm-lock.yaml', base: 'workspace' },
              ...(options.workspaceInputs ?? []).map((pattern) => ({
                pattern,
                base: 'workspace' as const,
              })),
            ],
            output: [
              { pattern: `dist/libs/ts-rest/${name}/**`, base: 'workspace' },
            ],
          },
        },
      },
    },
    pack: libraryPack(name, entry),
  };
  return mergeConfig(config, { pack: options.pack ?? {} });
}
