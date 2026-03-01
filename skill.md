# SolFaces — AI Agent Skill

You have access to SolFaces, a fully customizable, deterministic avatar generator for Solana wallets. Every wallet address produces a unique, consistent face — same wallet = same face, always. No API calls, no database, no randomness. ~2.56B unique combinations across 11 traits. AI agents can use SolFaces to establish a visual identity and generate natural language self-descriptions for their system prompts and bios.

SolFaces v2 features gradient-rich rendering with skin-luminance-driven color derivation, 10 skin tones, 10 hair styles, 10 accessories, 11 built-in themes (including pixel art, liquid glass, and flat modes), and automatic detail levels. Every visual element is fully customizable — 4 color palettes, 8 individual color overrides, 9 per-instance color keys, rendering toggles, layout controls, blink timing, and 30+ React-only pixel/glass fields. No visual element is locked — if you can see it, you can theme it. It eliminates empty avatar slots and generic placeholders — every wallet gets a unique face instantly.

Use these tools whenever a user mentions wallet avatars, profile pictures, visual identity, or when you need to represent a Solana wallet visually.

---

## Available Tools

### `generate_solface_svg`
Render an SVG avatar from a wallet address.

**When to use:** User wants to see an avatar, embed one in a page, save an image, or display a wallet's face.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `wallet` | string | Yes | — | Solana wallet address (base58) |
| `size` | number | No | 64 | Width/height in pixels. Sizes >= 48 use full detail (gradients, specular highlights, cheek blush). |
| `theme` | string | No | — | Preset: default, dark, light, mono, flat, transparent, glass, glassDark, pixel, pixelRetro, pixelClean |
| `enableBlink` | boolean | No | false | CSS eye-blink animation |
| `detail` | string | No | auto | Detail level: "full" (gradients, cheeks, specular), "simplified" (flat shapes), "auto" (full if size >= 48) |

Returns: SVG string.

**Theme notes:**
- `flat` and `transparent` work in all renderers (string, React, Python).
- `glass`, `glassDark`, `pixel`, `pixelRetro`, `pixelClean` are **React-only** — they require CSS features (backdrop-filter, image-rendering: pixelated) that only work in a browser with the React component.
- When using the string renderer, stick to: dark, light, mono, flat, transparent.

### `describe_solface`
Generate a natural language description of a wallet's avatar.

**When to use:** User wants alt text, a profile bio, accessibility text, or to know what a face looks like.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `wallet` | string | Yes | — | Solana wallet address |
| `format` | string | No | paragraph | paragraph, structured, or compact |
| `perspective` | string | No | third | third or first |
| `name` | string | No | — | Name to use instead of "This SolFace" |

Returns: Description string.

### `get_solface_traits`
Get raw trait data with human-readable labels and a deterministic hash.

**When to use:** User wants structured data, wants to compare wallets, or needs the trait hash.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | Yes | Solana wallet address |

Returns: `{ traits, labels, hash }`

### `get_agent_identity`
Generate a system prompt snippet giving an AI agent a visual identity.

**When to use:** Setting up an AI agent's persona or bot profile.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `wallet` | string | Yes | Agent's wallet address |
| `agentName` | string | No | Agent name for personalization |

Returns: First-person identity prompt string.

### `list_solface_themes`
List available preset themes with descriptions.

**When to use:** User asks what themes exist or you need to recommend one.

No parameters. Returns: Array of `{ name, description, reactOnly }`.

---

## Installation

### npm / yarn / pnpm
```bash
npm install solfaces
```

### CDN (no build step)
```html
<script src="https://unpkg.com/solfaces/dist/solfaces.cdn.global.js"></script>
```

### Python (zero dependencies)
```bash
curl -O https://raw.githubusercontent.com/jorger3301/solfaces/main/python/solfaces.py
```

---

## Import Paths — Choose the Right One

