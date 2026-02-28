#  SolFaces

**Deterministic wallet avatars for the Solana ecosystem.**

Every Solana wallet address generates a unique, consistent face — no API calls, no storage, no randomness. Same wallet = same face, everywhere, forever.

Built for dApps, AI agents, social features, leaderboards, and anywhere a wallet needs a visual identity.

---

## Why SolFaces?

- **Deterministic** — Same wallet always produces the same avatar. No database needed.
- **Zero dependencies** — Core engine has no runtime dependencies.
- **~221M unique faces** — 11 traits with multiple variants = massive combination space.
- **Works everywhere** — React, vanilla JS, Node, Python, CDN script tag, edge functions.
- **Fully customizable** — Every color, every feature. Themes, per-instance overrides, animation timing — adapt every detail to match your UI, your brand, or your users' preferences.
- **Eliminates dead space** — No more blank avatars or generic placeholders. Every wallet gets a unique face instantly, elevating your dApp or website UI even when users never upload a profile picture.
- **AI-agent ready** — Natural language self-descriptions for agent system prompts.
- **PNG rasterization** — Serve real image files for bots, Discord, Telegram, OG images.
- **SSR-ready** — String renderer works server-side with zero browser APIs.

---

## Install

### npm / yarn / pnpm

```bash
npm install solfaces
```

### CDN (no build step)

```html
<script src="https://unpkg.com/solfaces/dist/solfaces.cdn.global.js"></script>
```

### Python

```bash
# Zero dependencies — just copy the file
curl -O https://raw.githubusercontent.com/jorger3301/solfaces/main/python/solfaces.py
```

---

## Quick Start

### React

```tsx
import { SolFace } from "solfaces/react";

function UserProfile({ walletAddress }) {
  return <SolFace walletAddress={walletAddress} size={48} enableBlink />;
}
```

### Vanilla JS (npm)

```js
import { mountSolFace } from "solfaces/vanilla";

mountSolFace("#avatar", "7xKXqR...", { size: 48 });
```

### CDN / Script Tag (zero build step)

```html
<div data-solface="7xKXqR..." data-solface-size="48" data-solface-theme="dark"></div>

<script src="https://unpkg.com/solfaces/dist/solfaces.cdn.global.js"></script>
<!-- Auto-initializes on DOMContentLoaded -->

<!-- Or use programmatically: -->
<script>
  SolFaces.mount("#my-avatar", "7xKXqR...", { size: 64 });
  const description = SolFaces.describe("7xKXqR...");
</script>
```

### Node / SSR / Edge

```ts
import { renderSolFaceSVG } from "solfaces";

const svg = renderSolFaceSVG("7xKXqR...", { size: 128 });
// Raw SVG string — use in emails, OG images, PDFs, etc.
```

### Python

```python
from solfaces import generate_traits, render_svg, describe_appearance

traits = generate_traits("7xKXqR...")
svg = render_svg("7xKXqR...", size=256)
desc = describe_appearance("7xKXqR...")
```

---

## AI Agent Identity

SolFaces gives AI agents a visual identity tied to their wallet. The `describeAppearance()` function generates natural language descriptions agents can use in system prompts to know and reference what they look like.

### System Prompt Integration

```ts
import { agentAppearancePrompt } from "solfaces";

const appearance = agentAppearancePrompt("7xKXqR...", "Atlas");
// → "My visual identity is a SolFace avatar (ID: a3f2b1c0) derived from
//    my wallet address. I'm Atlas. I have a round face with light peach skin,
//    wide and expressive blue eyes with elegantly arched eyebrows, and tall,
//    spiky Solana mint green hair. I'm wearing round glasses. I have a
//    confident smirk. This appearance is deterministic — anyone who looks up
//    my wallet will see the same face."

const systemPrompt = `You are Atlas, a DeFi trading agent. ${appearance}`;
```

### Description Formats

```ts
import { describeAppearance } from "solfaces";

// Full paragraph (for bios, about pages)
describeAppearance("7xKXqR...", { format: "paragraph", perspective: "third" });

// First person (for agent self-reference)
describeAppearance("7xKXqR...", { format: "paragraph", perspective: "first", name: "Atlas" });

// Structured (for data display)
describeAppearance("7xKXqR...", { format: "structured" });
// → "Face: round\nSkin: light peach\nEyes: wide and expressive, blue\n..."

// Compact (for alt text, captions)
describeAppearance("7xKXqR...", { format: "compact" });
// → "round face, light peach skin, blue wide eyes, spiky mint hair, round glasses, smirking"
```

