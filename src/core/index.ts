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
} from "./traits";
export type { SolFaceTraits, SolFaceTheme, RenderOptions } from "./traits";

// Color math
export {
  hexToRgb,
  rgbToHex,
  darken,
  lighten,
  blend,
  luminance,
  contrastRatio,
  deriveSkinColors,
} from "./colors";
export type { DerivedColors } from "./colors";

// SVG rendering
export {
  renderSolFaceSVG,
  renderSolFaceDataURI,
  renderSolFaceBase64,
} from "./renderer";

// AI descriptions
export {
  describeAppearance,
  describeTraits,
  solFaceAltText,
  agentAppearancePrompt,
} from "./describe";
export type { DescribeOptions } from "./describe";

// PNG rasterization
export {
  renderSolFacePNG,
  renderSolFacePNGBrowser,
  renderSolFacePNGDataURL,
} from "./rasterize";
export type { PNGOptions } from "./rasterize";

