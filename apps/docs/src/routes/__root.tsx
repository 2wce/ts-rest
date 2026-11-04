import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router';
import { RootProvider } from 'fumadocs-ui/provider/tanstack';
import { Banner } from 'fumadocs-ui/components/banner';
import { PostHogProvider } from '@/components/PostHogProvider';
import { CookieBanner } from '@/components/CookieBanner';
import appCss from '@/styles/app.css?url';

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ts-restless' },
      {
        name: 'description',
        content:
          'Contract-first, end-to-end typed REST for TypeScript. A maintained fork of ts-rest.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        <PostHogProvider>
          <Banner variant="rainbow" id="ts-restless-v4-preview">
            ts-restless v4 development preview. New-scope packages are being
            prepared. <a href="/ts-restless-migration">Release and migration guide.</a>
          </Banner>
          <RootProvider
            search={{ options: { type: 'static', api: '/api/search.json' } }}
          >
            <Outlet />
          </RootProvider>
          <CookieBanner />
        </PostHogProvider>
        <Scripts />
      </body>
    </html>
  );
}
