// Core engine
export {
  generateTraits,
  getTraitLabels,
  traitHash,
  resolveTheme,
  mergeTheme,
  effectiveAccessory,
  SKIN_COLORS,
  EYE_COLORS,
  HAIR_COLORS,
  BG_COLORS,
} from "./core/traits";
export type { SolFaceTraits, SolFaceTheme, RenderOptions } from "./core/traits";

// Color math
export {
  hexToRgb,
  rgbToHex,
  darken,
  lighten,
  blend,
  luminance,
  deriveSkinColors,
  buzzOpacity,
} from "./core/colors";
export type { DerivedColors } from "./core/colors";

// SVG rendering
export {
  renderSolFaceSVG,
  renderSolFaceDataURI,
  renderSolFaceBase64,
} from "./core/renderer";

// AI descriptions
export {
  describeAppearance,
  describeTraits,
  solFaceAltText,
  agentAppearancePrompt,
} from "./core/describe";
export type { DescribeOptions } from "./core/describe";

// PNG rasterization
export {
  renderSolFacePNG,
  renderSolFacePNGBrowser,
  renderSolFacePNGDataURL,
} from "./core/rasterize";
export type { PNGOptions } from "./core/rasterize";

// SolNames — deterministic name derivation
export { deriveName, deriveIdentity, isValidSolName, parseSolName } from "./names";
export { ADJECTIVES, NOUNS, SOLNAMES_VERSION } from "./names";
export type { NameFormat, SolNameIdentity, ParsedSolName, DeriveOptions } from "./names";

// Themes
export {
  PRESET_THEMES,
  getPresetTheme,
} from "./themes/presets";

// Agent tools
export { SOLFACE_TOOLS, handleToolCall } from "./agent";
export type { SolFaceTool } from "./agent";