### Alt Text & Accessibility

```ts
import { solFaceAltText } from "solfaces";

const alt = solFaceAltText("7xKXqR...");
// → "SolFace avatar: round face, light peach skin, blue wide eyes, ..."
```

### Python (AI Agent Backends)

```python
from solfaces import agent_appearance_prompt

prompt = agent_appearance_prompt("7xKXqR...", "Atlas")
# Identical output to the JavaScript version
```

---

## PNG Rasterization

For Discord bots, Telegram bots, OG images, emails, and anywhere SVG isn't supported.

### Node.js

Requires `sharp` or `@resvg/resvg-js` (install one):

```bash
npm install sharp
# or
npm install @resvg/resvg-js
```

```ts
import { renderSolFacePNG } from "solfaces";

const pngBuffer = await renderSolFacePNG("7xKXqR...", { pngSize: 512 });

// Save to file
import fs from "fs";
fs.writeFileSync("avatar.png", pngBuffer);

// Send as HTTP response
return new Response(pngBuffer, {
  headers: { "Content-Type": "image/png" },
});
```

### Browser

```ts
import { renderSolFacePNGBrowser, renderSolFacePNGDataURL } from "solfaces";

// As Blob (for downloads, uploads)
const blob = await renderSolFacePNGBrowser("7xKXqR...", { pngSize: 256 });

// As data URL (for img.src)
const dataUrl = await renderSolFacePNGDataURL("7xKXqR...", { pngSize: 256 });
```

---

## Themes

SolFaces is fully customizable to your UI. Every visual element — skin, eyes, hair, mouth, eyebrows, nose, accessories, background, border, and even eye white/teeth color — can be themed globally or overridden per instance. Use a preset, extend one, or build your own from scratch. You can also use `colorOverrides` to change individual colors on a specific avatar without affecting the theme.

### Available Presets

