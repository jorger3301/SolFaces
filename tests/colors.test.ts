import { describe, it, expect } from "vitest";
import {
  hexToRgb,
  rgbToHex,
  darken,
  lighten,
  blend,
  luminance,
  deriveSkinColors,
  buzzOpacity,
} from "../src/core/colors";

describe("hexToRgb", () => {
  it("converts hex to RGB tuple", () => {
    expect(hexToRgb("#ff8040")).toEqual([255, 128, 64]);
  });

  it("handles hex without hash", () => {
    expect(hexToRgb("ff8040")).toEqual([255, 128, 64]);
  });

  it("converts black and white", () => {
    expect(hexToRgb("#000000")).toEqual([0, 0, 0]);
    expect(hexToRgb("#ffffff")).toEqual([255, 255, 255]);
  });
});

describe("rgbToHex", () => {
  it("converts RGB to hex", () => {
    expect(rgbToHex(255, 128, 64)).toBe("#ff8040");
  });

  it("clamps values to 0-255", () => {
    expect(rgbToHex(-10, 300, 128)).toBe("#00ff80");
  });

  it("rounds fractional values", () => {
    expect(rgbToHex(127.6, 0, 0)).toBe("#800000");
  });
});

describe("darken", () => {
  it("produces a darker color", () => {
    const original = "#ff8040";
    const darkened = darken(original, 0.2);
    expect(luminance(darkened)).toBeLessThan(luminance(original));
  });

  it("black stays black", () => {
    expect(darken("#000000", 0.5)).toBe("#000000");
  });
});

describe("lighten", () => {
  it("produces a lighter color", () => {
    const original = "#804020";
    const lightened = lighten(original, 0.3);
    expect(luminance(lightened)).toBeGreaterThan(luminance(original));
  });

  it("white stays white", () => {
    expect(lighten("#ffffff", 0.5)).toBe("#ffffff");
  });
});

describe("blend", () => {
  it("midpoint of black and white is gray", () => {
    const mid = blend("#000000", "#ffffff", 0.5);
    const [r, g, b] = hexToRgb(mid);
    // Should be close to 128 (within rounding)
    expect(r).toBeGreaterThanOrEqual(127);
    expect(r).toBeLessThanOrEqual(128);
    expect(g).toBeGreaterThanOrEqual(127);
    expect(g).toBeLessThanOrEqual(128);
    expect(b).toBeGreaterThanOrEqual(127);
    expect(b).toBeLessThanOrEqual(128);
  });

  it("t=0 returns first color", () => {
    expect(blend("#ff0000", "#0000ff", 0)).toBe("#ff0000");
  });

  it("t=1 returns second color", () => {
    expect(blend("#ff0000", "#0000ff", 1)).toBe("#0000ff");
  });
});

describe("luminance", () => {
  it("white = 255", () => {
    expect(luminance("#ffffff")).toBe(255);
  });

  it("black = 0", () => {
    expect(luminance("#000000")).toBe(0);
  });
});

describe("deriveSkinColors", () => {
  it("returns all 14 DerivedColors fields", () => {
    const derived = deriveSkinColors("#d5b590");
    const expectedKeys = [
      "skinHi", "skinLo", "skinMid", "isDark",
      "cheekColor", "cheekOpacity",
      "lipColor", "noseFill", "browColor",
      "earFill", "earShadow",
      "eyeWhiteAdapted", "lidColor",
      "accessoryColor",
    ];
    for (const key of expectedKeys) {
      expect(derived).toHaveProperty(key);
    }
  });

  it("all color fields are valid hex strings", () => {
    const derived = deriveSkinColors("#b4875f");
    const colorKeys = [
      "skinHi", "skinLo", "skinMid",
      "cheekColor", "lipColor", "noseFill", "browColor",
      "earFill", "earShadow", "eyeWhiteAdapted", "lidColor",
      "accessoryColor",
    ] as const;
    for (const key of colorKeys) {
      expect(derived[key]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("works for very light skin", () => {
    const derived = deriveSkinColors("#faeae5");
    expect(derived.isDark).toBe(false);
  });

  it("works for very dark skin", () => {
    const derived = deriveSkinColors("#4b2d25");
    expect(derived.isDark).toBe(true);
  });
});

describe("buzzOpacity", () => {
  it("returns higher opacity when hair and skin are similar", () => {
    const similar = buzzOpacity("#804020", "#7a3d1e");
    const different = buzzOpacity("#1a1a24", "#faeae5");
    expect(similar).toBeGreaterThan(different);
  });

  it("returns value between 0 and 1", () => {
    const val = buzzOpacity("#804020", "#c59e77");
    expect(val).toBeGreaterThan(0);
    expect(val).toBeLessThanOrEqual(1);
  });
});
