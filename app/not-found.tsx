import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6">
      <section className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase text-primary">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Page not found</h1>
        <p className="mt-2 text-sm text-slate-600">The requested workspace page does not exist.</p>
        <Link
          href="/"
          className="focus-ring mt-5 inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition hover:bg-red-700"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
