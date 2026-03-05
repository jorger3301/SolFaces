// ═══════════════════════════════════════════════════════════════
// Color math utilities for SolFaces v2
// Shared by renderer.ts (string) and SolFace.tsx (React)
// ═══════════════════════════════════════════════════════════════

/** Parse a hex color string (with or without `#`) into an [R, G, B] tuple (0–255). */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Convert R, G, B values (0–255) to a lowercase hex color string (e.g. `"#ff8040"`). Values are clamped to 0–255. */
export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.max(0, Math.min(255, Math.round(v)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

/** Darken a hex color by a percentage (0–1). Default: 12%. */
export function darken(hex: string, pct = 0.12): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * (1 - pct), g * (1 - pct), b * (1 - pct));
}

/** Lighten a hex color by a percentage (0–1). Default: 15%. */
export function lighten(hex: string, pct = 0.15): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (255 - r) * pct, g + (255 - g) * pct, b + (255 - b) * pct);
}

/** Linearly blend two hex colors. `t=0` returns `a`, `t=1` returns `b`. Default: 50%. */
export function blend(a: string, b: string, t = 0.5): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t
  );
}

/** Compute perceptual luminance (0–255) using ITU-R BT.601 weights. Used internally for skin-relative color derivation. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** WCAG 2.0 relative luminance for contrast ratio computation. */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Compute WCAG 2.0 contrast ratio between two hex colors (1–21). */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface DerivedColors {
  skinHi: string;
  skinLo: string;
  skinMid: string;
  isDark: boolean;
  cheekColor: string;
  cheekOpacity: number;
  lipColor: string;
  noseFill: string;
  browColor: string;
  earFill: string;
  earShadow: string;
  eyeWhiteAdapted: string;
  lidColor: string;
  accessoryColor: string;
}

/**
 * Derive all secondary face colors (lips, cheeks, brows, ears, etc.) from a skin hex color.
 * Uses luminance-adaptive formulas to ensure natural appearance across all skin tones.
 *
 * @param skin  Base skin hex color.
 * @returns Object with all derived colors and metadata (isDark, cheekOpacity, etc.).
 */
export function deriveSkinColors(skin: string): DerivedColors {
  const sL = luminance(skin);
  const isDark = sL < 100;

  const skinHi = lighten(skin, 0.10);
  const skinLo = darken(skin, 0.22);
  const skinMid = darken(skin, 0.05);

  // Cheek: warm blush relative to skin
  const [sr, sg, sb] = hexToRgb(skin);
  let cheekColor: string;
  if (sL > 120) {
    const rB = sL > 180 ? 0.03 : 0.06;
    const gD = sL > 180 ? 0.30 : 0.28;
    const bD = sL > 180 ? 0.25 : 0.22;
    cheekColor = rgbToHex(
      Math.min(255, sr + sr * rB),
      Math.max(0, sg - sg * gD),
      Math.max(0, sb - sb * bD)
    );
  } else {
    cheekColor = rgbToHex(
      Math.min(255, sr + 50),
      Math.max(0, sg - 10),
      Math.max(0, sb - 5)
    );
  }
  const cheekOpacity = 0.15 + 0.18 * (1 - Math.min(1, sL / 240));

  // Lips: smooth skin-relative gradient
  const lipT = Math.max(0, Math.min(1, (sL - 60) / 180));
  const lipBase = blend("#D89090", "#A83848", lipT);
  const midBoost = 1 - Math.abs(sL - 140) / 80;
  const lipBlend = (isDark ? 0.70 : 0.62) + Math.max(0, midBoost) * 0.12;
  const lipRaw = blend(skin, lipBase, Math.min(0.82, lipBlend));
  const [lr, lg, lb] = hexToRgb(lipRaw);
  const lipD = Math.abs(sr - lr) + Math.abs(sg - lg) + Math.abs(sb - lb);
  let lipColor = lipD < 60 ? blend(skin, lipBase, 0.78) : lipRaw;
  // Ensure minimum lip/skin contrast for readability
  let attempts = 0;
  while (contrastRatio(lipColor, skin) < 1.8 && attempts < 12) {
    lipColor = darken(lipColor, 0.06);
    attempts++;
  }

  // Features
  const browColor = isDark
    ? lighten(skin, sL < 80 ? 0.35 : sL < 100 ? 0.32 : 0.25)
    : darken(skin, 0.55);
  const noseShift = 0.20 + 0.06 * (1 - Math.abs(sL - 100) / 140);
  const noseFill = isDark ? lighten(skin, noseShift) : darken(skin, noseShift);
  const earT = Math.max(0, Math.min(1, (sL - 100) / 60));
  let earFill = blend(lighten(skin, 0.08), skinMid, earT);
  // Ensure ears are at least slightly visible
  if (contrastRatio(earFill, skin) < 1.05) {
    earFill = isDark ? lighten(earFill, 0.06) : darken(earFill, 0.06);
  }
  const earShadow = darken(skin, 0.10 + 0.06 * (1 - Math.min(1, sL / 160)));
  const lidColor = isDark ? lighten(skin, 0.18) : darken(skin, 0.15);

  // Eye white: adapted to skin luminance
  const ewT = Math.max(0, Math.min(1, (sL - 60) / 180));
  const eyeWhiteAdapted = blend("#EDE8E0", "#FBF8F2", ewT);

  // Accessory color: skin-warm neutral
  const warmth = sL > 140 ? 0.3 : sL > 100 ? 0.5 : 0.7;
  const accessoryColor = blend("#808890", blend(skin, "#B0A898", 0.3), warmth);

  return {
    skinHi, skinLo, skinMid, isDark,
    cheekColor, cheekOpacity,
    lipColor, noseFill, browColor,
    earFill, earShadow,
    eyeWhiteAdapted, lidColor,
    accessoryColor,
  };
}
