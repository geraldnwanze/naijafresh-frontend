import { cn } from "@/lib/format";
import type { Product } from "@/lib/types";

const EMOJI_RULES: [RegExp, string][] = [
  [/vegetable/i, "🥦"],
  [/jollof|fried rice/i, "🍚"],
  [/suya|ayamase|kit/i, "🍲"],
  [/pepper|rodo|tatashe|scotch/i, "🌶️"],
  [/rice|semo|poundo|garri|beans/i, "🍚"],
  [/tomato/i, "🍅"],
  [/onion/i, "🧅"],
  [/plantain|banana/i, "🍌"],
  [/yam|potato/i, "🍠"],
  [/oil/i, "🫗"],
  [/fish|catfish|titus|stockfish|panla/i, "🐟"],
  [/beef|meat|goat|kpomo|cow/i, "🥩"],
  [/turkey/i, "🦃"],
  [/chicken/i, "🍗"],
  [/crayfish|prawn|shrimp/i, "🦐"],
  [/leaf|ugu|waterleaf|spinach|efo|bitter|scent|oha|afang/i, "🥬"],
  [/soup|egusi|okro|okra|banga|edikang/i, "🍲"],
  [/spice|ogiri|uziza|ehuru|suya|seasoning|nutmeg/i, "🧂"],
  [/pineapple|watermelon|agbalumo|fruit|orange/i, "🍍"],
  [/box|bundle|pack/i, "🧺"],
];

function emojiFor(product: Pick<Product, "name" | "tags"> & { is_food_pack?: boolean }): string {
  if (product.is_food_pack) return "🧺";
  const haystack = `${product.name} ${(product.tags ?? []).join(" ")}`;
  for (const [re, emoji] of EMOJI_RULES) {
    if (re.test(haystack)) return emoji;
  }
  return "🍽️";
}

export function ProductImage({
  product,
  className,
  rounded = "rounded-xl",
}: {
  product: Pick<Product, "name" | "tags" | "image_url" | "is_meal_kit"> & { is_food_pack?: boolean };
  className?: string;
  rounded?: string;
}) {
  if (product.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external URLs, optimizer intentionally bypassed for the MVP
      <img
        src={product.image_url}
        alt={product.name}
        loading="lazy"
        className={cn("h-full w-full object-cover", rounded, className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-gradient-to-br",
        product.is_meal_kit
          ? "from-brand-100 to-accent-400/30"
          : product.is_food_pack
            ? "from-amber-100 to-accent-400/30"
            : "from-brand-50 to-leaf-400/25",
        rounded,
        className,
      )}
      aria-hidden
    >
      <span className="text-5xl drop-shadow-sm sm:text-6xl">{emojiFor(product)}</span>
    </div>
  );
}
