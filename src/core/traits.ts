// ═══════════════════════════════════════════════════
// SOLFACES v2 — Deterministic avatar trait engine
// ═══════════════════════════════════════════════════

// ─── Types ────────────────────────────────────────

/** Deterministic trait indices generated from a wallet address. Each index selects a visual variant. */
export interface SolFaceTraits {
  /** Face shape variant (0–3). Consumed for PRNG ordering; all faces render as squircle. */
  faceShape: number;
  /** Skin tone index (0–9). Maps to: Porcelain, Ivory, Fair, Light, Sand, Golden, Warm, Caramel, Brown, Deep. */
  skinColor: number;
  /** Eye shape variant (0–8). Maps to: Round, Minimal, Almond, Wide, Relaxed, Joyful, Bright, Gentle, Side-look. */
  eyeStyle: number;
  /** Eye iris color index (0–7). Maps to: Chocolate, Sky, Emerald, Hazel, Storm, Amber, Violet, Gray. */
  eyeColor: number;
  /** Eyebrow style (0–7). Maps to: Wispy, Straight, Natural, Arched, Angled, Worried, Bushy, Thin. */
  eyebrows: number;
  /** Nose variant (0–7). Maps to: Shadow, Button, Soft, Nostrils, Pointed, Wide, Bridge, Snub. */
  nose: number;
  /** Mouth expression (0–7). Maps to: Smile, Calm, Happy, Oh, Smirk, Grin, Flat, Pout. */
  mouth: number;
  /** Hair style (0–9). Maps to: Bald, Crew, Curly, Side Part, Long, Buzz, Beanie, Cap, Mohawk, Bun. */
  hairStyle: number;
  /** Hair color index (0–9). Maps to: Black, Espresso, Walnut, Honey, Copper, Silver, Charcoal, Burgundy, Strawberry, Ginger. */
  hairColor: number;
  /** Accessory (0–11). Maps to: None, Beauty Mark, Round Glasses, Rect Glasses, Earring, Headband, Freckles, Stud Earrings, Aviators, Band-Aid, Left Eyebrow Slit, Right Eyebrow Slit. */
  accessory: number;
  /** Background color index (0–11). Maps to: Rose, Olive, Sage, Fern, Mint, Ocean, Sky, Lavender, Orchid, Blush, Lilac, Seafoam. */
  bgColor: number;
}

export interface SolFaceTheme {
  // ── Palette overrides ──────────────────────────

  /** Override the 10 skin tone colors. Default: natural palette from porcelain (#faeae5) to deep brown (#4b2d25). */
  skinColors?: string[];
  /** Override the 8 eye iris colors. Default: chocolate, sky, emerald, hazel, storm, amber, violet, gray. */
  eyeColors?: string[];
  /** Override the 10 hair colors. Default: black through ginger. */
  hairColors?: string[];
  /** Override the 12 background colors. Default: muted earth tones (rose, olive, sage, ..., lilac, seafoam). */
  bgColors?: string[];

  // ── Single-color overrides ─────────────────────

  /** Override mouth/lip color for all faces. Default: derived from skin luminance. */
  mouthColor?: string;
  /** Override eyebrow color for all faces. Default: derived from skin luminance. */
  eyebrowColor?: string;
  /** Override accessory accent color. Default: skin-warm neutral derived from skin. */
  accessoryColor?: string;
  /** Override eye white (sclera) color. Default: adapted to skin luminance (#EDE8E0 → #FBF8F2). */
  eyeWhiteColor?: string;
  /** Override nose shadow/fill color. Default: derived from skin luminance. */
  noseColor?: string;
  /** Override glasses frame color. Default: "#4a4a5a". */
  glassesColor?: string;
  /** Override earring color. Default: skin–gold blend. */
  earringColor?: string;
  /** Override headband color. Default: hair–red blend. */
  headbandColor?: string;
  /** Override ear fill color. Default: derived blend of skin highlight and shadow. */
  earColor?: string;
  /** Override eyelid color. Default: derived from skin luminance. */
  lidColor?: string;
  /** Override freckle dot color. Default: "#a0785a". */
  freckleColor?: string;
  /** Override beauty mark color. Default: "#3a2a2a". */
  beautyMarkColor?: string;

