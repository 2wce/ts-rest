const optionalParameter = /\/:[^/?]+\?(?=\/|$)/;

const expandOptionalParameters = (path: string): string[] => {
  const match = path.match(optionalParameter);
  if (!match) return [path || '/'];

  return [
    ...expandOptionalParameters(path.replace(match[0], match[0].slice(0, -1))),
    ...expandOptionalParameters(path.replace(match[0], '')),
  ];
};

// Nest accepts path arrays across versions. Concrete alternatives preserve the
// contract syntax on both Express 4/5 and Fastify without version detection.
export const getNestRoutePaths = (path: string): string | string[] => {
  if (!optionalParameter.test(path)) return path;

  const seen = new Set<string>();
  return expandOptionalParameters(path).filter((candidate) => {
    // Prefer earlier parameter names for ambiguous paths, as optional segments
    // did originally. Fastify rejects duplicate route shapes with other names.
    const shape = candidate.replace(/:[^/]+/g, ':param');
    if (seen.has(shape)) return false;
    seen.add(shape);
    return true;
  });
};
