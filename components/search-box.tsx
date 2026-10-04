"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ProductImage } from "@/components/product-image";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/format";
import type { Paginated, Product } from "@/lib/types";

const MIN_CHARS = 2;
const DEBOUNCE_MS = 180;

export function SearchBox({
  placeholder = "Search ingredients, spices, meal kits…",
  className,
}: {
  placeholder?: string;
  className?: string;
}) {
  const router = useRouter();
  const boxRef = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const term = query.trim();
  const showPanel = open && term.length >= MIN_CHARS;

  // Live query as the shopper types.
  useEffect(() => {
    if (term.length < MIN_CHARS) {
      setResults([]);
      setLoading(false);
      return;
    }

    const id = ++seq.current;
    setLoading(true);

    const timer = setTimeout(() => {
      apiFetch<Paginated<Product>>(`/products?search=${encodeURIComponent(term)}&per_page=6`)
        .then((res) => {
          if (id === seq.current) {
            setResults(res.data);
            setLoading(false);
            setHighlight(-1);
          }
        })
        .catch(() => {
          if (id === seq.current) {
            setResults([]);
            setLoading(false);
          }
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [term]);

  // Close on outside click.
  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function goToResults(value = term) {
    setOpen(false);
    router.push(value ? `/products?search=${encodeURIComponent(value)}` : "/products");
  }

  function pick(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/products/${slug}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!showPanel) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((h) => Math.min(results.length - 1, h + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => Math.max(-1, h - 1));
    } else if (event.key === "Enter" && highlight >= 0 && results[highlight]) {
      event.preventDefault();
      pick(results[highlight].slug);
    }
  }

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
      >
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search products"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls="search-suggestions"
          autoComplete="off"
          className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25"
        />
      </form>

      {showPanel && (
        <div
          id="search-suggestions"
          className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl"
        >
          {loading && results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-soft">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-soft">No matches for “{term}”.</p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto py-1">
              {results.map((product, index) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => pick(product.slug)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left",
                      index === highlight ? "bg-brand-50" : "hover:bg-brand-50",
                    )}
                  >
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                      <ProductImage product={product} rounded="rounded-none" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{product.name}</span>
                      <span className="block text-xs text-ink-soft">
                        {product.category?.name ?? (product.is_meal_kit ? "Meal kit" : "Ingredient")}
                        {!product.in_stock ? " · out of stock" : ""}
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-brand-800">{product.price}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => goToResults()}
            className="block w-full border-t border-black/5 bg-cream-50 px-4 py-2.5 text-left text-sm font-semibold text-brand-700 hover:bg-brand-50"
          >
            See all results for “{term}” →
          </button>
        </div>
      )}
    </div>
  );
}
