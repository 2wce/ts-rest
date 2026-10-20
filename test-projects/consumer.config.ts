// Shared data only: each standalone fixture resolves tooling from its own install.
export default {
  test: {
    environment: 'node',
    include: ['index.spec.ts'],
  },
  pack: {
    entry: { index: 'index.ts' },
    format: 'esm' as const,
    target: 'node26',
    deps: { neverBundle: true },
  },
};
