import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-black/5 bg-brand-800 text-cream-100">
      <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700">🥬</span>
            NaijaFresh
          </div>
          <p className="mt-3 max-w-xs text-sm text-cream-200/80">
            Your Nigerian kitchen, prepared for you. Fresh ingredients, local spices and ready-to-cook
            meal kits delivered to your door.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cream-200/70">Shop</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/products" className="hover:underline">All products</Link></li>
            <li><Link href="/products?type=meal_kit" className="hover:underline">Meal kits</Link></li>
            <li><Link href="/products?type=food_pack" className="hover:underline">Food packs</Link></li>
            <li><Link href="/categories/spices-seasonings" className="hover:underline">Spices &amp; seasonings</Link></li>
            <li><Link href="/categories/protein" className="hover:underline">Protein</Link></li>
            <li><Link href="/categories/frozen-foods" className="hover:underline">Frozen foods</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cream-200/70">Account</h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/orders" className="hover:underline">My orders</Link></li>
            <li><Link href="/account" className="hover:underline">My account</Link></li>
            <li><Link href="/login" className="hover:underline">Sign in</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-cream-200/70">Delivery</h4>
          <p className="mt-3 text-sm text-cream-200/80">
            We deliver across Lagos, Abuja and Port Harcourt in the morning, afternoon or evening —
            you pick the window at checkout.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-cream-200/70">
        © {new Date().getFullYear()} NaijaFresh. Sample MVP — prices are for demonstration.
      </div>
    </footer>
  );
}