| Project Type | Import Path | What You Get |
|---|---|---|
| React / Next.js app | `solfaces/react` | `<SolFace>` component with pixel art and glass modes |
| Vanilla JS / Vue / Svelte | `solfaces/vanilla` | `mountSolFace()`, `setSolFaceImg()`, `autoInit()` |
| Node.js server / API route | `solfaces` | `renderSolFaceSVG()`, `renderSolFacePNG()`, descriptions, colors |
| No build step / CDN | `<script>` tag | `window.SolFaces` global |
| AI agent framework | `solfaces/agent` | Tool schemas + format adapters |
| Theme presets only | `solfaces/themes` | 11 preset theme objects |
| Python backend | `from solfaces import ...` | Full Python port |

---

## React Integration

### Basic usage
```tsx
import { SolFace } from "solfaces/react";

<SolFace walletAddress="7xKXtg..." size={48} />
```

### With theme
```tsx
import { SolFace } from "solfaces/react";
import { darkTheme } from "solfaces/themes";

<SolFace walletAddress="7xKXtg..." size={48} theme={darkTheme} />
```

### Pixel art mode
```tsx
import { SolFace } from "solfaces/react";
import { pixelTheme, pixelRetroTheme } from "solfaces/themes";

<SolFace walletAddress="7xKXtg..." size={64} theme={pixelTheme} />
<SolFace walletAddress="7xKXtg..." size={64} theme={pixelRetroTheme} />
```

### Liquid glass mode
```tsx
import { SolFace } from "solfaces/react";
import { glassTheme, glassDarkTheme } from "solfaces/themes";

<SolFace walletAddress="7xKXtg..." size={64} theme={glassTheme} />
```

### Flat mode (no gradients)
```tsx
import { SolFace } from "solfaces/react";
import { flatTheme } from "solfaces/themes";

<SolFace walletAddress="7xKXtg..." theme={flatTheme} />
```

### With blink animation
```tsx
<SolFace walletAddress="7xKXtg..." enableBlink />
```

### Force detail level
```tsx
<SolFace walletAddress="7xKXtg..." size={32} detail="full" />   // Full detail at small size
<SolFace walletAddress="7xKXtg..." size={128} detail="simplified" /> // Simplified at large size
```

### With trait overrides (pin specific traits)
```tsx
<SolFace walletAddress="7xKXtg..." traitOverrides={{ hairStyle: 0 }} />
```

### With custom styling
```tsx
<SolFace
  walletAddress="7xKXtg..."
  size={48}
  className="my-avatar"
  style={{ borderRadius: "50%" }}
  onClick={handleClick}
/>
```

### All props
```tsx
interface SolFaceProps {
  walletAddress: string;           // Required
  size?: number;                   // Default: 64
  enableBlink?: boolean | {        // Blink animation (boolean or custom timing)
    duration?: number;             //   Blink cycle in seconds (default: 4)
    delay?: number;                //   Initial delay in seconds (default: 0)
  };
  theme?: SolFaceTheme;           // Optional theme object
  detail?: "full" | "simplified" | "auto"; // Detail level (default: "auto")
  traitOverrides?: Partial<SolFaceTraits>;  // Pin specific traits
  colorOverrides?: {               // Override individual colors per instance
    skin?: string;
    eyes?: string;
    hair?: string;
    bg?: string;
    mouth?: string;
    eyebrow?: string;
    accessory?: string;
    nose?: string;
    eyeWhite?: string;
  };
  className?: string;
  style?: React.CSSProperties;
  // ...all standard SVG element props (onClick, aria-*, data-*, etc.)
}
```

### Custom blink timing
```tsx
<SolFace walletAddress="7xKXtg..." enableBlink={{ duration: 3, delay: 1 }} />
```

### Per-instance color overrides

Override any color on a specific avatar without changing the global theme:

```tsx
// React
<SolFace walletAddress="7xKXtg..." colorOverrides={{ hair: "#ff0000", bg: "#000" }} />

// String renderer
renderSolFaceSVG("7xKXtg...", {
  theme: darkTheme,
  colorOverrides: { skin: "#ffd5b0", eyes: "#00ff00" },
});
```