  // ── Layout ─────────────────────────────────────

  /** Background opacity (0 = transparent, 1 = solid). Default: 1. */
  bgOpacity?: number;
  /** Background corner radius in SVG units (viewBox is 64×64). Default: 4. */
  bgRadius?: number;
  /** Optional border around the avatar. */
  border?: { color: string; width: number };

  // ── Rendering options ──────────────────────────

  /** Flat rendering — disables all gradients. Default: false. */
  flat?: boolean;
  /** Show cheek blush overlays (full detail only). Default: true. */
  cheekEnabled?: boolean;
  /** Override cheek blush color. Default: derived warm blush from skin. */
  cheekColor?: string;
  /** Cheek blush opacity (0–1). Default: derived from skin luminance (~0.15–0.33). */
  cheekOpacity?: number;
  /** Face skin opacity (0–1). Default: 1. */
  skinOpacity?: number;
  /** Show chin shadow and glow overlays (full detail only). Default: true. */
  shadowEnabled?: boolean;
  /** Face glow highlight intensity (0–1). Default: 0.10. */
  glowIntensity?: number;

  // ── Feature visibility toggles ─────────────────

  /** Show/hide ears. Default: true. */
  earsEnabled?: boolean;
  /** Show/hide eyebrows. Default: true. */
  eyebrowsEnabled?: boolean;
  /** Show/hide nose. Default: true. */
  noseEnabled?: boolean;
  /** Show/hide accessories (glasses, earrings, headband, etc.). Default: true. */
  accessoriesEnabled?: boolean;
  /** Show/hide hair (front and back). Default: true. */
  hairEnabled?: boolean;

  // ── React-only: pixel art mode ─────────────────

  /** Enable pixel art rendering mode. Default: false. */
  _pixel?: boolean;
  /** Pixel grid resolution (source canvas size). Lower = blockier. Default: 16. */
  _pixelDensity?: number;
  /** Round pixel art corners (12% border-radius). Default: true. */
  _pixelRounded?: boolean;
  /** Show pixel outline border. Default: false. */
  _pixelOutline?: boolean;
  /** Pixel outline color. Default: "#000". */
  _pixelOutlineColor?: string;
  /** Pixel outline width at 64px reference size. Scales proportionally. Default: 1. */
  _pixelOutlineWidth?: number;
  /** CSS contrast filter (1.0 = normal). */
  _pixelContrast?: number;
  /** CSS saturate filter (1.0 = normal). */
  _pixelSaturation?: number;
  /** CSS brightness filter (1.0 = normal). */
  _pixelBrightness?: number;
  /** Show CRT-style scanline overlay. Default: false. */
  _pixelScanlines?: boolean;
  /** Scanline overlay opacity (0–1). Default: 0.08. */
  _pixelScanlineOpacity?: number;
  /** Scanline spacing in px at 64px reference size. Scales proportionally. Default: 2. */
  _pixelScanlineSpacing?: number;
  /** Show pixel grid overlay. Default: false. */
  _pixelGrid?: boolean;
  /** Grid overlay opacity (0–1). Default: 0.06. */
  _pixelGridOpacity?: number;
  /** Grid line color. Default: "#000". */
  _pixelGridColor?: string;
  /** Enable drop shadow on pixel art. Default: false. */
  _pixelShadow?: boolean;
  /** Pixel shadow color. Default: "rgba(0,0,0,0.3)". */
  _pixelShadowColor?: string;
  /** Pixel shadow offset at 64px reference size. Scales proportionally. Default: 2. */
  _pixelShadowOffset?: number;

