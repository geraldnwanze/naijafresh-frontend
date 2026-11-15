import { describe, expect, it } from "vitest";

import { HYGIENE_CREDENTIALS, HYGIENE_PILLARS, STORAGE_TIPS, productHygieneNote } from "@/lib/hygiene";

describe("hygiene content", () => {
  it("has pillars and storage tips with real wording", () => {
    expect(HYGIENE_PILLARS.length).toBeGreaterThan(0);
    for (const item of [...HYGIENE_PILLARS, ...STORAGE_TIPS]) {
      expect(item.title.trim()).not.toBe("");
      expect(item.body.trim()).not.toBe("");
    }
  });

  it("ships no credentials until real ones are supplied", () => {
    expect(HYGIENE_CREDENTIALS).toEqual([]);
  });

  it("gives a note for every product kind", () => {
    const base = { is_frozen: false, is_meal_kit: false, is_food_pack: false };
    const notes = [
      productHygieneNote(base),
      productHygieneNote({ ...base, is_frozen: true }),
      productHygieneNote({ ...base, is_meal_kit: true }),
      productHygieneNote({ ...base, is_food_pack: true }),
    ];
    for (const note of notes) expect(note.trim()).not.toBe("");
    expect(notes[1]).not.toBe(notes[0]);
  });
});
