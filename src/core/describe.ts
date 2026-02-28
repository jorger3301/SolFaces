// ═══════════════════════════════════════════════════════════════
// SOLFACES — AI Agent Description Generator
// Produces natural language descriptions of a wallet's SolFace
// for use in system prompts, bios, and self-reference.
// ═══════════════════════════════════════════════════════════════

import { generateTraits, type SolFaceTraits, type SolFaceTheme } from "./traits";

// ─── Vocabulary Maps ─────────────────────────────────────────

const FACE_SHAPES: Record<number, string> = {
  0: "round",
  1: "square with softly rounded corners",
  2: "oval",
  3: "angular, hexagonal",
};

const SKIN_TONES: Record<number, string> = {
  0: "light peach",
  1: "warm tan",
  2: "golden brown",
  3: "medium brown",
  4: "deep brown",
  5: "rich dark brown",
};

const EYE_STYLES: Record<number, string> = {
  0: "round, wide-open",
  1: "small and dot-like",
  2: "almond-shaped",
  3: "wide and expressive",
  4: "sleepy, half-lidded",
  5: "playfully winking",
  6: "adorned with lashes",
  7: "narrow and observant",
};

const EYE_COLORS_DESC: Record<number, string> = {
  0: "dark brown",
  1: "blue",
  2: "green",
  3: "amber",
  4: "gray",
};

const EYEBROW_STYLES: Record<number, string> = {
  0: "", // none — omitted from description
  1: "thin",
  2: "thick, prominent",
  3: "elegantly arched",
  4: "sharply angled",
};

const NOSE_STYLES: Record<number, string> = {
  0: "", // none
  1: "a small dot nose",
  2: "a triangular nose",
  3: "a button nose with visible nostrils",
};

const MOUTH_STYLES: Record<number, string> = {
  0: "a gentle smile",
  1: "a neutral, straight expression",
  2: "a wide grin",
  3: "a small, open mouth",
  4: "a confident smirk",
  5: "a broad, toothy smile",
};

const HAIR_STYLES: Record<number, string> = {
  0: "bald, with no hair",
  1: "short, neatly cropped hair",
  2: "tall, spiky hair",
  3: "side-swept hair",
  4: "a bold mohawk",
  5: "long hair that falls past the shoulders",
  6: "a clean bob cut",
  7: "a close buzz cut",
};

const HAIR_COLORS_DESC: Record<number, string> = {
  0: "jet black",
  1: "brown",
  2: "blonde",
  3: "ginger red",
  4: "neon lime green",
  5: "neon blue",
  6: "Solana mint green",
  7: "neon magenta",
};

const ACCESSORY_DESC: Record<number, string> = {
  0: "",
  1: "",
  2: "round glasses",
  3: "square-framed glasses",
  4: "a gold earring",
  5: "a red bandana",
};

const BG_COLORS_DESC: Record<number, string> = {
  0: "lime green",
  1: "blue",
  2: "Solana mint green",
  3: "warm sand",
  4: "red",
};

// ─── Description Builder ─────────────────────────────────────

export interface DescribeOptions {
  /** Include background color in description. Default: true */
  includeBackground?: boolean;
  /** Output format. Default: "paragraph" */
  format?: "paragraph" | "structured" | "compact";
  /** Perspective: how the description is framed. Default: "third" */
  perspective?: "first" | "third";
  /** Optional name to use instead of "This SolFace" / "I". */
  name?: string;
}

/**
 * Generate a natural language description of a SolFace avatar.
 *
 * Designed for AI agent system prompts, profile bios, alt text,
 * and anywhere a wallet's visual identity needs to be described in words.
 *
 * @example
 * ```ts
 * // For an AI agent's system prompt
 * const desc = describeAppearance("7xKXq...", {
 *   perspective: "first",
 *   name: "Atlas",
 * });
 * // → "I'm Atlas. I have a round face with light peach skin, wide
 * //    and expressive blue eyes with elegantly arched eyebrows, and
 * //    tall, spiky Solana mint green hair. I'm wearing round glasses
 * //    and have a confident smirk."
 *
 * // For alt text
 * const alt = describeAppearance("7xKXq...", { format: "compact" });
 * // → "Round face, light peach skin, blue wide eyes, spiky mint hair, round glasses, smirking"
 * ```
 */
