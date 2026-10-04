"use client";

export default function StoreError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="text-4xl">⚠️</p>
      <h1 className="mt-4 text-xl font-bold text-brand-800">Something went wrong</h1>
      <p className="mt-1 text-sm text-ink-soft">
        We couldn&apos;t load this page. The API may be starting up — try again in a moment.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Try again
      </button>
    </div>
  );
}
