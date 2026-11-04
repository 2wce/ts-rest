import { use } from 'react';
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from 'fumadocs-ui/page';
import { docs } from '@/lib/source';
import { getMDXComponents } from '@/mdx-components';

export function DocsContent({ path }: { path: string }) {
  const page = docs.getPage(path);
  if (!page) throw new Error(`Unknown docs page: ${path}`);
  const { toc } = use(page.load());
  const MDXContent = page.body;
  const isHomePage = page.title === 'Intro';

  return (
    <DocsPage toc={toc} full={page.full}>
      {isHomePage ? (
        <div className="flex w-full flex-col gap-4 items-center justify-center">
          <h1 className="text-4xl font-bold tracking-tight">ts-restless</h1>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.5rem',
              margin: '0',
              padding: '0',
            }}
          >
            <a href="https://github.com/2wce/ts-rest">
              <img
                alt="GitHub Repo stars"
                src="https://img.shields.io/github/stars/2wce/ts-rest"
              />
            </a>
            <a
              href="https://github.com/2wce/ts-rest/blob/main/LICENCE"
              className="hidden lg:block"
            >
              <img
                alt="License"
                src="https://img.shields.io/github/license/2wce/ts-rest"
              />
            </a>
          </div>
        </div>
      ) : (
        <>
          <DocsTitle>{page.title}</DocsTitle>
          <DocsDescription>{page.description}</DocsDescription>
        </>
      )}
      <DocsBody>
        <MDXContent components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}