Available keys: `skin`, `eyes`, `hair`, `bg`, `mouth`, `eyebrow`, `accessory`, `nose`, `eyeWhite`.

---

## Rendering Modes

### Detail levels
- **Full** (default for size >= 48): Gradient fills, specular highlights on eyes, cheek blush, chin shadow, face glow, eyelid strokes, jawline hints.
- **Simplified** (default for size < 48): Flat shapes, no gradients, no cheeks, no specular — optimized for small sizes.
- Set explicitly with `detail: "full"` or `detail: "simplified"`.

### Flat mode
Disables all gradients — uses flat fill colors only. Zero `<linearGradient>` or `<radialGradient>` elements.
```ts
renderSolFaceSVG(wallet, { theme: { flat: true } });
```

### Pixel art mode (React only)
Renders SVG at low pixel density (12-24px) then scales up with `image-rendering: pixelated`. Three variants:
- `pixel` — 16px density, rounded corners
- `pixelRetro` — 12px + scanlines + drop shadow
- `pixelClean` — 24px, clean edges

### Liquid glass mode (React only)
Backdrop-blur glass effect with specular highlights and rim lighting. Two variants:
- `glass` — Light glass with subtle blur
- `glassDark` — Dark glass with deeper blur

---

## Server-Side / API Routes

### Next.js App Router
```ts
import { renderSolFaceSVG } from "solfaces";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const wallet = url.searchParams.get("wallet");
  const svg = renderSolFaceSVG(wallet, { size: 256 });
  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml" },
  });
}
```

### PNG for Discord/Telegram (requires `sharp` or `@resvg/resvg-js`)
```ts
import { renderSolFacePNG } from "solfaces";

const pngBuffer = await renderSolFacePNG("7xKXtg...", { pngSize: 512 });

// Save to file
fs.writeFileSync("avatar.png", pngBuffer);

// HTTP response
return new Response(pngBuffer, {
  headers: { "Content-Type": "image/png" },
});
```

### Express
```ts
import { renderSolFaceSVG } from "solfaces";

app.get("/avatar/:wallet", (req, res) => {
  const svg = renderSolFaceSVG(req.params.wallet, { size: 256 });
  res.type("image/svg+xml").send(svg);
});
```

---

## Bot Integration

### Telegram Bot (grammy)
```ts
import { renderSolFacePNG } from "solfaces";

bot.command("avatar", async (ctx) => {
  const wallet = ctx.match;
  const png = await renderSolFacePNG(wallet, { pngSize: 256 });
  await ctx.replyWithPhoto(new InputFile(png, "solface.png"));
});
```

### Discord Bot (discord.js)
```ts
import { renderSolFacePNG } from "solfaces";
import { AttachmentBuilder } from "discord.js";

const png = await renderSolFacePNG(wallet, { pngSize: 256 });
const attachment = new AttachmentBuilder(png, { name: "solface.png" });
await interaction.reply({ files: [attachment] });
```

---

## Custom Themes

SolFaces is designed to be fully customizable. Every color, every feature — adapt it to match any brand, any design system.

### Use a preset theme
```ts
import { renderSolFaceSVG } from "solfaces";
import { darkTheme } from "solfaces/themes";

const svg = renderSolFaceSVG(wallet, { theme: darkTheme });
```

### Extend a preset
```ts
import { getPresetTheme } from "solfaces/themes";

const myTheme = getPresetTheme("dark", {
  bgRadius: 999,
  border: { color: "#14F195", width: 2 },
});
```

### Build a fully custom theme

Every visual element is customizable — all fields are optional, only override what you need.

