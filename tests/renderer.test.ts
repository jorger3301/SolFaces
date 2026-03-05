import { describe, it, expect } from "vitest";
import { renderSolFaceSVG, renderSolFaceDataURI, renderSolFaceBase64 } from "../src/core/renderer";
import { darkTheme, monoTheme, flatTheme, transparentTheme } from "../src/themes/presets";

const WALLET = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

describe("renderSolFaceSVG", () => {
  it("returns valid SVG markup", () => {
    const svg = renderSolFaceSVG(WALLET);
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it("contains viewBox attribute", () => {
    const svg = renderSolFaceSVG(WALLET);
    expect(svg).toContain('viewBox="0 0 64 64"');
  });

  it("is deterministic", () => {
    const a = renderSolFaceSVG(WALLET);
    const b = renderSolFaceSVG(WALLET);
    expect(a).toBe(b);
  });

  it("applies size parameter", () => {
    const svg = renderSolFaceSVG(WALLET, { size: 128 });
    expect(svg).toContain('width="128"');
    expect(svg).toContain('height="128"');
  });

  it("simplified mode omits face overlays", () => {
    const svg = renderSolFaceSVG(WALLET, { detail: "simplified" });
    // Simplified skips radial gradients (glow, chin, cheeks) but keeps linear gradients
    expect(svg).not.toContain("<radialGradient");
  });

  it("full mode includes face overlays", () => {
    const svg = renderSolFaceSVG(WALLET, { detail: "full" });
    expect(svg).toContain("<radialGradient");
  });

  it("auto mode at 32px uses simplified", () => {
    const svg = renderSolFaceSVG(WALLET, { size: 32, detail: "auto" });
    expect(svg).not.toContain("<radialGradient");
  });

  it("auto mode at 64px uses full", () => {
    const svg = renderSolFaceSVG(WALLET, { size: 64, detail: "auto" });
    expect(svg).toContain("<radialGradient");
  });

  it("blink animation adds keyframes", () => {
    const svg = renderSolFaceSVG(WALLET, { enableBlink: true });
    expect(svg).toContain("@keyframes");
    expect(svg).toContain("blink");
  });

  it("dark theme applies dark background colors", () => {
    const svg = renderSolFaceSVG(WALLET, { theme: darkTheme });
    // Dark theme backgrounds are dark hex values
    expect(svg).toContain('stroke="#333340"');
  });

  it("mono theme renders without errors", () => {
    const svg = renderSolFaceSVG(WALLET, { theme: monoTheme });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it("flat theme omits gradients", () => {
    const svg = renderSolFaceSVG(WALLET, { theme: flatTheme });
    expect(svg).not.toContain("<linearGradient");
    expect(svg).not.toContain("<defs>");
  });

  it("transparent theme sets background opacity to 0", () => {
    const svg = renderSolFaceSVG(WALLET, { theme: transparentTheme });
    expect(svg).toContain('opacity="0"');
  });

  it("never contains NaN, undefined, or null", () => {
    const wallets = [
      WALLET,
      "4Nd1m5drB5pESoEGBqJSrELwTaGEHnNFxcSzJUt8qMBr",
      "HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH",
    ];
    for (const w of wallets) {
      const svg = renderSolFaceSVG(w);
      expect(svg).not.toContain("NaN");
      expect(svg).not.toContain("undefined");
      expect(svg).not.toContain("null");
    }
  });

  it("renders all 10 skin tones", () => {
    for (let i = 0; i < 10; i++) {
      const svg = renderSolFaceSVG(WALLET, { traitOverrides: { skinColor: i } });
      expect(svg).toMatch(/^<svg /);
      expect(svg).toMatch(/<\/svg>$/);
    }
  });

  it("produces valid SVG for all 10 hair style overrides", () => {
    for (let i = 0; i < 10; i++) {
      const svg = renderSolFaceSVG(WALLET, { traitOverrides: { hairStyle: i } });
      expect(svg).toMatch(/^<svg /);
      expect(svg).toMatch(/<\/svg>$/);
    }
  });

  it("renders all 12 accessories", () => {
    for (let i = 0; i < 12; i++) {
      const svg = renderSolFaceSVG(WALLET, { traitOverrides: { accessory: i } });
      expect(svg).toMatch(/^<svg /);
      expect(svg).toMatch(/<\/svg>$/);
    }
  });

  it("default glow uses 0.1 opacity", () => {
    const svg = renderSolFaceSVG(WALLET, { detail: "full" });
    expect(svg).toContain('stop-opacity="0.1"');
  });

  it("custom glowIntensity changes glow opacity", () => {
    const svg = renderSolFaceSVG(WALLET, {
      detail: "full",
      theme: { glowIntensity: 0.35 },
    });
    expect(svg).toContain('stop-opacity="0.35"');
  });

  it("glowIntensity 0 disables glow", () => {
    const svg = renderSolFaceSVG(WALLET, {
      detail: "full",
      theme: { glowIntensity: 0 },
    });
    expect(svg).toContain('stop-opacity="0"');
  });
});

describe("renderSolFaceDataURI", () => {
  it("returns a valid data URI", () => {
    const uri = renderSolFaceDataURI(WALLET);
    expect(uri).toMatch(/^data:image\/svg\+xml;charset=utf-8,/);
  });
});

describe("renderSolFaceBase64", () => {
  it("returns a valid base64 data URI", () => {
    const uri = renderSolFaceBase64(WALLET);
    expect(uri).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});