  // ── React-only: liquid glass mode ──────────────

  /** Enable liquid glass rendering mode. Default: false. */
  _glass?: boolean;
  /** Backdrop blur radius at 64px reference size. Scales proportionally. Default: 12. */
  _blurRadius?: number;
  /** Backdrop saturation multiplier (1.0 = normal). Default: 1.8. */
  _saturate?: number;
  /** Color tint overlay opacity (0–1). Default: 0.12. */
  _tintOpacity?: number;
  /** Color tint overlay color. Default: "rgba(255,255,255,1)". */
  _tintColor?: string;
  /** Glass border opacity (0–1). Default: 0.25. */
  _borderOpacity?: number;
  /** Glass border width at 64px reference size. Scales proportionally. Min 0.5px. Default: 1. */
  _borderWidth?: number;
  /** Glass border color. Default: rgba(255,255,255,{_borderOpacity}). */
  _borderColor?: string;
  /** Specular highlight opacity (0–1). Default: 0.25. */
  _specularOpacity?: number;
  /** Specular highlight color. Default: "rgba(255,255,255,1)". */
  _specularColor?: string;
  /** Specular gradient end position (%). Default: 50. */
  _specularEnd?: number;
  /** Light angle for specular gradient (degrees). Default: 135. */
  _lightAngle?: number;
  /** Inner rim highlight intensity (0–1). Default: 0.08. */
  _rimIntensity?: number;
  /** @deprecated Use _shadowY, _shadowBlur, _shadowOpacity for size-proportional shadows. Raw CSS shadow string — not scaled with size. */
  _shadow?: string;
  /** Shadow Y offset at 64px reference size. Scales proportionally. Default: 8. */
  _shadowY?: number;
  /** Shadow blur radius at 64px reference size. Scales proportionally. Default: 32. */
  _shadowBlur?: number;
  /** Shadow opacity (0–1). Default: 0.12. */
  _shadowOpacity?: number;
}

/** Options for rendering a SolFace avatar (shared by string renderer and React component). */
export interface RenderOptions {
  /** Avatar size in CSS pixels (width and height). Default: 64. */
  size?: number;
  /** Theme configuration for colors, layout, and rendering style. */
  theme?: SolFaceTheme;
  /** Override specific trait indices. Merged on top of the deterministic traits. */
  traitOverrides?: Partial<SolFaceTraits>;
  /** Enable blink animation. Pass `true` for defaults, or an object for custom timing. Default: false. */
  enableBlink?: boolean | {
    /** Interval between blinks in seconds. Default: 4. */
    duration?: number;
    /** Initial delay before first blink in seconds. Default: 0. */
    delay?: number;
  };
  /** CSS class name applied to the root SVG element. */
  className?: string;
  /** Detail level. "full" renders all overlays; "simplified" omits gradients and blush; "auto" uses full at size ≥ 48px. Default: "auto". */
  detail?: "full" | "simplified" | "auto";
  /** Per-instance color overrides (hex strings). Takes precedence over theme color settings and derived colors. */
  colorOverrides?: {
    /** Override skin color (hex). */
    skin?: string;
    /** Override eye iris color (hex). */
    eyes?: string;
    /** Override hair color (hex). */
    hair?: string;
    /** Override background color (hex). */
    bg?: string;
    /** Override mouth/lip color (hex). */
    mouth?: string;
    /** Override eyebrow color (hex). */
    eyebrow?: string;
    /** Override accessory accent color (hex). */
    accessory?: string;
    /** Override nose shadow/fill color (hex). */
    nose?: string;
    /** Override eye white (sclera) color (hex). */
    eyeWhite?: string;
  };
}

// ─── Color Palettes ──────────────────────────────

/** Default 10 skin tone hex colors, from porcelain to deep brown. */
export const SKIN_COLORS = [
  "#faeae5", "#efd6c8", "#e4c5aa", "#d5b590", "#c59e77",
  "#b4875f", "#9d6d4d", "#805742", "#654134", "#4b2d25",
];

