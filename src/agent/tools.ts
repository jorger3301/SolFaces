// ═══════════════════════════════════════════════════════════════
// SOLFACES v2 — AI Agent Tool Definitions
// Canonical, framework-agnostic tool schemas with handlers.
// ═══════════════════════════════════════════════════════════════

import { renderSolFaceSVG } from "../core/renderer";
import { describeAppearance, agentAppearancePrompt } from "../core/describe";
import {
  generateTraits,
  getTraitLabels,
  traitHash,
} from "../core/traits";
import { deriveName, deriveIdentity } from "../names";
import type { NameFormat } from "../names";
import { PRESET_THEMES, getPresetTheme } from "../themes/presets";
import type { SolFaceTheme } from "../core/traits";

// ─── Types ───────────────────────────────────────

export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema & { description?: string; enum?: string[] }>;
  required?: string[];
  items?: JSONSchema;
  description?: string;
  enum?: string[];
  default?: unknown;
}

export interface SolFaceTool {
  name: string;
  description: string;
  parameters: JSONSchema;
  handler: (params: Record<string, unknown>) => unknown;
}

// ─── Tool: generate_solface_svg ──────────────────

const generateSolfaceSvg: SolFaceTool = {
  name: "generate_solface_svg",
  description:
    "Generate a deterministic SVG avatar for a Solana wallet address. Returns an SVG string with gradient-rich rendering, skin-luminance-driven colors, and 10 accessory types. The same wallet always produces the same face. ~2.56 billion unique combinations.",
  parameters: {
    type: "object",
    properties: {
      wallet: {
        type: "string",
        description: "Solana wallet address (base58 public key)",
      },
      size: {
        type: "number",
        description: "SVG width/height in pixels. Default: 64. Sizes >= 48 use full detail (gradients, specular highlights, cheek blush).",
      },
      theme: {
        type: "string",
        description:
          "Preset theme name. 'flat' and 'transparent' work everywhere. 'glass', 'glassDark', 'pixel', 'pixelRetro', 'pixelClean' are React-only.",
        enum: ["default", "dark", "light", "mono", "flat", "transparent", "glass", "glassDark", "pixel", "pixelRetro", "pixelClean"],
      },
      enableBlink: {
        type: "boolean",
        description: "Enable CSS blink animation on the eyes. Default: false",
      },
      detail: {
        type: "string",
        description: "Detail level: 'full' (gradients, cheeks, specular), 'simplified' (flat shapes), 'auto' (full if size >= 48). Default: auto",
        enum: ["full", "simplified", "auto"],
      },
    },
    required: ["wallet"],
  },
  handler(params) {
    const wallet = params.wallet as string;
    const size = (params.size as number) ?? 64;
    const enableBlink = (params.enableBlink as boolean) ?? false;
    const detail = (params.detail as "full" | "simplified" | "auto") ?? "auto";
    const themeName = params.theme as string | undefined;
    const theme: SolFaceTheme | undefined = themeName
      ? getPresetTheme(themeName)
      : undefined;

    return renderSolFaceSVG(wallet, { size, theme, enableBlink, detail });
  },
};

// ─── Tool: describe_solface ──────────────────────

const describeSolface: SolFaceTool = {
  name: "describe_solface",
  description:
    "Generate a natural language description of a wallet's SolFace avatar. Useful for alt text, profile bios, system prompts, and accessibility. Describes squircle face, skin tone, eye style/color, hair, accessories, and expression.",
  parameters: {
    type: "object",
    properties: {
      wallet: {
        type: "string",
        description: "Solana wallet address (base58 public key)",
      },
      format: {
        type: "string",
        description:
          "Output format: paragraph (flowing text), structured (labeled lines), compact (short comma-separated). Default: paragraph",
        enum: ["paragraph", "structured", "compact"],
      },
      perspective: {
        type: "string",
        description:
          'Narrative perspective: "first" for self-description ("I have..."), "third" for external ("This SolFace has..."). Default: third',
        enum: ["first", "third"],
      },
      name: {
        type: "string",
        description:
          'Optional name to use instead of "This SolFace" or "I". E.g. "Atlas"',
      },
    },
    required: ["wallet"],
  },
  handler(params) {
    const wallet = params.wallet as string;
    const name = (params.name as string | undefined) ?? deriveName(wallet, "display");
    return describeAppearance(wallet, {
      format: (params.format as "paragraph" | "structured" | "compact") ?? "paragraph",
      perspective: (params.perspective as "first" | "third") ?? "third",
      name,
    });
  },
};