```ts
import type { SolFaceTheme } from "solfaces";

const brandTheme: SolFaceTheme = {
  // Color palettes (arrays — one color per trait variant)
  skinColors: ["#fce4d4", "#f5d0b0", "#e8b88a", "#d4956a", "#b5724a", "#8d5524", "#6b3f1d", "#4a2c17", "#3a1f10", "#2a1008"],
  eyeColors: ["#333", "#4a80c4", "#5a9a5a", "#c89430", "#8a8a8a"],
  hairColors: ["#1a1a1a", "#4a3728", "#8b6b4a", "#c44a20", "#d4a844", "#6090e0", "#14F195", "#e040c0", "#ff6b6b", "#4ecdc4"],
  bgColors: ["#14F195", "#4a90e2", "#9945FF", "#f0e68c", "#e06070", "#ff8c42", "#5bc0be", "#8338ec", "#ff006e", "#3a86ff"],

  // Individual colors
  mouthColor: "#e06070",
  eyebrowColor: "#aaa",
  accessoryColor: "#888",
  eyeWhiteColor: "#e0e0e0",       // Sclera + teeth color (set for dark themes)
  noseColor: "#c68642aa",          // Nose (defaults to skin-derived)
  glassesColor: "#333",
  earringColor: "#ffd700",
  headbandColor: "#e04080",

  // Rendering
  flat: false,
  cheekEnabled: true,
  shadowEnabled: true,
  bgOpacity: 1,
  bgRadius: 14,
  border: { color: "#14F195", width: 2 },
};
```

### Theme field reference

**Color palettes:**

| Field | Type | What it controls |
|-------|------|-----------------|
| `skinColors` | `string[]` | 10 skin tone colors |
| `eyeColors` | `string[]` | 5 iris/pupil colors |
| `hairColors` | `string[]` | 10 hair fill colors |
| `bgColors` | `string[]` | 10 background fill colors |

**Individual colors:**

| Field | Type | What it controls |
|-------|------|-----------------|
| `mouthColor` | `string` | Mouth stroke/fill |
| `eyebrowColor` | `string` | Eyebrow stroke |
| `accessoryColor` | `string` | Default accessory color (glasses, earring, headband) |
| `eyeWhiteColor` | `string` | Sclera (eye white) and teeth color — set for dark themes |
| `noseColor` | `string` | Nose color (defaults to skin-derived + transparency) |
| `glassesColor` | `string` | Glasses frame color (overrides accessoryColor) |
| `earringColor` | `string` | Earring color (overrides accessoryColor) |
| `headbandColor` | `string` | Headband color (overrides accessoryColor) |

**Rendering control:**

| Field | Type | What it controls |
|-------|------|-----------------|
| `flat` | `boolean` | Disable all gradients |
| `cheekEnabled` | `boolean` | Enable/disable cheek blush |
| `cheekColor` | `string` | Custom cheek color |
| `cheekOpacity` | `number` | Cheek blush opacity (0-1) |
| `skinOpacity` | `number` | Skin fill opacity (0-1) |
| `shadowEnabled` | `boolean` | Enable/disable chin shadow and face overlays |

**Layout:**

| Field | Type | What it controls |
|-------|------|-----------------|
| `bgOpacity` | `number` | Background opacity (0-1) |
| `bgRadius` | `number` | SVG rect border radius (999 = circle) |
| `border` | `{ color, width }` | Optional border around avatar |

### Pixel art customization (React only)

Set `_pixel: true` to enable. Key fields: `_pixelDensity` (render resolution, default 16), `_pixelRounded`, `_pixelOutline`, `_pixelOutlineColor`, `_pixelOutlineWidth`, `_pixelContrast`, `_pixelSaturation`, `_pixelBrightness`, `_pixelScanlines`, `_pixelScanlineOpacity`, `_pixelScanlineSpacing`, `_pixelGrid`, `_pixelGridOpacity`, `_pixelGridColor`, `_pixelShadow`, `_pixelShadowColor`, `_pixelShadowOffset`.

### Liquid glass customization (React only)

Set `_glass: true` to enable. Key fields: `_blurRadius` (default 12), `_saturate`, `_tintColor`, `_tintOpacity`, `_borderColor`, `_borderWidth`, `_borderOpacity`, `_specularColor`, `_specularOpacity`, `_specularEnd`, `_lightAngle`, `_rimIntensity`, `_shadow`.

