import type { Options } from 'unplugin-swc';

// The packer and test transformer both need Nest's legacy decorator metadata.
export function decoratorOptions(tsconfigFile: string, jsx = false): Options {
  return {
    tsconfigFile,
    swcrc: false,
    jsc: {
      parser: { syntax: 'typescript', decorators: true },
      transform: {
        legacyDecorator: true,
        decoratorMetadata: true,
        ...(jsx ? { react: { runtime: 'automatic' as const } } : {}),
      },
      target: 'es2019',
      keepClassNames: true,
    },
    module: { type: 'es6' },
  };
}
