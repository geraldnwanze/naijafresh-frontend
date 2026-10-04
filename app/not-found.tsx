import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream-100 px-4 text-center">
      <p className="text-5xl">🧺</p>
      <h1 className="mt-4 text-2xl font-bold text-brand-800">We couldn&apos;t find that page</h1>
      <p className="mt-1 text-sm text-ink-soft">The link may be old, or the item is no longer available.</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-800"
      >
        Back to shop
      </Link>
    </div>
  );
}
