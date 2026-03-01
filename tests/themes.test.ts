import { describe, it, expect } from "vitest";
import { PRESET_THEMES, getPresetTheme } from "../src/themes/presets";
import { hexToRgb } from "../src/core/colors";

describe("PRESET_THEMES", () => {
  it("has exactly 11 themes", () => {
    expect(Object.keys(PRESET_THEMES)).toHaveLength(11);
  });

  it("contains all expected theme names", () => {
    const expected = [
      "default", "dark", "light", "mono", "flat", "transparent",
      "glass", "glassDark", "pixel", "pixelRetro", "pixelClean",
    ];
    for (const name of expected) {
      expect(PRESET_THEMES).toHaveProperty(name);
    }
  });
});

describe("getPresetTheme", () => {
  it("returns correct theme for each name", () => {
    for (const name of Object.keys(PRESET_THEMES)) {
      const theme = getPresetTheme(name);
      expect(theme).toEqual(PRESET_THEMES[name]);
    }
  });

  it("returns empty object for unknown theme", () => {
    const theme = getPresetTheme("nonexistent");
    expect(theme).toEqual({});
  });

  it("merges overrides into base theme", () => {
    const theme = getPresetTheme("dark", { bgOpacity: 0.5 });
    expect(theme.bgOpacity).toBe(0.5);
    expect(theme.bgColors).toBeDefined();
  });
});

describe("theme properties", () => {
  it("dark theme has 10 bgColors", () => {
    expect(PRESET_THEMES.dark.bgColors).toHaveLength(10);
  });

  it("mono theme has grayscale skin colors", () => {
    const skins = PRESET_THEMES.mono.skinColors!;
    expect(skins).toHaveLength(10);
    for (const hex of skins) {
      const [r, g, b] = hexToRgb(hex);
      // Grayscale means r ≈ g ≈ b (within small tolerance)
      expect(Math.abs(r - g)).toBeLessThanOrEqual(2);
      expect(Math.abs(g - b)).toBeLessThanOrEqual(2);
    }
  });

  it("flat theme has flat: true", () => {
    expect(PRESET_THEMES.flat.flat).toBe(true);
  });

  it("transparent theme has bgOpacity: 0 and flat: true", () => {
    expect(PRESET_THEMES.transparent.bgOpacity).toBe(0);
    expect(PRESET_THEMES.transparent.flat).toBe(true);
  });

  it("glass themes have _glass: true", () => {
    expect(PRESET_THEMES.glass._glass).toBe(true);
    expect(PRESET_THEMES.glassDark._glass).toBe(true);
  });

  it("pixel themes have _pixel: true", () => {
    expect(PRESET_THEMES.pixel._pixel).toBe(true);
    expect(PRESET_THEMES.pixelRetro._pixel).toBe(true);
    expect(PRESET_THEMES.pixelClean._pixel).toBe(true);
  });
});