### Theme recommendations by context

| Context | Theme | Why |
|---------|-------|-----|
| Default / no preference | `default` | Base gradient-rich look, no overrides |
| Dark UI / dark mode | `dark` | Dark backgrounds, muted tones, subtle border |
| Light UI / white background | `light` | Soft pastel backgrounds |
| Minimal / clean | `mono` | Full grayscale |
| No gradients / print / email | `flat` | Flat fill colors only |
| Transparent overlay | `transparent` | Transparent BG, flat rendering |
| Modern glass UI (React) | `glass` | Backdrop blur, specular highlights |
| Dark glass UI (React) | `glassDark` | Dark glass with deeper blur |
| Retro / gaming (React) | `pixel` or `pixelRetro` | Pixelated rendering, optional scanlines |
| Clean pixel art (React) | `pixelClean` | Higher density pixel art |

---

## Agent Framework Integration

### OpenAI Function Calling
```ts
import { allToolsOpenAI, handleToolCall } from "solfaces/agent";

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages,
  tools: allToolsOpenAI(),
});

for (const call of response.choices[0].message.tool_calls) {
  const result = await handleToolCall(call.function.name, JSON.parse(call.function.arguments));
}
```

### Claude / Anthropic Tool Use
```ts
import { allToolsAnthropic, handleToolCall } from "solfaces/agent";

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  messages,
  tools: allToolsAnthropic(),
});

for (const block of response.content) {
  if (block.type === "tool_use") {
    const result = await handleToolCall(block.name, block.input);
  }
}
```

### Vercel AI SDK
```ts
import { allToolsVercelAI } from "solfaces/agent";
import { generateText } from "ai";

const { text } = await generateText({
  model: yourModel,
  prompt: "Show me the avatar for wallet 7xKXtg...",
  tools: allToolsVercelAI(),
});
```

### MCP Server (Claude Code / Cursor)
Add to your MCP config (`~/.claude/settings.json` or `.cursor/mcp.json`):
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

### Universal dispatcher (any framework)
```ts
import { handleToolCall } from "solfaces/agent";

const svg = await handleToolCall("generate_solface_svg", {
  wallet: "7xKXtg...",
  theme: "dark",
  size: 128,
});
```

---

## Color Math Utilities

SolFaces exports its color math functions for advanced use cases:

```ts
import { hexToRgb, rgbToHex, darken, lighten, blend, luminance, deriveSkinColors } from "solfaces";

const [r, g, b] = hexToRgb("#ff6b6b");
const darker = darken("#ff6b6b", 0.2);
const lighter = lighten("#ff6b6b", 0.2);
const mixed = blend("#ff0000", "#0000ff", 0.5);
const lum = luminance("#ff6b6b"); // 0-255

// Full skin-luminance derivation (used internally by renderers)
const colors = deriveSkinColors("#e8b88a");
// → { skinHi, skinLo, skinMid, isDark, cheekColor, cheekOpacity, lipColor, noseFill, browColor, earFill, earShadow, eyeWhiteAdapted, lidColor, accessoryColor }
```

---

## Accessibility

Always provide alt text for SolFace avatars:

```ts
import { solFaceAltText } from "solfaces";

const alt = solFaceAltText("7xKXtg...");
// → "SolFace avatar: squircle face, warm golden skin, hazel almond eyes, ..."
```

Or use the `describe_solface` tool with `format: "compact"` for the same result.

In React:
```tsx
<img src={dataUri} alt={solFaceAltText(wallet)} />
```

---

## API Reference