export function describeAppearance(
  walletAddress: string,
  options?: DescribeOptions
): string {
  const traits = generateTraits(walletAddress);
  const {
    includeBackground = true,
    format = "paragraph",
    perspective = "third",
    name,
  } = options ?? {};

  if (format === "structured") {
    return buildStructured(traits, includeBackground);
  }
  if (format === "compact") {
    return buildCompact(traits);
  }
  return buildParagraph(traits, perspective, name, includeBackground);
}

/**
 * Generate description from pre-computed traits (for when you already have them).
 */
export function describeTraits(
  traits: SolFaceTraits,
  options?: DescribeOptions
): string {
  const {
    includeBackground = true,
    format = "paragraph",
    perspective = "third",
    name,
  } = options ?? {};

  if (format === "structured") return buildStructured(traits, includeBackground);
  if (format === "compact") return buildCompact(traits);
  return buildParagraph(traits, perspective, name, includeBackground);
}

// ─── Builders ────────────────────────────────────────────────

function buildParagraph(
  t: SolFaceTraits,
  perspective: "first" | "third",
  name?: string,
  includeBg?: boolean
): string {
  const parts: string[] = [];

  // Subject intro
  const subject = perspective === "first"
    ? (name ? `I'm ${name}. I have` : "I have")
    : (name ? `${name} has` : "This SolFace has");

  const have = perspective === "first" ? "have" : "has";
  const my = perspective === "first" ? "my" : "their";
  const im = perspective === "first" ? "I'm" : "They're";

  // Face + skin
  parts.push(`${subject} a ${FACE_SHAPES[t.faceShape] ?? "round"} face with ${SKIN_TONES[t.skinColor] ?? "warm"} skin`);

  // Eyes
  const eyeStyle = EYE_STYLES[t.eyeStyle] ?? "round";
  const eyeColor = EYE_COLORS_DESC[t.eyeColor] ?? "dark";
  parts.push(`${eyeStyle} ${eyeColor} eyes`);

  // Eyebrows (if present)
  const brows = EYEBROW_STYLES[t.eyebrows];
  if (brows) {
    parts.push(`${brows} eyebrows`);
  }

  // Hair
  const hairStyle = HAIR_STYLES[t.hairStyle] ?? "";
  const hairColor = HAIR_COLORS_DESC[t.hairColor] ?? "";
  if (t.hairStyle === 0) {
    parts.push("and is bald");
  } else if (hairStyle.startsWith("a ")) {
    parts.push(`and a ${hairColor} ${hairStyle.slice(2)}`);
  } else {
    parts.push(`and ${hairColor} ${hairStyle}`);
  }

  // Build the main sentence
  let desc = parts[0];
  if (parts.length > 2) {
    // "face with skin, eyes, eyebrows, and hair"
    desc += ", " + parts.slice(1, -1).join(", ") + ", " + parts[parts.length - 1];
  } else if (parts.length === 2) {
    desc += " and " + parts[1];
  }
  desc += ".";

  // Nose
  const nose = NOSE_STYLES[t.nose];
  if (nose) {
    const noseSubject = perspective === "first" ? "I have" : (name ?? "They") + (name ? " has" : " have");
    desc += ` ${noseSubject} ${nose}.`;
  }

  // Accessory
  const acc = ACCESSORY_DESC[t.accessory];
  if (acc) {
    desc += ` ${im} wearing ${acc}.`;
  }

  // Mouth
  const mouth = MOUTH_STYLES[t.mouth] ?? "a smile";
  const mouthVerb = perspective === "first" ? "I have" : (name ?? "They") + (name ? " has" : " have");
  desc += ` ${mouthVerb} ${mouth}.`;

  // Background
  if (includeBg) {
    const bg = BG_COLORS_DESC[t.bgColor] ?? "colorful";
    desc += ` The background is ${bg}.`;
  }

  return desc;
}