/** Default 8 eye iris hex colors: chocolate, sky, emerald, hazel, storm, amber, violet, gray. */
export const EYE_COLORS = [
  "#382414", "#3868A8", "#38784C", "#808838", "#586878",
  "#A06830", "#685898", "#889898",
];

/** Default 10 hair hex colors: black, espresso, walnut, honey, copper, silver, charcoal, burgundy, strawberry, ginger. */
export const HAIR_COLORS = [
  "#1A1A24", "#4C3428", "#887058", "#D4B868", "#A84830",
  "#C0C0CC", "#484858", "#783850", "#D8B0A0", "#C08048",
];

/** Default 12 background hex colors: rose, olive, sage, fern, mint, ocean, sky, lavender, orchid, blush, lilac, seafoam. */
export const BG_COLORS = [
  "#b98387", "#a9a360", "#9eb785", "#69ab79", "#81bbb0",
  "#6499af", "#7f8bbd", "#8869ab", "#b785b3", "#ab6984",
  "#a07ab5", "#74b5a0",
];

// ─── Hashing (djb2) ─────────────────────────────

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// ─── PRNG (mulberry32) ──────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Trait Generation ───────────────────────────

/**
 * Deterministically generate avatar traits from a wallet address using djb2 + mulberry32 PRNG.
 * The same wallet always produces the same traits (~53M visually unique combinations).
 *
 * @param walletAddress  Base58 Solana wallet address.
 * @param overrides      Optional partial traits to force specific values.
 * @returns Complete trait set with all 11 indices (10 visual + faceShape for PRNG ordering).
 */
export function generateTraits(
  walletAddress: string,
  overrides?: Partial<SolFaceTraits>
): SolFaceTraits {
  const seed = djb2(walletAddress);
  const rand = mulberry32(seed);

  // IMPORTANT: Order must NEVER change — shifts all downstream values.
  // faceShape is consumed for PRNG ordering but unused in rendering (all squircle).
  const traits: SolFaceTraits = {
    faceShape:  Math.floor(rand() * 4),
    skinColor:  Math.floor(rand() * 10),
    eyeStyle:   Math.floor(rand() * 9),
    eyeColor:   Math.floor(rand() * 8),
    eyebrows:   Math.floor(rand() * 8),
    nose:       Math.floor(rand() * 8),
    mouth:      Math.floor(rand() * 8),
    hairStyle:  Math.floor(rand() * 10),
    hairColor:  Math.floor(rand() * 10),
    accessory:  Math.floor(rand() * 12),
    bgColor:    Math.floor(rand() * 12),
  };

  return overrides ? { ...traits, ...overrides } : traits;
}

// ─── Effective Accessory ────────────────────────

/**
 * Resolve the effective accessory index.
 *
 * @param traits  Complete trait set.
 * @returns Effective accessory index (0–11).
 */
export function effectiveAccessory(traits: SolFaceTraits): number {
  const ai = traits.accessory % 12;
  return ai;
}

// ─── Trait Labels ───────────────────────────────

