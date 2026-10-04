import Link from "next/link";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-50 px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2 text-xl font-extrabold text-brand-800">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-lg">🥬</span>
        Naija<span className="text-leaf-500">Fresh</span>
      </Link>
      <div className="w-full max-w-md rounded-card border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        {children}
      </div>
      <Link href="/" className="mt-6 text-sm text-ink-soft hover:underline">
        ← Back to shop
      </Link>
    </div>
  );
}
