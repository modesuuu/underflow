import { describe, expect, it } from "vitest";
import { en, id } from "@/lib/i18n/dictionary";

// The UI ships in English and Bahasa Indonesia. The type
// system already forces the Indonesian record to carry
// every English key; these tests guard the runtime side:
// no missing or extra keys after refactors, and no empty
// strings rendering as blank labels.
describe("dictionary parity (EN/ID)", () => {
  it("both languages expose exactly the same keys", () => {
    expect(Object.keys(id).sort()).toEqual(Object.keys(en).sort());
  });

  it("no value is empty in either language", () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value, `en:${key}`).not.toBe("");
    }
    for (const [key, value] of Object.entries(id)) {
      expect(value, `id:${key}`).not.toBe("");
    }
  });
});
