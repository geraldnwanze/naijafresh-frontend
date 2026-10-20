// What the storefront says about hygiene, in one place so it is easy to edit.
//
// Every statement here is something the app already does or tells customers
// (washing and cleaning, a hygienic kitchen, packing and labelling, cooler bags
// for frozen items, storage guidance). If your practice goes further or differs,
// change the wording here and it updates everywhere.

export interface HygienePillar {
  icon: string;
  title: string;
  body: string;
}

export const HYGIENE_PILLARS: HygienePillar[] = [
  {
    icon: "🧺",
    title: "Sourced fresh",
    body: "We buy from the market the same day we deliver.",
  },
  {
    icon: "🧼",
    title: "Washed & cleaned",
    body: "Every ingredient is washed and cleaned before it is chopped or portioned.",
  },
  {
    icon: "🍳",
    title: "Hygienic kitchen",
    body: "Everything is prepped and packed in a hygienic kitchen.",
  },
  {
    icon: "🏷️",
    title: "Packed & labelled",
    body: "Orders are packed hygienically and labelled, so you know exactly what you are getting.",
  },
  {
    icon: "❄️",
    title: "Right temperature",
    body: "Frozen items travel separately in an insulated cooler bag. Chilled meal kits are meant for your fridge.",
  },
];

export interface StorageTip {
  icon: string;
  title: string;
  body: string;
}

/** How to keep each kind of order safe once it is at your door. */
export const STORAGE_TIPS: StorageTip[] = [
  {
    icon: "❄️",
    title: "Frozen foods",
    body: "We pack frozen items separately in an insulated cooler bag. Please be available during your delivery window and move them to the freezer straight away.",
  },
  {
    icon: "🍲",
    title: "Meal kits",
    body: "Refrigerate on arrival and cook within 48 hours for the best results.",
  },
  {
    icon: "🧺",
    title: "Food packs and dry goods",
    body: "Everything in a food pack is non-perishable. Keep it in a cool, dry place.",
  },
];

/**
 * Registrations and certificates you hold (for example your food regulator
 * registration number or staff food-handler certificates). Left empty on
 * purpose: the "Credentials" section on /hygiene only appears once you add real
 * ones, so the site never claims something that is not true.
 *
 *   { label: "Registered with <regulator>", detail: "Reg. no. …" }
 */
export const HYGIENE_CREDENTIALS: { label: string; detail?: string }[] = [];

/** One line of reassurance for a product, based on what it is. */
export function productHygieneNote(product: { is_frozen: boolean; is_meal_kit: boolean; is_food_pack?: boolean }): string {
  if (product.is_frozen) {
    return "Packed separately in an insulated cooler bag so it reaches you frozen.";
  }
  if (product.is_meal_kit) {
    return "Washed, chopped and portioned in a hygienic kitchen, then packed and labelled.";
  }
  if (product.is_food_pack) {
    return "Packed hygienically and labelled. Everything inside is non-perishable.";
  }
  return "Fresh items are washed and cleaned, then packed hygienically and labelled.";
}