// ─── Tool: get_solface_traits ────────────────────

const getSolfaceTraits: SolFaceTool = {
  name: "get_solface_traits",
  description:
    "Get the raw numeric trait values, human-readable labels, and deterministic hash for a wallet's SolFace avatar. Returns structured data useful for programmatic decisions about appearance.",
  parameters: {
    type: "object",
    properties: {
      wallet: {
        type: "string",
        description: "Solana wallet address (base58 public key)",
      },
    },
    required: ["wallet"],
  },
  handler(params) {
    const wallet = params.wallet as string;
    const traits = generateTraits(wallet);
    const labels = getTraitLabels(traits);
    const hash = traitHash(wallet);
    const name = deriveName(wallet, "display");
    return { traits, labels, hash, name };
  },
};

// ─── Tool: get_agent_identity ────────────────────

const getAgentIdentity: SolFaceTool = {
  name: "get_agent_identity",
  description:
    "Generate a system prompt snippet that gives an AI agent a visual identity based on its Solana wallet. The snippet describes the agent's appearance in first person and explains the deterministic nature of SolFace avatars.",
  parameters: {
    type: "object",
    properties: {
      wallet: {
        type: "string",
        description: "The agent's Solana wallet address (base58 public key)",
      },
      agentName: {
        type: "string",
        description: 'Optional agent name to personalize the description. E.g. "Atlas"',
      },
    },
    required: ["wallet"],
  },
  handler(params) {
    const wallet = params.wallet as string;
    const agentName = (params.agentName as string | undefined) ?? deriveName(wallet, "display");
    return agentAppearancePrompt(wallet, agentName);
  },
};

// ─── Tool: list_solface_themes ───────────────────

const THEME_DESCRIPTIONS: Record<string, string> = {
  default: "Base look with gradient-rich rendering — no overrides",
  dark: "Dark backgrounds with muted tones and subtle border",
  light: "Soft pastel backgrounds with rounded corners",
  mono: "Full grayscale — all colors replaced with grays",
  flat: "Disables all gradients — uses flat fill colors only",
  transparent: "Transparent background with flat rendering",
  glass: "Liquid glass effect with backdrop blur and specular highlights (React-only)",
  glassDark: "Dark variant of liquid glass with deeper blur (React-only)",
  pixel: "Pixel art mode at 16px density with rounded corners (React-only)",
  pixelRetro: "Retro pixel art with scanlines and drop shadow (React-only)",
  pixelClean: "Clean pixel art at 24px density (React-only)",
};

const listSolfaceThemes: SolFaceTool = {
  name: "list_solface_themes",
  description:
    "List all available SolFace preset themes with descriptions. Themes control colors, gradients, borders, and rendering modes. Some themes (glass, pixel) are React-only.",
  parameters: {
    type: "object",
    properties: {},
  },
  handler() {
    return Object.keys(PRESET_THEMES).map((name) => ({
      name,
      description: THEME_DESCRIPTIONS[name] ?? "",
      reactOnly: name.startsWith("glass") || name.startsWith("pixel"),
    }));
  },
};

// ─── Tool: derive_solname ────────────────────────

const deriveSolname: SolFaceTool = {
  name: "derive_solname",
  description:
    "Derive a deterministic name from a Solana wallet address using SHA-256 hashing. Returns human-friendly names like 'Sunny Icon'. Same wallet always produces the same name. ~1M display name combinations, ~65.5B unique tag combinations.",
  parameters: {
    type: "object",
    properties: {
      wallet: {
        type: "string",
        description: "Solana wallet address (base58 public key)",
      },
      format: {
        type: "string",
        description:
          "Name format: 'short' (adjective only), 'display' (adj noun, default), 'tag' (adj noun#hex, unique), 'full' (adj noun-adj noun). Omit for full identity bundle.",
        enum: ["short", "display", "tag", "full"],
      },
    },
    required: ["wallet"],
  },
  handler(params) {
    const wallet = params.wallet as string;
    const format = params.format as NameFormat | undefined;
    if (format) {
      return deriveName(wallet, format);
    }
    return deriveIdentity(wallet);
  },
};

// ─── Export All Tools ────────────────────────────

export const SOLFACE_TOOLS: SolFaceTool[] = [
  generateSolfaceSvg,
  describeSolface,
  getSolfaceTraits,
  getAgentIdentity,
  listSolfaceThemes,
  deriveSolname,
];
