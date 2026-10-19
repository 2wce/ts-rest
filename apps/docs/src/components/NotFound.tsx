import { Link } from '@tanstack/react-router';

export function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-semibold">404 — Page not found</h1>
      <Link to="/$" params={{ _splat: '' }} className="underline">
        Return to the docs
      </Link>
    </main>
  );
}