const FACE_LABELS = ["Squircle"];
const SKIN_LABELS = [
  "Porcelain", "Ivory", "Fair", "Light", "Sand",
  "Golden", "Warm", "Caramel", "Brown", "Deep",
];
const EYE_STYLE_LABELS = ["Round", "Minimal", "Almond", "Wide", "Relaxed", "Joyful", "Bright", "Gentle", "Side-look"];
const EYE_COLOR_LABELS = ["Chocolate", "Sky", "Emerald", "Hazel", "Storm", "Amber", "Violet", "Gray"];
const BROW_LABELS = ["Wispy", "Straight", "Natural", "Arched", "Angled", "Worried", "Bushy", "Thin"];
const NOSE_LABELS = ["Shadow", "Button", "Soft", "Nostrils", "Pointed", "Wide", "Bridge", "Snub"];
const MOUTH_LABELS = ["Smile", "Calm", "Happy", "Oh", "Smirk", "Grin", "Flat", "Pout"];
const HAIR_STYLE_LABELS = [
  "Bald", "Crew", "Curly", "Side Part", "Long",
  "Buzz", "Beanie", "Cap", "Mohawk", "Bun",
];
const HAIR_COLOR_LABELS = [
  "Black", "Espresso", "Walnut", "Honey", "Copper",
  "Silver", "Charcoal", "Burgundy", "Strawberry", "Ginger",
];
const ACCESSORY_LABELS = [
  "None", "Beauty Mark", "Round Glasses", "Rect Glasses", "Earring",
  "Headband", "Freckles", "Stud Earrings", "Aviators", "Band-Aid",
  "Left Eyebrow Slit", "Right Eyebrow Slit",
];
const BG_COLOR_LABELS = [
  "Rose", "Olive", "Sage", "Fern", "Mint",
  "Ocean", "Sky", "Lavender", "Orchid", "Blush",
  "Lilac", "Seafoam",
];

/**
 * Convert numeric trait indices to human-readable label strings.
 *
 * @param traits  Complete trait set.
 * @returns A record mapping each trait name to its display label (e.g. `{ skinColor: "Golden", hairStyle: "Curly" }`).
 */
export function getTraitLabels(traits: SolFaceTraits): Record<string, string> {
  return {
    faceShape: FACE_LABELS[0],
    skinColor: SKIN_LABELS[traits.skinColor] ?? "Fair",
    eyeStyle: EYE_STYLE_LABELS[traits.eyeStyle] ?? "Round",
    eyeColor: EYE_COLOR_LABELS[traits.eyeColor] ?? "Chocolate",
    eyebrows: BROW_LABELS[traits.eyebrows] ?? "Wispy",
    nose: NOSE_LABELS[traits.nose] ?? "Shadow",
    mouth: MOUTH_LABELS[traits.mouth] ?? "Smile",
    hairStyle: HAIR_STYLE_LABELS[traits.hairStyle] ?? "Bald",
    hairColor: HAIR_COLOR_LABELS[traits.hairColor] ?? "Black",
    accessory: ACCESSORY_LABELS[effectiveAccessory(traits)] ?? "None",
    bgColor: BG_COLOR_LABELS[traits.bgColor] ?? "Rose",
  };
}

// ─── Trait Hash ─────────────────────────────────

/**
 * Compute a short hex hash (8 characters) from a wallet address. Useful as a compact identity fingerprint.
 *
 * @param walletAddress  Base58 Solana wallet address.
 * @returns 8-character lowercase hex string.
 */
export function traitHash(walletAddress: string): string {
  return (djb2(walletAddress) >>> 0).toString(16).padStart(8, "0");
}

// ─── Theme Utilities ────────────────────────────

/**
 * Look up a theme by name from a theme registry.
 *
 * @param themeName  Theme name to look up.
 * @param themes     Registry of available themes.
 * @returns The matching theme, or `undefined` if not found.
 */
export function resolveTheme(
  themeName?: string,
  themes?: Record<string, SolFaceTheme>
): SolFaceTheme | undefined {
  if (!themeName || !themes) return undefined;
  return themes[themeName];
}

/**
 * Shallow-merge two themes. Overrides take precedence over the base.
 *
 * @param base       Base theme (or null/undefined).
 * @param overrides  Theme overrides (or null/undefined).
 * @returns Merged theme, or null if both inputs are nullish.
 */
export function mergeTheme(
  base: SolFaceTheme | null | undefined,
  overrides: SolFaceTheme | null | undefined
): SolFaceTheme | null {
  if (!base) return overrides || null;
  if (!overrides) return base;
  return { ...base, ...overrides };
}
