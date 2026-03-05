// ═══════════════════════════════════════════════════════════════
// SOLFACES v2 — Preset Themes
// ═══════════════════════════════════════════════════════════════

import type { SolFaceTheme } from "../core/traits";

// ─── Default (base look — gradients, no overrides) ─

export const defaultTheme: SolFaceTheme = {};

// ─── Base Themes ────────────────────────────────

export const darkTheme: SolFaceTheme = {
  bgColors: ["#1a1b23", "#1e1428", "#0a1e38", "#1b2838", "#201028",
             "#141a28", "#18122a", "#1a2020", "#221822", "#1e1020",
             "#1c1228", "#0e201a"],
  eyeWhiteColor: "#d8d0c8",
  bgOpacity: 1,
  bgRadius: 4,
  border: { color: "#333340", width: 0.5 },
};

export const lightTheme: SolFaceTheme = {
  bgColors: ["#f5e8ea", "#f0f0d8", "#e4f0e6", "#d8f0e8", "#e0ece8",
             "#dce8f0", "#e0e4f0", "#e0d8f0", "#f0e0ee", "#f0d8e4",
             "#e8d8f0", "#d8f0e8"],
  bgOpacity: 1,
  bgRadius: 8,
};

export const monoTheme: SolFaceTheme = {
  skinColors: ["#e8e8e8", "#d4d4d4", "#c0c0c0", "#a8a8a8", "#909090",
               "#787878", "#606060", "#505050", "#404040", "#303030"],
  eyeColors: ["#333", "#555", "#777", "#999", "#bbb"],
  hairColors: ["#1a1a1a", "#2a2a2a", "#404040", "#555", "#707070",
               "#888", "#a0a0a0", "#b8b8b8", "#d0d0d0", "#e0e0e0"],
  bgColors: ["#e8e0e0", "#e0e0d0", "#d8e0d8", "#d0e0d8", "#d8e0e0",
             "#d0d8e0", "#d4d4e0", "#d4d0e0", "#e0d8e0", "#e0d0d8",
             "#d8d0e0", "#d0e0d8"],
  mouthColor: "#666",
  eyebrowColor: "#555",
  accessoryColor: "#777",
  eyeWhiteColor: "#f0f0f0",
  bgOpacity: 0.5,
  bgRadius: 4,
};

export const flatTheme: SolFaceTheme = {
  flat: true,
};

export const transparentTheme: SolFaceTheme = {
  flat: true,
  bgOpacity: 0,
};

// ─── React-Only: Liquid Glass ───────────────────

export const glassTheme: SolFaceTheme = {
  bgOpacity: 0.15,
  bgRadius: 16,
  _glass: true,
  _blurRadius: 12,
  _saturate: 1.8,
  _tintOpacity: 0.12,
  _tintColor: "rgba(255,255,255,1)",
  _borderOpacity: 0.25,
  _borderWidth: 1,
  _borderColor: "rgba(255,255,255,0.25)",
  _specularOpacity: 0.25,
  _specularColor: "rgba(255,255,255,1)",
  _specularEnd: 50,
  _lightAngle: 135,
  _rimIntensity: 0.08,
  _shadowY: 8,
  _shadowBlur: 32,
  _shadowOpacity: 0.12,
};

export const glassDarkTheme: SolFaceTheme = {
  bgOpacity: 0.2,
  bgRadius: 16,
  _glass: true,
  _blurRadius: 16,
  _saturate: 2.0,
  _tintOpacity: 0.08,
  _tintColor: "rgba(0,0,0,1)",
  _borderOpacity: 0.15,
  _borderWidth: 1,
  _borderColor: "rgba(255,255,255,0.15)",
  _specularOpacity: 0.15,
  _specularColor: "rgba(255,255,255,1)",
  _specularEnd: 40,
  _lightAngle: 135,
  _rimIntensity: 0.05,
  _shadowY: 8,
  _shadowBlur: 32,
  _shadowOpacity: 0.25,
};

// ─── React-Only: Pixel Art ──────────────────────

export const pixelTheme: SolFaceTheme = {
  flat: true,
  _pixel: true,
  _pixelDensity: 16,
  _pixelRounded: true,
  _pixelOutline: true,
  _pixelOutlineColor: "#222",
  _pixelOutlineWidth: 2,
};

export const pixelRetroTheme: SolFaceTheme = {
  flat: true,
  _pixel: true,
  _pixelDensity: 12,
  _pixelRounded: false,
  _pixelOutline: true,
  _pixelOutlineColor: "#000",
  _pixelOutlineWidth: 2,
  _pixelScanlines: true,
  _pixelScanlineOpacity: 0.1,
  _pixelScanlineSpacing: 2,
  _pixelShadow: true,
  _pixelShadowColor: "rgba(0,0,0,0.4)",
  _pixelShadowOffset: 3,
};

export const pixelCleanTheme: SolFaceTheme = {
  flat: true,
  _pixel: true,
  _pixelDensity: 24,
  _pixelRounded: true,
  _pixelOutline: false,
};

// ─── Theme Map ──────────────────────────────────

/** Names of all built-in preset themes. */
export type PresetThemeName = "default" | "dark" | "light" | "mono" | "flat" | "transparent" | "glass" | "glassDark" | "pixel" | "pixelRetro" | "pixelClean";

/** Map of all built-in preset themes, keyed by name. */
export const PRESET_THEMES: Record<PresetThemeName, SolFaceTheme> = {
  default: defaultTheme,
  dark: darkTheme,
  light: lightTheme,
  mono: monoTheme,
  flat: flatTheme,
  transparent: transparentTheme,
  glass: glassTheme,
  glassDark: glassDarkTheme,
  pixel: pixelTheme,
  pixelRetro: pixelRetroTheme,
  pixelClean: pixelCleanTheme,
};

/**
 * Look up a built-in preset theme by name, optionally merging overrides.
 *
 * @param name      Preset theme name (e.g. "glass", "dark", "pixelRetro").
 * @param overrides Optional partial theme to merge on top of the preset.
 * @returns The resolved theme object.
 */
export function getPresetTheme(
  name: PresetThemeName,
  overrides?: Partial<SolFaceTheme>,
): SolFaceTheme {
  const base = PRESET_THEMES[name];
  if (!base) return (overrides as SolFaceTheme) ?? {};
  return overrides ? { ...base, ...overrides } : base;
}

/**
 * Build a custom theme by starting from a preset mode and merging your overrides.
 * All SolFaceTheme properties are available for IntelliSense-driven customization.
 *
 * @param options  Theme options. Use `mode` to start from a preset base, then override any property.
 * @returns A fully resolved SolFaceTheme object.
 *
 * @example
 * ```ts
 * const myTheme = createTheme({ mode: "dark", bgRadius: 12, flat: true });
 * ```
 */
export function createTheme(
  options: Partial<SolFaceTheme> & {
    /** Start from a preset mode. Default: none (default gradient theme). */
    mode?: "light" | "dark" | "transparent" | "mono" | "flat";
  } = {},
): SolFaceTheme {
  const { mode, ...rest } = options;
  let base: SolFaceTheme = {};

  if (mode === "dark") base = { ...darkTheme };
  else if (mode === "light") base = { ...lightTheme };
  else if (mode === "transparent") base = { ...transparentTheme };
  else if (mode === "mono") base = { ...monoTheme };
  else if (mode === "flat") base = { ...flatTheme };

  return { ...base, ...rest };
}
