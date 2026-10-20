import { createFileRoute, notFound } from '@tanstack/react-router';
import { Suspense } from 'react';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { docs, source } from '@/lib/source';
import { baseOptions } from '@/lib/layout.shared';
import { DocsContent } from '@/components/DocsContent';

export const Route = createFileRoute('/$')({
  loader: async ({ params }) => {
    const page = source.getPage(
      params._splat?.split('/').filter(Boolean) ?? [],
    );
    if (!page) throw notFound();
    await docs.getPage(page.path)?.preload();
    return {
      path: page.path,
      title: page.data.title,
      description: page.data.description,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: loaderData.title },
          { name: 'description', content: loaderData.description },
        ]
      : [],
  }),
  component: Page,
});

function Page() {
  const { path } = Route.useLoaderData();
  return (
    <DocsLayout tree={source.pageTree} sidebar={{}} {...baseOptions}>
      <Suspense fallback={<p>Loading documentation…</p>}>
        <DocsContent path={path} />
      </Suspense>
    </DocsLayout>
  );
}
