import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { HYGIENE_CREDENTIALS, HYGIENE_PILLARS, STORAGE_TIPS } from "@/lib/hygiene";

export const metadata: Metadata = {
  title: "Our hygiene promise",
  description:
    "How NaijaFresh keeps your food clean and safe: sourced fresh, washed and cleaned, prepared and packed in a hygienic kitchen, labelled, and kept at the right temperature.",
};

export default function HygienePage() {
  return (
    <div>
      <section className="border-b border-black/5 bg-gradient-to-b from-brand-50 to-cream-100">
        <div className="container-page py-12 text-center md:py-16">
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
            🧼 Hygiene first
          </span>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-brand-800 sm:text-5xl">
            Clean food, handled with care
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-soft">
            Hygiene is the heart of NaijaFresh. Here is what happens to your order, from the market to your door, so you
            can feel safe with what you eat.
          </p>
        </div>
      </section>

      <section className="container-page py-12" aria-labelledby="journey-heading">
        <h2 id="journey-heading" className="text-2xl font-bold text-brand-800">
          From the market to your door
        </h2>
        <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HYGIENE_PILLARS.map((pillar, index) => (
            <li key={pillar.title} className="rounded-card border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-2xl" aria-hidden>
                  {pillar.icon}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-ink-soft">Step {index + 1}</span>
              </div>
              <h3 className="mt-3 text-lg font-bold text-brand-800">{pillar.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{pillar.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-12" aria-labelledby="storage-heading">
        <div className="container-page">
          <h2 id="storage-heading" className="text-2xl font-bold text-brand-800">
            Keeping your order safe at home
          </h2>
          <p className="mt-1 text-sm text-ink-soft">Food safety does not stop at the door. A few simple habits go a long way.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {STORAGE_TIPS.map((tip) => (
              <div key={tip.title} className="rounded-card border border-brand-100 bg-brand-50/60 p-5">
                <p className="text-2xl" aria-hidden>
                  {tip.icon}
                </p>
                <h3 className="mt-2 font-bold text-brand-800">{tip.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {HYGIENE_CREDENTIALS.length > 0 && (
        <section className="container-page py-12" aria-labelledby="credentials-heading">
          <h2 id="credentials-heading" className="text-2xl font-bold text-brand-800">
            Credentials
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {HYGIENE_CREDENTIALS.map((credential) => (
              <li key={credential.label} className="rounded-card border border-black/5 bg-white p-4">
                <p className="font-semibold text-ink">✅ {credential.label}</p>
                {credential.detail && <p className="mt-1 text-sm text-ink-soft">{credential.detail}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="container-page py-12 text-center">
        <h2 className="text-2xl font-bold text-brand-800">Shop with confidence</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
          Fresh, clean and carefully packed, from our kitchen to yours.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/products" size="lg">
            Start shopping
          </ButtonLink>
          <ButtonLink href="/products?type=meal_kit" size="lg" variant="outline">
            Explore meal kits
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