| Theme | Description |
|-------|-------------|
| `solanaTheme` | Default — vibrant Solana colors (#14F195, #9945FF) |
| `darkTheme` | Muted tones on dark backgrounds |
| `lightTheme` | Soft pastels for white/light UIs |
| `monoTheme` | Grayscale only — minimal interfaces |
| `neonTheme` | High-contrast cyberpunk vibes |
| `jupiterTheme` | Matches Jupiter aggregator's palette |
| `phantomTheme` | Phantom wallet's purple style |
| `circleTheme` | Full border-radius for circular avatars |

### Custom Themes

```ts
const myTheme: SolFaceTheme = {
  skinColors: ["#ffd5b0", "#f4c794", "#e0a370", "#c68642", "#8d5524", "#4a2c17"],
  eyeColors: ["#333", "#4a80c4", "#5a9a5a"],
  hairColors: ["#1a1a1a", "#6b3a2a", "#d4a844", "#ff6b6b", "#4ecdc4", "#45b7d1"],
  bgColors: ["#1a1b23", "#2d1b69", "#0a2463"],
  mouthColor: "#e06070",
  eyebrowColor: "#aaa",
  accessoryColor: "#888",
  eyeWhiteColor: "#e0e0e0",    // Sclera color (great for dark themes)
  noseColor: "#c68642aa",       // Nose color (defaults to skin + transparency)
  bgOpacity: 1,
  bgRadius: 999,
  border: { color: "#14F195", width: 2 },
};
```

### Extending Presets

```ts
import { getPresetTheme } from "solfaces/themes";

const myTheme = getPresetTheme("dark", {
  bgRadius: 999,
  border: { color: "#14F195", width: 1 },
});
```

### Per-Instance Color Overrides

Override any color on a specific avatar without changing the global theme:

```tsx
// React
<SolFace walletAddress="7xKXqR..." colorOverrides={{ hair: "#ff0000", bg: "#000" }} />

// String renderer
renderSolFaceSVG("7xKXqR...", {
  theme: darkTheme,
  colorOverrides: { skin: "#ffd5b0", eyes: "#00ff00", accessory: "#gold" },
});
```

Available override keys: `skin`, `eyes`, `hair`, `bg`, `mouth`, `eyebrow`, `accessory`, `nose`, `eyeWhite`.

---

## AI Agent Tools

SolFaces ships with structured tool definitions that let AI agents discover and use it as a skill — compatible with OpenAI function calling, Anthropic tool use, Vercel AI SDK, and MCP.

### Quick Setup

```ts
import { allToolsOpenAI, handleToolCall } from "solfaces/agent";

// Register tools with your AI framework
const tools = allToolsOpenAI();  // or allToolsAnthropic(), allToolsVercelAI()

// Handle tool calls
const result = await handleToolCall("generate_solface_svg", {
  wallet: "7xKXqR...",
  theme: "dark",
  size: 128,
});
```

### Available Tools

| Tool | Description |
|------|-------------|
| `generate_solface_svg` | Render SVG avatar from wallet address |
| `describe_solface` | Natural language description of an avatar |
| `get_solface_traits` | Raw trait data with labels and hash |
| `get_agent_identity` | System prompt snippet for AI agent identity |
| `list_solface_themes` | List available preset themes |

### MCP Server (Claude Code / Cursor)

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

### Framework Adapters

```ts
import {
  allToolsOpenAI,      // OpenAI function calling
  allToolsAnthropic,   // Claude / Anthropic tool use
  allToolsVercelAI,    // Vercel AI SDK
  allToolsMCP,         // Model Context Protocol
  handleToolCall,      // Universal dispatcher
} from "solfaces/agent";
```

### Skill File for AI Agents

SolFaces includes a comprehensive `skill.md` that teaches AI agents how to integrate, customize, and use SolFaces. Feed it to any agent (Claude, GPT, custom bots) as context:

- How to install and import for any platform
- React component usage with themes, animations, and styling
- Server-side rendering and API route patterns
- Custom theme creation to match any UI
- Bot integration (Discord, Telegram)
- All 5 tool definitions with parameters and usage guidance

---

## REST API Templates

Copy-paste route handlers for serving SolFaces as an image API. Full code in `src/api-templates.ts`.

### Endpoints Pattern

```
GET /api/solface/:wallet              → SVG image
GET /api/solface/:wallet?format=png   → PNG image
GET /api/solface/:wallet?format=json  → Traits + description JSON
```

Templates included for: **Next.js App Router**, **Express**, **Hono (Cloudflare Workers / Bun)**, **Telegram Bot (grammy)**, **Discord Bot (discord.js)**.

---

## Python Port

Full Python implementation with identical trait generation to JavaScript. Zero dependencies.

```python
from solfaces import generate_traits, render_svg, describe_appearance

traits = generate_traits("7xKXqR...")
svg = render_svg("7xKXqR...", size=256)
desc = describe_appearance("7xKXqR...")
prompt = agent_appearance_prompt("7xKXqR...", "Atlas")
```

### CLI

```bash
python solfaces.py 7xKXqR...                    # Print traits
python solfaces.py 7xKXqR... --svg              # Output SVG
python solfaces.py 7xKXqR... --json             # Output JSON
python solfaces.py 7xKXqR... --describe         # Natural language
python solfaces.py 7xKXqR... --svg --size 512   # Custom size
```

---

## CDN / Script Tag

For sites without a build step — Webflow, Notion embeds, plain HTML, WordPress.

```html
<script src="https://unpkg.com/solfaces/dist/solfaces.cdn.global.js"></script>

<!-- Data attributes auto-initialize -->
<div data-solface="7xKXqR..." data-solface-size="48"></div>
<div data-solface="DRpbCBMx..." data-solface-size="48" data-solface-theme="dark"></div>
<div data-solface="9WzDXwBb..." data-solface-blink="true"></div>

<!-- Global API available as window.SolFaces -->
<script>
  SolFaces.mount("#avatar", "7xKXqR...", { size: 64 });
  SolFaces.setImg("#pfp", "7xKXqR...");
  const svg = SolFaces.renderSVG("7xKXqR...");
  const desc = SolFaces.describe("7xKXqR...");
  const prompt = SolFaces.agentPrompt("7xKXqR...", "Atlas");
</script>
```

---

## API Reference

| Function | Returns | Description |
|----------|---------|-------------|
| `generateTraits(wallet, overrides?)` | `SolFaceTraits` | Deterministic traits from wallet |
| `renderSolFaceSVG(wallet, options?)` | `string` | Raw SVG markup |
| `renderSolFaceDataURI(wallet, options?)` | `string` | Data URI for `<img>` tags |
| `renderSolFaceBase64(wallet, options?)` | `string` | Base64 data URI |
| `renderSolFacePNG(wallet, options?)` | `Promise<Buffer>` | PNG buffer (Node) |
| `renderSolFacePNGBrowser(wallet, options?)` | `Promise<Blob>` | PNG blob (browser) |
| `describeAppearance(wallet, options?)` | `string` | Natural language description |
| `agentAppearancePrompt(wallet, name?)` | `string` | System prompt for AI agents |
| `solFaceAltText(wallet)` | `string` | Accessible alt text |
| `getTraitLabels(traits)` | `Record<string, string>` | Human-readable trait names |
| `traitHash(wallet)` | `string` | 8-char hex hash |
| `SOLFACE_TOOLS` | `SolFaceTool[]` | All 5 agent tool definitions |
| `handleToolCall(name, params)` | `Promise<unknown>` | Universal agent tool dispatcher |
| `allToolsOpenAI()` | `OpenAITool[]` | Tools in OpenAI format |
| `allToolsAnthropic()` | `AnthropicTool[]` | Tools in Anthropic format |
| `allToolsVercelAI()` | `Record<string, VercelAITool>` | Tools in Vercel AI SDK format |
| `allToolsMCP()` | `MCPTool[]` | Tools in MCP format |

### React Component Props

```tsx
<SolFace
  walletAddress="7xKXqR..."       // Required
  size={48}                         // Default: 64
  enableBlink={true}                // Default: false — or { duration: 2, delay: 0.5 }
  theme={darkTheme}                 // Optional theme
  traitOverrides={{ hairStyle: 0 }} // Pin specific traits
  colorOverrides={{ hair: "#ff0000" }} // Override individual colors
  className="my-avatar"             // CSS class
  style={{ borderRadius: "50%" }}   // Inline styles
  onClick={handleClick}             // All SVG props supported
/>
```

### Import Paths

| Path | Contents | React? |
|------|----------|--------|
| `solfaces` | Core + themes + describe + rasterize + agent tools | No |
| `solfaces/core` | Engine only | No |
| `solfaces/react` | React component | Yes |
| `solfaces/vanilla` | DOM helpers | No |
| `solfaces/themes` | Preset themes | No |
| `solfaces/agent` | AI agent tool definitions + framework adapters | No |
| `solfaces/cdn` | IIFE for `<script>` tags | No |

---

## Trait System

| Trait | Variants | Options |
|-------|----------|---------|
| Face Shape | 4 | Round, Square, Oval, Hexagon |
| Skin Color | 6 | Light → Dark (6 tones) |
| Eye Style | 8 | Round, Dots, Almond, Wide, Sleepy, Winking, Lashes, Narrow |
| Eye Color | 5 | Dark Brown, Blue, Green, Amber, Gray |
| Eyebrows | 5 | None, Thin, Thick, Arched, Angled |
| Nose | 4 | None, Dot, Triangle, Button |
| Mouth | 6 | Smile, Neutral, Grin, Open, Smirk, Wide Smile |
| Hair Style | 8 | Bald, Short, Spiky, Swept, Mohawk, Long, Bob, Buzz |
| Hair Color | 8 | Black, Brown, Blonde, Ginger, Neon Lime, Neon Blue, Solana Mint, Neon Magenta |
| Accessory | 6 | None (×2), Round Glasses, Square Glasses, Earring, Bandana |
| Background | 5 | Lime, Blue, Solana Mint, Sand, Red |

**Total unique combinations: ~221,184,000**

Algorithm: **djb2 hash** → **mulberry32 PRNG** → sequential trait sampling. Sub-millisecond. Deterministic across JS and Python.

---

## Architecture

```
solfaces/
├── src/
│   ├── core/
│   │   ├── traits.ts       # Types, palettes, theme system, trait generation
│   │   ├── renderer.ts     # SVG string renderer, data URI, base64
│   │   ├── describe.ts     # Natural language descriptions for AI agents
│   │   ├── rasterize.ts    # PNG output (sharp / resvg / canvas)
│   │   └── index.ts
│   ├── react/
│   │   ├── SolFace.tsx     # React component
│   │   └── index.ts
│   ├── vanilla/
│   │   └── index.ts        # mountSolFace, setSolFaceImg, autoInit
│   ├── themes/
│   │   ├── presets.ts      # 8 preset themes
│   │   └── index.ts
│   ├── agent/
│   │   ├── tools.ts        # 5 canonical tool definitions + handlers
│   │   ├── index.ts        # Format adapters (MCP, OpenAI, Anthropic, Vercel AI)
│   │   └── mcp-server.ts   # Standalone MCP server (npx solfaces)
│   ├── cdn.ts              # IIFE bundle for <script> tag
│   ├── api-templates.ts    # Copy-paste route handlers
│   └── index.ts
├── python/
│   └── solfaces.py         # Full Python port (zero deps)
├── package.json
└── tsup.config.ts
```

---

## License

MIT — use it anywhere, commercial or open source.

Built by [https://github.com/jorger3301](https://github.com/jorger3301)
