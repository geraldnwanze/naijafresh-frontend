"use client";

import { useState } from "react";

import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { apiFetch, ApiError } from "@/lib/api";
import { formatNaira, formatPct, profitTextClass } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

const STEP_OPTIONS = [100, 250, 500, 1000];

/** Stock is stored in grams for weight-sold products; the form edits it in kg. */
function gramsToKg(grams: number | null | undefined): string {
  return grams == null ? "" : String(Number((grams / 1000).toFixed(3)));
}

const kgToGrams = (kg: string): number => Math.round(Number(kg) * 1000);

const PREP_TYPES = ["", "raw", "cleaned", "chopped", "portioned", "blended", "ready_to_cook"];

interface VariantRow {
  cost_delta_naira: string;
  name: string;
  price_delta_naira: string;
  is_default: boolean;
}

function toLines(value: string): string[] {
  return value.split("\n").map((s) => s.trim()).filter(Boolean);
}

export function ProductForm({
  categories,
  product,
  onSaved,
  onCancel,
}: {
  categories: Category[];
  product?: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { token } = useAuth();
  const { toast } = useToast();
  const editing = !!product;

  const [form, setForm] = useState({
    category_id: product?.category?.id ?? categories[0]?.id ?? 0,
    type: product?.type ?? "ingredient",
    sold_by: (product?.sold_by ?? "unit") as "unit" | "weight",
    storage_type: (product?.storage_type ?? "ambient") as "ambient" | "chilled" | "frozen",
    // Weight-based selling (price is per kg; amounts below are kg)
    weight_step_grams: String(product?.weight?.step_grams ?? 500),
    min_weight_kg: gramsToKg(product?.weight?.min_grams ?? 500),
    max_weight_kg: gramsToKg(product?.weight?.max_grams),
    name: product?.name ?? "",
    description: product?.description ?? "",
    price_naira: product ? String(product.price_kobo / 100) : "",
    compare_at_price_naira: product?.compare_at_price_kobo ? String(product.compare_at_price_kobo / 100) : "",
    cost_naira: product?.cost_price_kobo != null ? String(product.cost_price_kobo / 100) : "",
    unit: product?.unit ?? "pack",
    stock_quantity:
      product?.sold_by === "weight" ? gramsToKg(product.stock_quantity ?? 0) : String(product?.stock_quantity ?? 0),
    is_available: product?.is_available ?? true,
    is_featured: product?.is_featured ?? false,
    preparation_type: product?.preparation_type ?? "",
    image_url: product?.image_url ?? "",
    tags: (product?.tags ?? []).join(", "),
    serves: product?.meal_kit?.serves ?? "",
    prep_time_minutes: product?.meal_kit?.prep_time_minutes ? String(product.meal_kit.prep_time_minutes) : "",
    included_items: (product?.meal_kit?.included_items ?? []).join("\n"),
    not_included_items: (product?.meal_kit?.not_included_items ?? []).join("\n"),
    storage_instructions: product?.meal_kit?.storage_instructions ?? "",
    cooking_instructions: product?.meal_kit?.cooking_instructions ?? "",
  });
  const [variants, setVariants] = useState<VariantRow[]>(
    (product?.variants ?? []).map((v) => ({
      name: v.name,
      price_delta_naira: String(v.price_delta_kobo / 100),
      cost_delta_naira: String((v.cost_delta_kobo ?? 0) / 100),
      is_default: v.is_default,
    })),
  );
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setErrors({});

    const body: Record<string, unknown> = {
      category_id: Number(form.category_id),
      type: form.type,
      name: form.name,
      description: form.description,
      price_kobo: Math.round(Number(form.price_naira) * 100),
      cost_price_kobo: form.cost_naira !== "" ? Math.round(Number(form.cost_naira) * 100) : null,
      compare_at_price_kobo: form.compare_at_price_naira
        ? Math.round(Number(form.compare_at_price_naira) * 100)
        : null,
      sold_by: form.sold_by,
      storage_type: form.storage_type,
      ...(form.sold_by === "weight"
        ? {
            // The API forces the unit to "kg"; stock and limits are grams.
            weight_step_grams: Number(form.weight_step_grams),
            min_weight_grams: kgToGrams(form.min_weight_kg),
            max_weight_grams: form.max_weight_kg ? kgToGrams(form.max_weight_kg) : null,
            stock_quantity: kgToGrams(form.stock_quantity),
          }
        : {
            unit: form.unit,
            stock_quantity: Number(form.stock_quantity),
          }),
      is_available: form.is_available,
      is_featured: form.is_featured,
      preparation_type: form.preparation_type || null,
      image_url: form.image_url || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };

    if (form.type === "meal_kit") {
      Object.assign(body, {
        serves: form.serves || null,
        prep_time_minutes: form.prep_time_minutes ? Number(form.prep_time_minutes) : null,
        included_items: toLines(form.included_items),
        not_included_items: toLines(form.not_included_items),
        storage_instructions: form.storage_instructions || null,
        cooking_instructions: form.cooking_instructions || null,
        variants: variants
          .filter((v) => v.name.trim())
          .map((v) => ({
            name: v.name.trim(),
            price_delta_kobo: Math.round(Number(v.price_delta_naira || 0) * 100),
            cost_delta_kobo: Math.round(Number(v.cost_delta_naira || 0) * 100),
            is_default: v.is_default,
          })),
      });
    }

    try {
      await apiFetch(editing ? `/admin/products/${product!.id}` : "/admin/products", {
        method: editing ? "PUT" : "POST",
        token,
        body,
      });
      toast(editing ? "Product updated" : "Product created", "success");
      onSaved();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        toast(err.firstError ?? err.message, "error");
      } else {
        toast("Could not save the product.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  // Live profit preview from the selling and cost price being typed.
  const priceKobo = Math.round(Number(form.price_naira) * 100);
  const costKobo = Math.round(Number(form.cost_naira) * 100);
  const marginHint =
    form.cost_naira !== "" && form.price_naira !== "" && priceKobo > 0 && Number.isFinite(costKobo)
      ? {
          profitKobo: priceKobo - costKobo,
          marginPct: Math.round(((priceKobo - costKobo) / priceKobo) * 1000) / 10,
        }
      : null;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required error={errors.name?.[0]}>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </Field>
        <Field label="Category" required error={errors.category_id?.[0]}>
          <Select value={form.category_id} onChange={(e) => set("category_id", Number(e.target.value))}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={(e) => set("type", e.target.value as Product["type"])}>
            <option value="ingredient">Ingredient</option>
            <option value="meal_kit">Meal kit</option>
          </Select>
        </Field>
        <Field label="How is it sold?">
          <Select value={form.sold_by} onChange={(e) => set("sold_by", e.target.value as "unit" | "weight")}>
            <option value="unit">Per item (bunch, pack, kit…)</option>
            <option value="weight">By weight (price per kg)</option>
          </Select>
        </Field>
        <Field label="Storage">
          <Select
            value={form.storage_type}
            onChange={(e) => set("storage_type", e.target.value as "ambient" | "chilled" | "frozen")}
          >
            <option value="ambient">Room temperature</option>
            <option value="chilled">Keep refrigerated</option>
            <option value="frozen">Frozen</option>
          </Select>
        </Field>
        {form.sold_by === "unit" && (
          <Field label="Unit" required error={errors.unit?.[0]}>
            <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} required />
          </Field>
        )}
        <Field
          label={form.sold_by === "weight" ? "Selling price per kg (₦)" : "Selling price (₦)"}
          required
          error={errors.price_kobo?.[0]}
        >
          <Input type="number" min="0" step="1" value={form.price_naira} onChange={(e) => set("price_naira", e.target.value)} required />
        </Field>
        <Field
          label={form.sold_by === "weight" ? "Cost price per kg (₦)" : "Cost price (₦)"}
          hint="What it costs you to buy or make. Never shown to customers."
          error={errors.cost_price_kobo?.[0]}
        >
          <Input type="number" min="0" step="1" value={form.cost_naira} onChange={(e) => set("cost_naira", e.target.value)} />
        </Field>
        <Field label="Compare-at price (₦)" hint="Optional strike-through price." error={errors.compare_at_price_kobo?.[0]}>
          <Input type="number" min="0" step="1" value={form.compare_at_price_naira} onChange={(e) => set("compare_at_price_naira", e.target.value)} />
        </Field>
        <Field
          label={form.sold_by === "weight" ? "Stock (kg)" : "Stock quantity"}
          required
          error={errors.stock_quantity?.[0]}
        >
          <Input
            type="number"
            min="0"
            step={form.sold_by === "weight" ? "0.1" : "1"}
            value={form.stock_quantity}
            onChange={(e) => set("stock_quantity", e.target.value)}
            required
          />
        </Field>
        {form.sold_by === "weight" && (
          <>
            <Field label="Sold in steps of" error={errors.weight_step_grams?.[0]}>
              <Select value={form.weight_step_grams} onChange={(e) => set("weight_step_grams", e.target.value)}>
                {STEP_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g >= 1000 ? `${g / 1000} kg` : `${g} g`}</option>
                ))}
              </Select>
            </Field>
            <Field label="Minimum order (kg)" error={errors.min_weight_grams?.[0]}>
              <Input
                type="number"
                min="0.05"
                step="0.05"
                value={form.min_weight_kg}
                onChange={(e) => set("min_weight_kg", e.target.value)}
              />
            </Field>
            <Field label="Maximum order (kg)" hint="Optional." error={errors.max_weight_grams?.[0]}>
              <Input
                type="number"
                min="0.05"
                step="0.05"
                value={form.max_weight_kg}
                onChange={(e) => set("max_weight_kg", e.target.value)}
              />
            </Field>
          </>
        )}
        <Field label="Preparation">
          <Select value={form.preparation_type} onChange={(e) => set("preparation_type", e.target.value)}>
            {PREP_TYPES.map((p) => (
              <option key={p} value={p}>{p ? p.replace(/_/g, " ") : "—"}</option>
            ))}
          </Select>
        </Field>
      </div>

      {marginHint && (
        <div className="rounded-xl border border-black/5 bg-cream-100 px-4 py-3 text-sm">
          <span className="text-ink-soft">
            Profit {form.sold_by === "weight" ? "per kg" : "per item"}:{" "}
          </span>
          <span className={"font-bold " + profitTextClass(marginHint.profitKobo)}>
            {formatNaira(marginHint.profitKobo)} · {formatPct(marginHint.marginPct)} margin
          </span>
          {marginHint.profitKobo < 0 && (
            <span className="ml-2 font-semibold text-rose-600">Selling below cost</span>
          )}
        </div>
      )}

      <Field label="Description" required error={errors.description?.[0]}>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} required />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Image URL" hint="Leave blank to use a branded placeholder.">
          <Input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} />
        </Field>
        <Field label="Tags" hint="Comma separated">
          <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="soup, pepper, stew" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-5 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_available} onChange={(e) => set("is_available", e.target.checked)} className="accent-brand-700" />
          Available for sale
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="accent-brand-700" />
          Featured on homepage
        </label>
      </div>

      {form.type === "meal_kit" && (
        <div className="space-y-4 rounded-xl bg-brand-50/50 p-4">
          <p className="text-sm font-semibold text-brand-800">Meal kit details</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Serves">
              <Input value={form.serves} onChange={(e) => set("serves", e.target.value)} placeholder="4–5 people" />
            </Field>
            <Field label="Prep & cook time (mins)">
              <Input type="number" min="0" value={form.prep_time_minutes} onChange={(e) => set("prep_time_minutes", e.target.value)} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Included items" hint="One per line">
              <Textarea value={form.included_items} onChange={(e) => set("included_items", e.target.value)} />
            </Field>
            <Field label="Not included" hint="One per line">
              <Textarea value={form.not_included_items} onChange={(e) => set("not_included_items", e.target.value)} />
            </Field>
          </div>
          <Field label="Cooking instructions">
            <Textarea value={form.cooking_instructions} onChange={(e) => set("cooking_instructions", e.target.value)} />
          </Field>
          <Field label="Storage instructions">
            <Textarea value={form.storage_instructions} onChange={(e) => set("storage_instructions", e.target.value)} />
          </Field>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-800">Protein options</p>
              <Button type="button" size="sm" variant="ghost" onClick={() => setVariants((v) => [...v, { name: "", price_delta_naira: "0", cost_delta_naira: "0", is_default: false }])}>
                + Add option
              </Button>
            </div>
            <div className="mt-2 space-y-2">
              {variants.map((variant, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <Input
                    placeholder="e.g. Beef"
                    value={variant.name}
                    onChange={(e) => setVariants((v) => v.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                    className="max-w-[160px]"
                  />
                  <Input
                    type="number"
                    step="1"
                    placeholder="+₦"
                    value={variant.price_delta_naira}
                    onChange={(e) => setVariants((v) => v.map((x, j) => (j === i ? { ...x, price_delta_naira: e.target.value } : x)))}
                    className="max-w-[110px]"
                    aria-label="Extra selling price"
                  />
                  <Input
                    type="number"
                    step="1"
                    placeholder="cost ₦"
                    value={variant.cost_delta_naira}
                    onChange={(e) => setVariants((v) => v.map((x, j) => (j === i ? { ...x, cost_delta_naira: e.target.value } : x)))}
                    className="max-w-[110px]"
                    aria-label="Extra cost"
                  />
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="radio"
                      name="default_variant"
                      checked={variant.is_default}
                      onChange={() => setVariants((v) => v.map((x, j) => ({ ...x, is_default: j === i })))}
                    />
                    default
                  </label>
                  <button type="button" onClick={() => setVariants((v) => v.filter((_, j) => j !== i))} className="text-xs text-rose-600">
                    remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create product"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