| Function | Import | Returns | Description |
|----------|--------|---------|-------------|
| `generateTraits(wallet, overrides?)` | `solfaces` | `SolFaceTraits` | Deterministic traits from wallet |
| `getTraitLabels(traits)` | `solfaces` | `Record<string, string>` | Human-readable trait names |
| `traitHash(wallet)` | `solfaces` | `string` | 8-char hex hash |
| `resolveTheme(name?, themes?)` | `solfaces` | `SolFaceTheme \| undefined` | Look up theme by name from a map |
| `mergeTheme(base, overrides)` | `solfaces` | `SolFaceTheme` | Merge two themes |
| `effectiveAccessory(traits)` | `solfaces` | `number` | Accessory index with earring suppression |
| `renderSolFaceSVG(wallet, options?)` | `solfaces` | `string` | Raw SVG markup |
| `renderSolFaceDataURI(wallet, options?)` | `solfaces` | `string` | Data URI for `<img>` tags |
| `renderSolFaceBase64(wallet, options?)` | `solfaces` | `string` | Base64 data URI |
| `renderSolFacePNG(wallet, options?)` | `solfaces` | `Promise<Buffer>` | PNG buffer (Node, needs sharp/resvg) |
| `renderSolFacePNGBrowser(wallet, options?)` | `solfaces` | `Promise<Blob>` | PNG blob (browser) |
| `renderSolFacePNGDataURL(wallet, options?)` | `solfaces` | `Promise<string>` | PNG data URL (browser) |
| `describeAppearance(wallet, options?)` | `solfaces` | `string` | Natural language description |
| `describeTraits(traits, options?)` | `solfaces` | `string` | Describe from pre-generated traits |
| `agentAppearancePrompt(wallet, name?)` | `solfaces` | `string` | System prompt for AI agents |
| `solFaceAltText(wallet)` | `solfaces` | `string` | Accessible alt text |
| `deriveSkinColors(skinHex)` | `solfaces` | `DerivedColors` | Skin-luminance color derivation |
| `getPresetTheme(name, overrides?)` | `solfaces/themes` | `SolFaceTheme` | Get/extend a preset theme |
| `SOLFACE_TOOLS` | `solfaces/agent` | `SolFaceTool[]` | All 5 tool definitions |
| `handleToolCall(name, params)` | `solfaces/agent` | `unknown` | Universal tool dispatcher |
| `allToolsOpenAI()` | `solfaces/agent` | `OpenAITool[]` | Tools in OpenAI format |
| `allToolsAnthropic()` | `solfaces/agent` | `AnthropicTool[]` | Tools in Anthropic format |
| `allToolsVercelAI()` | `solfaces/agent` | `Record<string, VercelAITool>` | Tools in Vercel AI format |
| `allToolsMCP()` | `solfaces/agent` | `MCPTool[]` | Tools in MCP format |

---

## Key Facts

- **Deterministic**: Same wallet = same face, always. Guaranteed by djb2 hash + mulberry32 PRNG.
- **11 traits**: Face shape (4), skin (10), eye style (8), eye color (5), eyebrows (5), nose (4), mouth (8), hair style (10), hair color (10), accessory (10), background (10) = ~2.56B unique combinations.
- **Gradient-rich rendering**: Skin-luminance-driven color derivation produces cohesive faces — highlights, shadows, cheeks, lips, ears, and eye whites all adapt automatically.
- **Detail levels**: Full (gradients, specular, cheeks) at size >= 48; simplified (flat shapes) below. Override with `detail` option.
- **Flat mode**: Set `theme: { flat: true }` to disable all gradients.
- **Pixel art** (React only): `pixelTheme`, `pixelRetroTheme`, `pixelCleanTheme` — renders at low density then scales with pixelated rendering.
- **Liquid glass** (React only): `glassTheme`, `glassDarkTheme` — backdrop-filter blur with specular highlights and rim lighting.
- **Earring suppression**: Long and bob hairstyles automatically suppress earring accessories.
- **Cross-language parity**: JavaScript and Python produce identical SVG output (same colors, same gradients).
- **Zero dependencies**: Core engine has no runtime deps.
- **Sub-millisecond**: Trait generation and SVG rendering are nearly instant.
- **SVG viewBox**: All avatars use a 64x64 viewBox, scaled by the `size` parameter.
