import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

export const InstallTabs = ({ packageName }: { packageName: string }) => {
  const packages = packageName
    .trim()
    .split(/\s+/)
    .map((name) =>
      /^@ts-restless\/[^@]+$/.test(name) ? `${name}@alpha` : name,
    )
    .join(' ');
  return (
    <>
      <p>
        Public packages are not published yet. After the first alpha is available,
        install from its explicit prerelease channel. See the{' '}
        <a href="/ts-restless-migration">prerelease and migration guide</a>.
      </p>
      <Tabs items={['pnpm', 'bun', 'npm']} groupId="install" persist>
        <Tab value="pnpm" title="pnpm">
          <DynamicCodeBlock lang="bash" code={`pnpm add ${packages}`} />
        </Tab>
        <Tab value="bun" title="bun">
          <DynamicCodeBlock lang="bash" code={`bun add ${packages}`} />
        </Tab>
        <Tab value="npm" title="npm">
          <DynamicCodeBlock lang="bash" code={`npm install ${packages}`} />
        </Tab>
      </Tabs>
    </>
  );
};
