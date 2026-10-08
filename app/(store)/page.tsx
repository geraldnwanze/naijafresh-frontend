import Link from "next/link";

import { CategoryCard } from "@/components/category-card";
import { ProductCard } from "@/components/product-card";
import { ButtonLink } from "@/components/ui/button";
import { getCategories, getProducts } from "@/lib/catalogue";
import { formatNaira } from "@/lib/format";

// Rendered per request (the API is read at request time, not at build time),
// but each API read is still cached for 120s — see lib/catalogue.ts.
export const dynamic = "force-dynamic";

const HOW_IT_WORKS = [
  { step: "1", title: "You order", body: "Pick the ingredients or meal kits for the dishes you want to cook." },
  { step: "2", title: "We source", body: "We buy everything fresh from the market that morning." },
  { step: "3", title: "We prepare", body: "We wash, clean, chop and portion each ingredient." },
  { step: "4", title: "We package", body: "Everything is packed hygienically and labelled for your kit." },
  { step: "5", title: "We deliver", body: "We bring it to your door in the delivery window you choose." },
];

const WHY = [
  { icon: "🌿", title: "Fresh ingredients", body: "Sourced from the market the same day we deliver." },
  { icon: "⏱️", title: "Save time", body: "Skip hours of market runs, washing and chopping." },
  { icon: "🧼", title: "Clean preparation", body: "Prepped and packed in a hygienic kitchen." },
  { icon: "🛵", title: "Convenient delivery", body: "Choose a morning, afternoon or evening window." },
];

export default async function HomePage() {
  const [categories, featured, mealKits, foodPacks] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, per_page: 8 }),
    getProducts({ type: "meal_kit", per_page: 6 }),
    getProducts({ type: "food_pack", per_page: 6, sort: "price_asc" }),
  ]);

  const cheapestPack = foodPacks.data.length > 0 ? Math.min(...foodPacks.data.map((p) => p.price_kobo)) : null;

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-black/5 bg-gradient-to-b from-brand-50 to-cream-100">
        <div className="container-page grid gap-8 py-12 md:grid-cols-2 md:items-center md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
              🇳🇬 Cooked at home, sourced by us
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-brand-800 sm:text-5xl">
              Your Nigerian kitchen, prepared for you.
            </h1>
            <p className="mt-4 max-w-md text-lg text-ink-soft">
              Fresh ingredients, local spices and ready-to-cook meals delivered to your door.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/products" size="lg">Shop fresh ingredients</ButtonLink>
              <ButtonLink href="/products?type=meal_kit" size="lg" variant="outline">
                Explore meal kits
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              You choose what you want to cook. We handle the market work.
            </p>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-3">
              {["🍲", "🥬", "🌶️", "🍚", "🐟", "🧂"].map((emoji, i) => (
                <div
                  key={emoji}
                  className={`grid aspect-square place-items-center rounded-card bg-white text-5xl shadow-sm ${
                    i % 3 === 1 ? "translate-y-4" : ""
                  }`}
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Shop by category */}
      <section className="container-page py-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold text-brand-800">Shop by category</h2>
          <Link href="/products" className="text-sm font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </section>

      {/* Popular meal kits */}
      {mealKits.data.length > 0 && (
        <section className="bg-white py-12">
          <div className="container-page">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-brand-800">Popular meal kits</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Every ingredient washed, chopped and portioned. You just cook.
                </p>
              </div>
              <Link href="/products?type=meal_kit" className="text-sm font-semibold text-brand-700 hover:underline">
                All meal kits
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {mealKits.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Food pack combos */}
      {foodPacks.data.length > 0 && (
        <section className="bg-amber-50/60 py-12">
          <div className="container-page">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold text-brand-800">Food pack combos</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  Non-perishable staples bundled at one pack price
                  {cheapestPack !== null ? `, from ${formatNaira(cheapestPack)}` : ""}.
                </p>
              </div>
              <Link href="/products?type=food_pack" className="text-sm font-semibold text-brand-700 hover:underline">
                All food packs
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {foodPacks.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="container-page py-14">
        <h2 className="text-center text-2xl font-bold text-brand-800">How it works</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="rounded-card border border-black/5 bg-white p-5 text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
                {item.step}
              </span>
              <p className="mt-3 font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.data.length > 0 && (
        <section className="bg-white py-12">
          <div className="container-page">
            <h2 className="text-2xl font-bold text-brand-800">Fresh picks this week</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {featured.data.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why NaijaFresh */}
      <section className="container-page py-14">
        <h2 className="text-center text-2xl font-bold text-brand-800">Why NaijaFresh</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map((item) => (
            <div key={item.title} className="rounded-card bg-brand-50 p-5">
              <span className="text-2xl">{item.icon}</span>
              <p className="mt-2 font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-16">
        <div className="rounded-card bg-brand-800 px-6 py-12 text-center text-cream-100">
          <h2 className="text-2xl font-bold sm:text-3xl">Cook the food you love. Skip the market stress.</h2>
          <div className="mt-6 flex justify-center gap-3">
            <ButtonLink href="/products" size="lg" variant="secondary">Start shopping</ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
