# Integrations Reference

## Agent Framework Adapters

SolFaces ships with structured tool definitions compatible with all major AI frameworks.

### Quick Setup

```ts
import { allToolsOpenAI, handleToolCall } from "solfaces/agent";

const tools = allToolsOpenAI();
const result = await handleToolCall("generate_solface_svg", {
  wallet: "7xKXtg...",
  theme: "dark",
  size: 128,
});
```

### Available Adapters

```ts
import {
  allToolsOpenAI,      // OpenAI function calling
  allToolsAnthropic,   // Claude / Anthropic tool use
  allToolsVercelAI,    // Vercel AI SDK
  allToolsMCP,         // Model Context Protocol
  handleToolCall,      // Universal dispatcher
} from "solfaces/agent";
```

### MCP Server

```json
{
  "mcpServers": {
    "solfaces": {
      "command": "npx",
      "args": ["-y", "solfaces"]
    }
  }
}
```

---

## Server-Side Routes

### REST API Pattern

```
GET /api/solface/:wallet              → SVG image
GET /api/solface/:wallet?format=png   → PNG image
GET /api/solface/:wallet?format=json  → Traits + description JSON
```

### Next.js App Router

```ts
import { renderSolFaceSVG, renderSolFacePNG } from "solfaces";

export async function GET(req: Request, { params }: { params: { wallet: string } }) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "svg";

  if (format === "png") {
    const png = await renderSolFacePNG(params.wallet, { pngSize: 256 });
    return new Response(png, { headers: { "Content-Type": "image/png" } });
  }

  const svg = renderSolFaceSVG(params.wallet, { size: 256 });
  return new Response(svg, { headers: { "Content-Type": "image/svg+xml" } });
}
```

### Express

```ts
import express from "express";
import { renderSolFaceSVG } from "solfaces";

const app = express();

app.get("/api/solface/:wallet", (req, res) => {
  const svg = renderSolFaceSVG(req.params.wallet, { size: 256 });
  res.type("image/svg+xml").send(svg);
});
```

### RenderOptions

Options accepted by `renderSolFaceSVG()`, `renderSolFaceDataURI()`, `renderSolFaceBase64()`, and `renderSolFacePNG()`:

```ts
interface RenderOptions {
  size?: number;                    // Default: 64
  theme?: SolFaceTheme;
  detail?: "full" | "simplified" | "auto";
  enableBlink?: boolean | { duration?: number; delay?: number };
  traitOverrides?: Partial<SolFaceTraits>;
  colorOverrides?: {
    skin?: string; eyes?: string; hair?: string; bg?: string;
    mouth?: string; eyebrow?: string; accessory?: string;
    nose?: string; eyeWhite?: string;
  };
}
```

### Server-side Color Overrides

```ts
import { renderSolFaceSVG } from "solfaces";
import { darkTheme } from "solfaces/themes";

const svg = renderSolFaceSVG("7xKXtg...", {
  theme: darkTheme,
  colorOverrides: { skin: "#ffd5b0", eyes: "#00ff00" },
});
```

### Custom Name Derivation

```ts
import { deriveName, deriveIdentity } from "solfaces";
import type { DeriveOptions } from "solfaces";

const opts: DeriveOptions = {
  adjectives: ["Fast", "Bold", "Calm"],
  nouns: ["Tiger", "Eagle", "Bear"],
};
deriveName("7xKXtg...", "display", opts);  // uses custom word lists
deriveIdentity("7xKXtg...", opts);         // full identity with custom lists
```

---

## PNG Rasterization

For Discord bots, Telegram bots, OG images, emails, and anywhere SVG isn't supported.

### Node.js

Requires `sharp` or `@resvg/resvg-js` (install one):

```ts
import { renderSolFacePNG } from "solfaces";

const pngBuffer = await renderSolFacePNG("7xKXtg...", { pngSize: 512 });
```

### Browser

```ts
import { renderSolFacePNGBrowser, renderSolFacePNGDataURL } from "solfaces";

const blob = await renderSolFacePNGBrowser("7xKXtg...", { pngSize: 256 });
const dataUrl = await renderSolFacePNGDataURL("7xKXtg...", { pngSize: 256 });
```

---

## Bot Integration

Templates included for **Telegram (grammy)** and **Discord (discord.js)**. Full code in `src/api-templates.ts`.

---

## Full API Reference

| Function | Returns | Description |
|----------|---------|-------------|
| `deriveName(wallet, format?)` | `string` | Deterministic name from wallet (SHA-256) |
| `deriveIdentity(wallet)` | `SolNameIdentity` | Full identity bundle from wallet |
| `generateTraits(wallet, overrides?)` | `SolFaceTraits` | Deterministic traits from wallet |
| `getTraitLabels(traits)` | `Record<string, string>` | Human-readable trait names |
| `traitHash(wallet)` | `string` | 8-char hex hash |
| `renderSolFaceSVG(wallet, options?)` | `string` | Raw SVG markup |
| `renderSolFaceDataURI(wallet, options?)` | `string` | Data URI for `<img>` tags |
| `renderSolFaceBase64(wallet, options?)` | `string` | Base64 data URI |
| `renderSolFacePNG(wallet, options?)` | `Promise<Buffer>` | PNG buffer (Node) |
| `renderSolFacePNGBrowser(wallet, options?)` | `Promise<Blob>` | PNG blob (browser) |
| `renderSolFacePNGDataURL(wallet, options?)` | `Promise<string>` | PNG data URL (browser) |
| `describeAppearance(wallet, options?)` | `string` | Natural language description |
| `describeTraits(traits, options?)` | `string` | Describe from pre-generated traits |
| `agentAppearancePrompt(wallet, name?)` | `string` | System prompt for AI agents |
| `solFaceAltText(wallet)` | `string` | Accessible alt text |

### Color Math Utilities

| Function | Returns | Description |
|----------|---------|-------------|
| `hexToRgb(hex)` | `[r, g, b]` | Parse hex color |
| `rgbToHex(r, g, b)` | `string` | Convert RGB to hex |
| `darken(hex, pct)` | `string` | Darken a color |
| `lighten(hex, pct)` | `string` | Lighten a color |
| `blend(a, b, t)` | `string` | Blend two colors |
| `luminance(hex)` | `number` | Perceived luminance (0-255) |
| `deriveSkinColors(skinHex)` | `DerivedColors` | Full skin-luminance color derivation |

---

## Accessibility

```ts
import { solFaceAltText } from "solfaces";

const alt = solFaceAltText("7xKXtg...");
// → "SolFace avatar: squircle face, warm golden skin, hazel almond eyes, ..."
```

The `<SolFace>` React component includes `role="img"` and an auto-generated `aria-label` by default.
