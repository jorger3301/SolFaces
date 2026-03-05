import { describe, it, expect } from "vitest";
import {
  generateTraits,
  effectiveAccessory,
  traitHash,
  getTraitLabels,
} from "../src/core/traits";

const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

describe("generateTraits", () => {
  it("is deterministic — same wallet always produces same traits", () => {
    const a = generateTraits(WALLET);
    const b = generateTraits(WALLET);
    expect(a).toEqual(b);
  });

  it("is stable across 1000 calls", () => {
    const baseline = generateTraits(WALLET);
    for (let i = 0; i < 1000; i++) {
      expect(generateTraits(WALLET)).toEqual(baseline);
    }
  });

  it("produces traits within documented ranges", () => {
    const wallets = [
      WALLET,
      "4Nd1m5drB5pESoEGBqJSrELwTaGEHnNFxcSzJUt8qMBr",
      "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
      "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
      "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    ];

    for (const w of wallets) {
      const t = generateTraits(w);
      expect(t.faceShape).toBeGreaterThanOrEqual(0);
      expect(t.faceShape).toBeLessThanOrEqual(3);
      expect(t.skinColor).toBeGreaterThanOrEqual(0);
      expect(t.skinColor).toBeLessThanOrEqual(9);
      expect(t.eyeStyle).toBeGreaterThanOrEqual(0);
      expect(t.eyeStyle).toBeLessThanOrEqual(8);
      expect(t.eyeColor).toBeGreaterThanOrEqual(0);
      expect(t.eyeColor).toBeLessThanOrEqual(7);
      expect(t.eyebrows).toBeGreaterThanOrEqual(0);
      expect(t.eyebrows).toBeLessThanOrEqual(7);
      expect(t.nose).toBeGreaterThanOrEqual(0);
      expect(t.nose).toBeLessThanOrEqual(7);
      expect(t.mouth).toBeGreaterThanOrEqual(0);
      expect(t.mouth).toBeLessThanOrEqual(7);
      expect(t.hairStyle).toBeGreaterThanOrEqual(0);
      expect(t.hairStyle).toBeLessThanOrEqual(9);
      expect(t.hairColor).toBeGreaterThanOrEqual(0);
      expect(t.hairColor).toBeLessThanOrEqual(9);
      expect(t.accessory).toBeGreaterThanOrEqual(0);
      expect(t.accessory).toBeLessThanOrEqual(11);
      expect(t.bgColor).toBeGreaterThanOrEqual(0);
      expect(t.bgColor).toBeLessThanOrEqual(11);
    }
  });

  it("produces diverse outputs for different wallets", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      // Generate pseudo-random wallet-like strings
      const wallet = `wallet${i}${Math.random().toString(36).slice(2)}`;
      seen.add(JSON.stringify(generateTraits(wallet)));
    }
    expect(seen.size).toBeGreaterThanOrEqual(90);
  });

  it("applies overrides without affecting other traits", () => {
    const base = generateTraits(WALLET);
    const overridden = generateTraits(WALLET, { hairStyle: 5 });
    expect(overridden.hairStyle).toBe(5);
    expect(overridden.skinColor).toBe(base.skinColor);
    expect(overridden.eyeStyle).toBe(base.eyeStyle);
    expect(overridden.mouth).toBe(base.mouth);
  });
});

describe("effectiveAccessory", () => {
  it("allows earrings on all hair styles", () => {
    // No styles cover ears, so earrings are always visible
    expect(effectiveAccessory({ ...generateTraits(WALLET), accessory: 4, hairStyle: 5 })).toBe(4);
    expect(effectiveAccessory({ ...generateTraits(WALLET), accessory: 7, hairStyle: 6 })).toBe(7);
    expect(effectiveAccessory({ ...generateTraits(WALLET), accessory: 4, hairStyle: 1 })).toBe(4);
    expect(effectiveAccessory({ ...generateTraits(WALLET), accessory: 7, hairStyle: 3 })).toBe(7);
  });

  it("passes through non-earring accessories on any hair", () => {
    expect(effectiveAccessory({ ...generateTraits(WALLET), accessory: 2, hairStyle: 5 })).toBe(2);
    expect(effectiveAccessory({ ...generateTraits(WALLET), accessory: 6, hairStyle: 6 })).toBe(6);
  });
});

describe("traitHash", () => {
  it("returns an 8-character hex string", () => {
    const hash = traitHash(WALLET);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic", () => {
    expect(traitHash(WALLET)).toBe(traitHash(WALLET));
  });
});

describe("getTraitLabels", () => {
  it("returns human-readable labels for all trait fields", () => {
    const traits = generateTraits(WALLET);
    const labels = getTraitLabels(traits);
    expect(labels).toHaveProperty("faceShape");
    expect(labels).toHaveProperty("skinColor");
    expect(labels).toHaveProperty("eyeStyle");
    expect(labels).toHaveProperty("eyeColor");
    expect(labels).toHaveProperty("eyebrows");
    expect(labels).toHaveProperty("nose");
    expect(labels).toHaveProperty("mouth");
    expect(labels).toHaveProperty("hairStyle");
    expect(labels).toHaveProperty("hairColor");
    expect(labels).toHaveProperty("accessory");
    expect(labels).toHaveProperty("bgColor");

    // All values should be non-empty strings
    for (const val of Object.values(labels)) {
      expect(typeof val).toBe("string");
      expect(val.length).toBeGreaterThan(0);
    }
  });

  it("returns 'Squircle' for faceShape", () => {
    const labels = getTraitLabels(generateTraits(WALLET));
    expect(labels.faceShape).toBe("Squircle");
  });
});
