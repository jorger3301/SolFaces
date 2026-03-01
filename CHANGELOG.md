# Changelog

All notable changes to SolFaces will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] — 2026-02-28

### Added

- **Gradient-rich SVG rendering** — Skin-luminance-driven color derivation for cheeks, chin shadow, glow highlights, specular eye reflections, and natural lip/nose/ear colors.
- **Expanded trait space** — ~2.56 billion unique combinations (up from ~11 million in v1).
  - Skin tones: 6 → 10
  - Mouth styles: 6 → 8
  - Hair styles: 8 → 10
  - Hair colors: 8 → 10
  - Accessories: 6 → 10
  - Background colors: 5 → 10
- **11 built-in themes** — Default, Dark, Light, Mono, Flat, Transparent (universal), plus Pixel, Pixel Retro, Pixel Clean, Glass, Glass Dark (React-only).
- **Detail level system** — `full` (gradients, cheeks, specular — size ≥ 48px), `simplified` (flat shapes — size < 48px), `auto` (default, switches based on size).
- **AI agent identity system** — `describeAppearance()` generates natural language descriptions in 3 formats (paragraph, structured, compact) × 2 perspectives (first person, third person). `agentAppearancePrompt()` generates system prompt snippets. `solFaceAltText()` for accessibility.
- **Agent tool definitions** — 5 tools (`generate_solface_svg`, `describe_solface`, `get_solface_traits`, `get_agent_identity`, `list_solface_themes`) with JSON schemas compatible with OpenAI, Anthropic, Vercel AI, and MCP.
- **MCP server** — `npx solfaces-mcp` for Model Context Protocol integration.
- **Framework adapters** — `allToolsOpenAI()`, `allToolsAnthropic()`, `allToolsVercelAI()`, `allToolsMCP()` for plug-and-play agent integration.
- **Pixel art mode** — 3 React-only presets (`pixel`, `pixelRetro`, `pixelClean`) with customizable density, scanlines, grid overlay, and drop shadow.
- **Liquid glass mode** — 2 React-only presets (`glass`, `glassDark`) with CSS backdrop-blur, specular highlights, and rim lighting.
- **Flat rendering mode** — `flat: true` disables all SVG gradients for print, email clients, and minimal UIs.
- **Transparent background mode** — `bgOpacity: 0` for compositing over custom backgrounds.
- **Blink animation** — CSS-based eye blink with customizable duration and delay.
- **Color math utilities** — `hexToRgb`, `rgbToHex`, `darken`, `lighten`, `blend`, `luminance`, `deriveSkinColors`, `buzzOpacity`.
- **PNG rasterization** — `renderSolFacePNG()` for Node.js (via sharp or @resvg/resvg-js), `renderSolFacePNGBrowser()` and `renderSolFacePNGDataURL()` for browsers.
- **Vanilla JS helpers** — `mountSolFace()`, `setSolFaceImg()`, `autoInit()` for non-React environments.
- **CDN bundle** — `solfaces/cdn` for `<script>` tag usage with `window.SolFaces` global.
- **Python port** — Full parity implementation in `python/solfaces.py` with zero dependencies.
- **Subpath exports** — `solfaces/core`, `solfaces/react`, `solfaces/vanilla`, `solfaces/themes`, `solfaces/agent` for tree-shaking.
- **Per-instance color overrides** — `colorOverrides` with 9 keys: skin, eyes, hair, bg, mouth, eyebrow, accessory, nose, eyeWhite.
- **Earring suppression** — Earrings and stud earrings automatically hidden on long and bob hair styles to prevent visual conflicts.
- **Visual depth layers** — Ears and hair-back rendering behind the face for long, bob, and wavy hair styles.
- **Test suite** — 98 tests across 7 modules (traits, colors, renderer, describe, themes, agent tools, Python parity) with Vitest.
- **CI/CD** — GitHub Actions workflow running typecheck → build → test on Node 18, 20, and 22.

### Changed

- All faces render as squircle shape (faceShape trait still consumed by PRNG for backward-compatible ordering but all shapes render identically).
- Theme system redesigned with `SolFaceTheme` interface supporting 50+ customizable fields.
- React `<SolFace>` component expanded with pixel art, liquid glass, theme, blink, and detail level support.

### Breaking Changes

- **All faces change.** Trait ranges expanded, so every wallet generates a different face than in v1. There is no migration path — v2 faces are a fresh start.
- **Old themes removed.** `solana`, `neon`, `jupiter`, `phantom`, `circle` themes are gone. Use `dark`, `light`, `mono`, `flat`, `transparent`, or the new `glass`/`pixel` families.
- **New rendering engine.** Gradient-rich rendering with skin-luminance-driven colors replaces the flat SVG output from v1.
- **New theme fields.** `flat`, `cheekEnabled`, `shadowEnabled`, and React-only `_glass*`/`_pixel*` fields added to `SolFaceTheme`.
- **`colorOverrides` unchanged.** Per-instance color overrides work the same as v1 — no migration needed for this feature.
