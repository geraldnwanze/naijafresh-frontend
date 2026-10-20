import Link from "next/link";

import { HYGIENE_PILLARS } from "@/lib/hygiene";

/** The homepage trust band, straight under the hero. */
export function HygieneBand() {
  return (
    <section className="border-b border-black/5 bg-white" aria-labelledby="hygiene-heading">
      <div className="container-page py-8 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="hygiene-heading" className="text-2xl font-bold text-brand-800">
              🧼 Hygiene comes first
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              From the market to your door, this is how we keep your food clean and safe.
            </p>
          </div>
          <Link href="/hygiene" className="text-sm font-semibold text-brand-700 hover:underline">
            Our hygiene promise →
          </Link>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {HYGIENE_PILLARS.map((pillar) => (
            <li key={pillar.title} className="rounded-card border border-brand-100 bg-brand-50/60 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-xl shadow-sm" aria-hidden>
                {pillar.icon}
              </span>
              <p className="mt-3 text-sm font-bold text-brand-800">{pillar.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{pillar.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