function buildStructured(t: SolFaceTraits, includeBg: boolean): string {
  const lines: string[] = [
    `Face: ${FACE_SHAPES[t.faceShape] ?? "round"}`,
    `Skin: ${SKIN_TONES[t.skinColor] ?? "warm"}`,
    `Eyes: ${EYE_STYLES[t.eyeStyle] ?? "round"}, ${EYE_COLORS_DESC[t.eyeColor] ?? "dark"}`,
  ];

  const brows = EYEBROW_STYLES[t.eyebrows];
  if (brows) lines.push(`Eyebrows: ${brows}`);

  const nose = NOSE_STYLES[t.nose];
  if (nose) lines.push(`Nose: ${nose.replace(/^a /, "")}`);

  lines.push(`Mouth: ${MOUTH_STYLES[t.mouth] ?? "smile"}`);

  if (t.hairStyle === 0) {
    lines.push("Hair: bald");
  } else {
    const hs = HAIR_STYLES[t.hairStyle] ?? "";
    const hc = HAIR_COLORS_DESC[t.hairColor] ?? "";
    lines.push(`Hair: ${hc} ${hs.startsWith("a ") ? hs.slice(2) : hs}`);
  }

  const acc = ACCESSORY_DESC[t.accessory];
  if (acc) lines.push(`Accessory: ${acc}`);

  if (includeBg) {
    lines.push(`Background: ${BG_COLORS_DESC[t.bgColor] ?? "colorful"}`);
  }

  return lines.join("\n");
}

function buildCompact(t: SolFaceTraits): string {
  const parts: string[] = [];

  parts.push(`${FACE_SHAPES[t.faceShape] ?? "round"} face`);
  parts.push(`${SKIN_TONES[t.skinColor] ?? "warm"} skin`);
  parts.push(`${EYE_COLORS_DESC[t.eyeColor] ?? "dark"} ${EYE_STYLES[t.eyeStyle] ?? "round"} eyes`);

  if (t.hairStyle === 0) {
    parts.push("bald");
  } else {
    const hs = (HAIR_STYLES[t.hairStyle] ?? "hair").replace(/,.*/, "");
    const hc = HAIR_COLORS_DESC[t.hairColor] ?? "";
    parts.push(`${hc} ${hs.startsWith("a ") ? hs.slice(2) : hs}`);
  }

  const acc = ACCESSORY_DESC[t.accessory];
  if (acc) parts.push(acc);

  parts.push((MOUTH_STYLES[t.mouth] ?? "smiling").replace(/^a /, ""));

  return parts.join(", ");
}

// ─── Alt Text Helper ─────────────────────────────────────────

/**
 * Generate accessible alt text for a SolFace avatar.
 * Shorter than full description, optimized for screen readers.
 */
export function solFaceAltText(walletAddress: string): string {
  return `SolFace avatar: ${describeAppearance(walletAddress, { format: "compact", includeBackground: false })}`;
}

// ─── System Prompt Helper ────────────────────────────────────

/**
 * Generate a system prompt snippet for an AI agent describing its appearance.
 *
 * @example
 * ```ts
 * const appearance = agentAppearancePrompt("7xKXq...", "Atlas");
 * // Use in system prompt:
 * // `You are Atlas, an AI agent. ${appearance}`
 * ```
 */
export function agentAppearancePrompt(
  walletAddress: string,
  agentName?: string
): string {
  const desc = describeAppearance(walletAddress, {
    perspective: "first",
    name: agentName,
    includeBackground: false,
    format: "paragraph",
  });

  const hash = (djb2Simple(walletAddress) >>> 0).toString(16).padStart(8, "0");

  return `My visual identity is a SolFace avatar (ID: ${hash}) derived from my wallet address. ${desc} This appearance is deterministic — anyone who looks up my wallet will see the same face.`;
}

// Inline djb2 to avoid circular dependency
function djb2Simple(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}
