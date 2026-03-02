"""
SOLFACES v2 — Python Port
Deterministic wallet avatar generation for Python backends, bots, and scripts.
Zero dependencies. Generates identical traits and SVG output to the TypeScript version.

Usage:
    from solfaces import generate_traits, render_svg, describe_appearance, derive_name

    traits = generate_traits("7xKXq...")
    svg = render_svg("7xKXq...", size=256)
    desc = describe_appearance("7xKXq...")
"""

from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Dict
import ctypes
import hashlib
import math
import struct


# ─── Types ────────────────────────────────────────────────────

@dataclass
class SolFaceTraits:
    face_shape: int   # 0-3 (consumed for PRNG ordering, all render as squircle)
    skin_color: int   # 0-9
    eye_style: int    # 0-7
    eye_color: int    # 0-4
    eyebrows: int     # 0-4
    nose: int         # 0-3
    mouth: int        # 0-7
    hair_style: int   # 0-9
    hair_color: int   # 0-9
    accessory: int    # 0-9
    bg_color: int     # 0-9

    def to_dict(self) -> Dict[str, int]:
        return {
            "faceShape": self.face_shape,
            "skinColor": self.skin_color,
            "eyeStyle": self.eye_style,
            "eyeColor": self.eye_color,
            "eyebrows": self.eyebrows,
            "nose": self.nose,
            "mouth": self.mouth,
            "hairStyle": self.hair_style,
            "hairColor": self.hair_color,
            "accessory": self.accessory,
            "bgColor": self.bg_color,
        }


# ─── Color Palettes ──────────────────────────────────────────

SKIN_COLORS = [
    "#faeae5", "#efd6c8", "#e4c5aa", "#d5b590", "#c59e77",
    "#b4875f", "#9d6d4d", "#805742", "#654134", "#4b2d25",
]
EYE_COLORS = ["#382414", "#3868A8", "#38784C", "#808838", "#586878"]
HAIR_COLORS = [
    "#1A1A24", "#4C3428", "#887058", "#D4B868", "#A84830",
    "#C0C0CC", "#484858", "#783850", "#D8B0A0", "#C08048",
]
BG_COLORS = [
    "#b98387", "#a9a360", "#9eb785", "#69ab79", "#81bbb0",
    "#6499af", "#7f8bbd", "#8869ab", "#b785b3", "#ab6984",
]


# ─── Color Math ──────────────────────────────────────────────

def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def rgb_to_hex(r: float, g: float, b: float) -> str:
    return "#{:02x}{:02x}{:02x}".format(
        max(0, min(255, round(r))),
        max(0, min(255, round(g))),
        max(0, min(255, round(b))),
    )


def darken(h: str, pct: float = 0.12) -> str:
    r, g, b = hex_to_rgb(h)
    return rgb_to_hex(r * (1 - pct), g * (1 - pct), b * (1 - pct))


def lighten(h: str, pct: float = 0.15) -> str:
    r, g, b = hex_to_rgb(h)
    return rgb_to_hex(r + (255 - r) * pct, g + (255 - g) * pct, b + (255 - b) * pct)


def blend(a: str, b: str, t: float = 0.5) -> str:
    r1, g1, b1 = hex_to_rgb(a)
    r2, g2, b2 = hex_to_rgb(b)
    return rgb_to_hex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)


def luminance(h: str) -> float:
    r, g, b = hex_to_rgb(h)
    return (r + g + b) / 3


def derive_skin_colors(skin: str) -> dict:
    sL = luminance(skin)
    is_dark = sL < 100

    skin_hi = lighten(skin, 0.10)
    skin_lo = darken(skin, 0.22)
    skin_mid = darken(skin, 0.05)

    sr, sg, sb = hex_to_rgb(skin)
    if sL > 120:
        r_b = 0.03 if sL > 180 else 0.06
        g_d = 0.30 if sL > 180 else 0.28
        b_d = 0.25 if sL > 180 else 0.22
        cheek_color = rgb_to_hex(
            min(255, sr + sr * r_b),
            max(0, sg - sg * g_d),
            max(0, sb - sb * b_d),
        )
    else:
        cheek_color = rgb_to_hex(min(255, sr + 50), max(0, sg - 10), max(0, sb - 5))

    cheek_opacity = 0.15 + 0.18 * (1 - min(1, sL / 240))

    lip_t = max(0, min(1, (sL - 60) / 180))
    lip_base = blend("#D89090", "#A83848", lip_t)
    mid_boost = 1 - abs(sL - 140) / 80
    lip_blend = (0.70 if is_dark else 0.62) + max(0, mid_boost) * 0.12
    lip_raw = blend(skin, lip_base, min(0.82, lip_blend))
    lr, lg, lb = hex_to_rgb(lip_raw)
    lip_d = abs(sr - lr) + abs(sg - lg) + abs(sb - lb)
    lip_color = blend(skin, lip_base, 0.78) if lip_d < 60 else lip_raw

    brow_color = lighten(skin, 0.35 if sL < 80 else 0.25) if is_dark else darken(skin, 0.55)
    nose_fill = lighten(skin, 0.20) if is_dark else darken(skin, 0.20)

    ear_t = max(0, min(1, (sL - 100) / 60))
    ear_fill = blend(lighten(skin, 0.08), skin_mid, ear_t)
    ear_shadow = darken(skin, 0.10 + 0.06 * (1 - min(1, sL / 160)))
    lid_color = lighten(skin, 0.18) if is_dark else darken(skin, 0.15)

    ew_t = max(0, min(1, (sL - 60) / 180))
    eye_white = blend("#EDE8E0", "#FBF8F2", ew_t)

    warmth = 0.3 if sL > 140 else (0.5 if sL > 100 else 0.7)
    acc_color = blend("#808890", blend(skin, "#B0A898", 0.3), warmth)

    return {
        "skin_hi": skin_hi, "skin_lo": skin_lo, "skin_mid": skin_mid,
        "is_dark": is_dark, "cheek_color": cheek_color, "cheek_opacity": cheek_opacity,
        "lip_color": lip_color, "nose_fill": nose_fill, "brow_color": brow_color,
        "ear_fill": ear_fill, "ear_shadow": ear_shadow,
        "eye_white": eye_white, "lid_color": lid_color, "acc_color": acc_color,
    }


def buzz_opacity(hair_col: str, skin: str) -> float:
    hr, hg, hb = hex_to_rgb(hair_col)
    sr, sg, sb = hex_to_rgb(skin)
    return 0.70 if abs(hr - sr) + abs(hg - sg) + abs(hb - sb) < 80 else 0.50


# ─── Hashing (djb2) — exact JS parity ────────────────────────

def _djb2(s: str) -> int:
    hash_val = 5381
    for ch in s:
        hash_val = ctypes.c_int32((hash_val << 5) + hash_val + ord(ch)).value
    return hash_val & 0xFFFFFFFF


# ─── PRNG (mulberry32) — exact JS parity ─────────────────────

def _mulberry32(seed: int):
    s = ctypes.c_int32(seed).value

    def next_val() -> float:
        nonlocal s
        s = ctypes.c_int32(s + 0x6D2B79F5).value
        a = (s ^ ((s & 0xFFFFFFFF) >> 15)) & 0xFFFFFFFF
        b = (1 | s) & 0xFFFFFFFF
        t = ctypes.c_int32(_imul(a, b)).value
        c = (t ^ ((t & 0xFFFFFFFF) >> 7)) & 0xFFFFFFFF
        d = (61 | t) & 0xFFFFFFFF
        old_t = t
        t = (ctypes.c_int32(old_t + _imul(c, d)).value) ^ old_t
        result = ((t ^ ((t & 0xFFFFFFFF) >> 14)) & 0xFFFFFFFF)
        return result / 4294967296

    return next_val


def _imul(a: int, b: int) -> int:
    a = a & 0xFFFFFFFF
    b = b & 0xFFFFFFFF
    result = (a * b) & 0xFFFFFFFF
    if result >= 0x80000000:
        result -= 0x100000000
    return result


# ─── Trait Generation ─────────────────────────────────────────

def generate_traits(wallet_address: str) -> SolFaceTraits:
    seed = _djb2(wallet_address)
    rand = _mulberry32(seed)

    # IMPORTANT: Order must NEVER change — shifts all downstream values.
    return SolFaceTraits(
        face_shape=int(rand() * 4),
        skin_color=int(rand() * 10),
        eye_style=int(rand() * 8),
        eye_color=int(rand() * 5),
        eyebrows=int(rand() * 5),
        nose=int(rand() * 4),
        mouth=int(rand() * 8),
        hair_style=int(rand() * 10),
        hair_color=int(rand() * 10),
        accessory=int(rand() * 10),
        bg_color=int(rand() * 10),
    )


def effective_accessory(t: SolFaceTraits) -> int:
    ai = t.accessory % 10
    hi = t.hair_style % 10
    if (ai == 4 or ai == 7) and (hi == 5 or hi == 6):
        return 0
    return ai


def trait_hash(wallet_address: str) -> str:
    return f"{_djb2(wallet_address):08x}"


# ─── Trait Labels ─────────────────────────────────────────────

SKIN_LABELS = ["Porcelain", "Ivory", "Fair", "Light", "Sand",
               "Golden", "Warm", "Caramel", "Brown", "Deep"]
EYE_STYLE_LABELS = ["Round", "Minimal", "Almond", "Wide", "Relaxed", "Joyful", "Bright", "Gentle"]
EYE_COLOR_LABELS = ["Chocolate", "Sky", "Emerald", "Hazel", "Storm"]
BROW_LABELS = ["Wispy", "Straight", "Natural", "Arched", "Angled"]
NOSE_LABELS = ["Shadow", "Button", "Soft", "Nostrils"]
MOUTH_LABELS = ["Smile", "Calm", "Happy", "Oh", "Smirk", "Grin", "Flat", "Pout"]
HAIR_STYLE_LABELS = ["Bald", "Short", "Curly", "Side Sweep", "Puff",
                     "Long", "Bob", "Buzz", "Wavy", "Topknot"]
HAIR_COLOR_LABELS = ["Black", "Espresso", "Walnut", "Honey", "Copper",
                     "Silver", "Charcoal", "Burgundy", "Strawberry", "Ginger"]
ACC_LABELS = ["None", "Beauty Mark", "Round Glasses", "Rect Glasses", "Earring",
              "Headband", "Freckles", "Stud Earrings", "Aviators", "Band-Aid"]
BG_COLOR_LABELS = ["Rose", "Olive", "Sage", "Fern", "Mint",
                   "Ocean", "Sky", "Lavender", "Orchid", "Blush"]


def get_trait_labels(t: SolFaceTraits) -> Dict[str, str]:
    ai = effective_accessory(t)
    return {
        "faceShape": "Squircle",
        "skinColor": SKIN_LABELS[t.skin_color] if t.skin_color < len(SKIN_LABELS) else "Fair",
        "eyeStyle": EYE_STYLE_LABELS[t.eye_style] if t.eye_style < len(EYE_STYLE_LABELS) else "Round",
        "eyeColor": EYE_COLOR_LABELS[t.eye_color] if t.eye_color < len(EYE_COLOR_LABELS) else "Chocolate",
        "eyebrows": BROW_LABELS[t.eyebrows] if t.eyebrows < len(BROW_LABELS) else "Wispy",
        "nose": NOSE_LABELS[t.nose] if t.nose < len(NOSE_LABELS) else "Shadow",
        "mouth": MOUTH_LABELS[t.mouth] if t.mouth < len(MOUTH_LABELS) else "Smile",
        "hairStyle": HAIR_STYLE_LABELS[t.hair_style] if t.hair_style < len(HAIR_STYLE_LABELS) else "Bald",
        "hairColor": HAIR_COLOR_LABELS[t.hair_color] if t.hair_color < len(HAIR_COLOR_LABELS) else "Black",
        "accessory": ACC_LABELS[ai] if ai < len(ACC_LABELS) else "None",
        "bgColor": BG_COLOR_LABELS[t.bg_color] if t.bg_color < len(BG_COLOR_LABELS) else "Rose",
    }


# ─── SVG Rendering ────────────────────────────────────────────

def _to_base36(n: int) -> str:
    if n == 0:
        return "0"
    chars = "0123456789abcdefghijklmnopqrstuvwxyz"
    result = ""
    while n > 0:
        result = chars[n % 36] + result
        n //= 36
    return result


def _build_defs(gid: str, skin: str, skin_hi: str, skin_lo: str,
                hair_col: str, bg_col: str, cheek_color: str,
                cheek_opacity: float, flat: bool, full: bool) -> str:
    if flat:
        return ""
    d = "<defs>"
    d += f'<linearGradient id="{gid}sg" x1="0" y1="0" x2="0" y2="1">'
    d += f'<stop offset="0%" stop-color="{skin_hi}"/>'
    d += f'<stop offset="100%" stop-color="{skin_lo}"/>'
    d += "</linearGradient>"
    d += f'<linearGradient id="{gid}hg" x1="0" y1="0" x2="0" y2="1">'
    d += f'<stop offset="0%" stop-color="{lighten(hair_col, 0.15)}"/>'
    d += f'<stop offset="100%" stop-color="{darken(hair_col, 0.15)}"/>'
    d += "</linearGradient>"
    d += f'<linearGradient id="{gid}bg" x1="0" y1="0" x2="1" y2="1">'
    d += f'<stop offset="0%" stop-color="{lighten(bg_col, 0.12)}"/>'
    d += f'<stop offset="100%" stop-color="{darken(bg_col, 0.12)}"/>'
    d += "</linearGradient>"
    if full:
        d += f'<radialGradient id="{gid}glow" cx="0.5" cy="0.28" r="0.45">'
        d += '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.10"/>'
        d += '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>'
        d += "</radialGradient>"
        d += f'<radialGradient id="{gid}chin" cx="0.5" cy="0.85" r="0.35">'
        d += f'<stop offset="0%" stop-color="{skin_lo}" stop-opacity="0.30"/>'
        d += f'<stop offset="100%" stop-color="{skin_lo}" stop-opacity="0"/>'
        d += "</radialGradient>"
        d += f'<radialGradient id="{gid}cL" cx="0.5" cy="0.5" r="0.5">'
        d += f'<stop offset="0%" stop-color="{cheek_color}" stop-opacity="{cheek_opacity:.2f}"/>'
        d += f'<stop offset="100%" stop-color="{cheek_color}" stop-opacity="0"/>'
        d += "</radialGradient>"
        d += f'<radialGradient id="{gid}cR" cx="0.5" cy="0.5" r="0.5">'
        d += f'<stop offset="0%" stop-color="{cheek_color}" stop-opacity="{cheek_opacity:.2f}"/>'
        d += f'<stop offset="100%" stop-color="{cheek_color}" stop-opacity="0"/>'
        d += "</radialGradient>"
    d += "</defs>"
    return d


def _render_hair_back(hi: int, gid: str, flat: bool) -> str:
    fill = "currentColor" if flat else f"url(#{gid}hg)"
    if hi == 5: return f'<rect x="10" y="14" width="44" height="42" rx="6" fill="{fill}"/>'
    if hi == 6: return f'<rect x="12" y="14" width="40" height="32" rx="8" fill="{fill}"/>'
    if hi == 8: return f'<rect x="11" y="14" width="42" height="38" rx="8" fill="{fill}"/>'
    return ""


def _render_ears(ear_fill: str, ear_shadow: str) -> str:
    return (
        f'<ellipse cx="11" cy="34" rx="4" ry="5" fill="{ear_fill}"/>'
        f'<ellipse cx="11" cy="34" rx="2.5" ry="3.5" fill="{ear_shadow}" opacity="0.3"/>'
        f'<ellipse cx="53" cy="34" rx="4" ry="5" fill="{ear_fill}"/>'
        f'<ellipse cx="53" cy="34" rx="2.5" ry="3.5" fill="{ear_shadow}" opacity="0.3"/>'
    )


def _render_face(gid: str, skin: str, flat: bool) -> str:
    fill = skin if flat else f"url(#{gid}sg)"
    return f'<rect x="14" y="16" width="36" height="38" rx="12" ry="12" fill="{fill}"/>'


def _render_face_overlays(gid: str) -> str:
    return (
        f'<rect x="14" y="16" width="36" height="38" rx="12" ry="12" fill="url(#{gid}glow)"/>'
        f'<rect x="14" y="16" width="36" height="38" rx="12" ry="12" fill="url(#{gid}chin)"/>'
        f'<ellipse cx="22" cy="42" rx="5" ry="3.5" fill="url(#{gid}cL)"/>'
        f'<ellipse cx="42" cy="42" rx="5" ry="3.5" fill="url(#{gid}cR)"/>'
        '<line x1="20" y1="50" x2="44" y2="50" stroke="currentColor" stroke-width="0.3" opacity="0.08" stroke-linecap="round"/>'
    )


def _render_hair_front(hi: int, gid: str, hair_col: str, skin: str, flat: bool) -> str:
    fill = hair_col if flat else f"url(#{gid}hg)"
    if hi == 0: return ""
    if hi == 1: return f'<path d="M14 28 Q14 14 32 12 Q50 14 50 28 L50 22 Q50 12 32 10 Q14 12 14 22 Z" fill="{fill}"/>'
    if hi == 2:
        return (f'<g fill="{fill}">'
                '<circle cx="20" cy="14" r="5"/><circle cx="28" cy="11" r="5.5"/>'
                '<circle cx="36" cy="11" r="5.5"/><circle cx="44" cy="14" r="5"/>'
                '<circle cx="16" cy="20" r="4"/><circle cx="48" cy="20" r="4"/></g>')
    if hi == 3:
        return (f'<path d="M14 26 Q14 12 32 10 Q50 12 50 26 L50 20 Q50 10 32 8 Q14 10 14 20 Z" fill="{fill}"/>'
                f'<path d="M14 20 Q8 16 10 8 Q14 10 20 16 Z" fill="{fill}"/>')
    if hi == 4: return f'<ellipse cx="32" cy="10" rx="14" ry="8" fill="{fill}"/>'
    if hi == 5: return f'<path d="M14 28 Q14 12 32 10 Q50 12 50 28 L50 20 Q50 10 32 8 Q14 10 14 20 Z" fill="{fill}"/>'
    if hi == 6:
        return (f'<path d="M14 28 Q14 12 32 10 Q50 12 50 28 L50 20 Q50 10 32 8 Q14 10 14 20 Z" fill="{fill}"/>'
                f'<rect x="10" y="28" width="8" height="14" rx="4" fill="{fill}"/>'
                f'<rect x="46" y="28" width="8" height="14" rx="4" fill="{fill}"/>')
    if hi == 7:
        bop = buzz_opacity(hair_col, skin)
        return f'<rect x="15" y="13" width="34" height="16" rx="10" ry="8" fill="{hair_col}" opacity="{bop:.2f}"/>'
    if hi == 8:
        return (f'<path d="M14 28 Q14 12 32 10 Q50 12 50 28 L50 20 Q50 10 32 8 Q14 10 14 20 Z" fill="{fill}"/>'
                f'<path d="M12 30 Q10 20 14 16" fill="none" stroke="{fill}" stroke-width="4" stroke-linecap="round"/>'
                f'<path d="M52 30 Q54 20 50 16" fill="none" stroke="{fill}" stroke-width="4" stroke-linecap="round"/>')
    if hi == 9:
        return (f'<path d="M14 28 Q14 14 32 12 Q50 14 50 28 L50 22 Q50 12 32 10 Q14 12 14 22 Z" fill="{fill}"/>'
                f'<ellipse cx="32" cy="6" rx="6" ry="5" fill="{fill}"/>')
    return ""


def _render_eyes(ei: int, eye_col: str, eye_white: str, lid_color: str, full: bool) -> str:
    lx, rx, y = 25, 39, 33
    s = ""
    if ei == 0:
        s += f'<circle cx="{lx}" cy="{y}" r="4" fill="{eye_white}"/><circle cx="{lx+0.8}" cy="{y}" r="2.2" fill="{eye_col}"/>'
        if full: s += f'<circle cx="{lx+1.5}" cy="{y-1}" r="0.7" fill="white" opacity="0.8"/>'
        s += f'<circle cx="{rx}" cy="{y}" r="4" fill="{eye_white}"/><circle cx="{rx+0.8}" cy="{y}" r="2.2" fill="{eye_col}"/>'
        if full: s += f'<circle cx="{rx+1.5}" cy="{y-1}" r="0.7" fill="white" opacity="0.8"/>'
    elif ei == 1:
        s += f'<circle cx="{lx}" cy="{y}" r="2" fill="{eye_col}"/><circle cx="{rx}" cy="{y}" r="2" fill="{eye_col}"/>'
    elif ei == 2:
        s += f'<ellipse cx="{lx}" cy="{y}" rx="4.5" ry="2.8" fill="{eye_white}"/><circle cx="{lx+0.5}" cy="{y}" r="1.8" fill="{eye_col}"/>'
        if full: s += f'<circle cx="{lx+1.2}" cy="{y-0.8}" r="0.6" fill="white" opacity="0.7"/>'
        s += f'<ellipse cx="{rx}" cy="{y}" rx="4.5" ry="2.8" fill="{eye_white}"/><circle cx="{rx+0.5}" cy="{y}" r="1.8" fill="{eye_col}"/>'
        if full: s += f'<circle cx="{rx+1.2}" cy="{y-0.8}" r="0.6" fill="white" opacity="0.7"/>'
    elif ei == 3:
        s += f'<circle cx="{lx}" cy="{y}" r="5" fill="{eye_white}"/><circle cx="{lx}" cy="{y+0.5}" r="2.8" fill="{eye_col}"/>'
        if full: s += f'<circle cx="{lx+1.5}" cy="{y-1}" r="0.8" fill="white" opacity="0.8"/>'
        s += f'<circle cx="{rx}" cy="{y}" r="5" fill="{eye_white}"/><circle cx="{rx}" cy="{y+0.5}" r="2.8" fill="{eye_col}"/>'
        if full: s += f'<circle cx="{rx+1.5}" cy="{y-1}" r="0.8" fill="white" opacity="0.8"/>'
    elif ei == 4:
        s += f'<ellipse cx="{lx}" cy="{y+1}" rx="4" ry="2.2" fill="{eye_white}"/><circle cx="{lx}" cy="{y+1}" r="1.5" fill="{eye_col}"/>'
        if full: s += f'<line x1="{lx-4.5}" y1="{y-0.5}" x2="{lx+4.5}" y2="{y-0.5}" stroke="{lid_color}" stroke-width="0.8" stroke-linecap="round"/>'
        s += f'<ellipse cx="{rx}" cy="{y+1}" rx="4" ry="2.2" fill="{eye_white}"/><circle cx="{rx}" cy="{y+1}" r="1.5" fill="{eye_col}"/>'
        if full: s += f'<line x1="{rx-4.5}" y1="{y-0.5}" x2="{rx+4.5}" y2="{y-0.5}" stroke="{lid_color}" stroke-width="0.8" stroke-linecap="round"/>'
    elif ei == 5:
        s += f'<path d="M{lx-4} {y} Q{lx} {y+4} {lx+4} {y}" fill="none" stroke="{eye_col}" stroke-width="1.8" stroke-linecap="round"/>'
        s += f'<path d="M{rx-4} {y} Q{rx} {y+4} {rx+4} {y}" fill="none" stroke="{eye_col}" stroke-width="1.8" stroke-linecap="round"/>'
    elif ei == 6:
        s += f'<circle cx="{lx}" cy="{y}" r="3.5" fill="{eye_white}"/><circle cx="{lx+0.5}" cy="{y}" r="2" fill="{eye_col}"/>'
        s += f'<circle cx="{lx+1.5}" cy="{y-1}" r="1" fill="white" opacity="0.9"/>'
        if full:
            s += f'<line x1="{lx+2.5}" y1="{y-3.5}" x2="{lx+4}" y2="{y-5}" stroke="{eye_col}" stroke-width="0.8" stroke-linecap="round"/>'
            s += f'<line x1="{lx+3.5}" y1="{y-2.5}" x2="{lx+5}" y2="{y-3.5}" stroke="{eye_col}" stroke-width="0.8" stroke-linecap="round"/>'
        s += f'<circle cx="{rx}" cy="{y}" r="3.5" fill="{eye_white}"/><circle cx="{rx+0.5}" cy="{y}" r="2" fill="{eye_col}"/>'
        s += f'<circle cx="{rx+1.5}" cy="{y-1}" r="1" fill="white" opacity="0.9"/>'
        if full:
            s += f'<line x1="{rx+2.5}" y1="{y-3.5}" x2="{rx+4}" y2="{y-5}" stroke="{eye_col}" stroke-width="0.8" stroke-linecap="round"/>'
            s += f'<line x1="{rx+3.5}" y1="{y-2.5}" x2="{rx+5}" y2="{y-3.5}" stroke="{eye_col}" stroke-width="0.8" stroke-linecap="round"/>'
    elif ei == 7:
        s += f'<ellipse cx="{lx}" cy="{y}" rx="4.5" ry="1.5" fill="{eye_white}"/><ellipse cx="{lx+0.5}" cy="{y}" rx="2.2" ry="1.2" fill="{eye_col}"/>'
        s += f'<ellipse cx="{rx}" cy="{y}" rx="4.5" ry="1.5" fill="{eye_white}"/><ellipse cx="{rx+0.5}" cy="{y}" rx="2.2" ry="1.2" fill="{eye_col}"/>'
    else:
        s += f'<circle cx="{lx}" cy="{y}" r="3.5" fill="{eye_white}"/><circle cx="{lx+0.8}" cy="{y}" r="2" fill="{eye_col}"/>'
        s += f'<circle cx="{rx}" cy="{y}" r="3.5" fill="{eye_white}"/><circle cx="{rx+0.8}" cy="{y}" r="2" fill="{eye_col}"/>'

    if full and ei not in (1, 5):
        s += f'<path d="M{lx-4} {y-1.5} Q{lx} {y-4} {lx+4} {y-1.5}" fill="none" stroke="{lid_color}" stroke-width="0.5" opacity="0.4"/>'
        s += f'<path d="M{rx-4} {y-1.5} Q{rx} {y-4} {rx+4} {y-1.5}" fill="none" stroke="{lid_color}" stroke-width="0.5" opacity="0.4"/>'
    return s


def _render_eyebrows(bi: int, brow_color: str) -> str:
    lx, rx, y = 25, 39, 27
    if bi == 0:
        return (f'<line x1="{lx-3}" y1="{y}" x2="{lx+3}" y2="{y-0.5}" stroke="{brow_color}" stroke-width="0.7" stroke-linecap="round"/>'
                f'<line x1="{rx-3}" y1="{y-0.5}" x2="{rx+3}" y2="{y}" stroke="{brow_color}" stroke-width="0.7" stroke-linecap="round"/>')
    if bi == 1:
        return (f'<line x1="{lx-3.5}" y1="{y}" x2="{lx+3.5}" y2="{y}" stroke="{brow_color}" stroke-width="1.2" stroke-linecap="round"/>'
                f'<line x1="{rx-3.5}" y1="{y}" x2="{rx+3.5}" y2="{y}" stroke="{brow_color}" stroke-width="1.2" stroke-linecap="round"/>')
    if bi == 2:
        return (f'<path d="M{lx-3.5} {y+0.5} Q{lx} {y-1.5} {lx+3.5} {y+0.5}" fill="none" stroke="{brow_color}" stroke-width="1.2" stroke-linecap="round"/>'
                f'<path d="M{rx-3.5} {y+0.5} Q{rx} {y-1.5} {rx+3.5} {y+0.5}" fill="none" stroke="{brow_color}" stroke-width="1.2" stroke-linecap="round"/>')
    if bi == 3:
        return (f'<path d="M{lx-4} {y+1} Q{lx} {y-3} {lx+4} {y+1}" fill="none" stroke="{brow_color}" stroke-width="1" stroke-linecap="round"/>'
                f'<path d="M{rx-4} {y+1} Q{rx} {y-3} {rx+4} {y+1}" fill="none" stroke="{brow_color}" stroke-width="1" stroke-linecap="round"/>')
    if bi == 4:
        return (f'<polyline points="{lx-3},{y+1} {lx},{y-2} {lx+3},{y}" fill="none" stroke="{brow_color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>'
                f'<polyline points="{rx-3},{y} {rx},{y-2} {rx+3},{y+1}" fill="none" stroke="{brow_color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>')
    return ""


def _render_nose(ni: int, nose_fill: str) -> str:
    cx, y = 32, 39
    if ni == 0: return f'<ellipse cx="{cx}" cy="{y}" rx="2" ry="1.2" fill="{nose_fill}" opacity="0.35"/>'
    if ni == 1: return f'<circle cx="{cx}" cy="{y}" r="1.8" fill="{nose_fill}" opacity="0.5"/>'
    if ni == 2: return f'<path d="M{cx-2} {y+1} Q{cx} {y-2} {cx+2} {y+1}" fill="none" stroke="{nose_fill}" stroke-width="1" stroke-linecap="round" opacity="0.5"/>'
    if ni == 3: return f'<circle cx="{cx-1.8}" cy="{y}" r="1.2" fill="{nose_fill}" opacity="0.4"/><circle cx="{cx+1.8}" cy="{y}" r="1.2" fill="{nose_fill}" opacity="0.4"/>'
    return f'<ellipse cx="{cx}" cy="{y}" rx="2" ry="1.2" fill="{nose_fill}" opacity="0.35"/>'


def _render_mouth(mi: int, lip_color: str, is_dark: bool) -> str:
    cx, y = 32, 45
    tc = "#e8e0d8" if is_dark else "#ffffff"
    if mi == 0: return f'<path d="M{cx-4} {y} Q{cx} {y+4} {cx+4} {y}" fill="none" stroke="{lip_color}" stroke-width="1.4" stroke-linecap="round"/>'
    if mi == 1: return f'<line x1="{cx-3}" y1="{y+1}" x2="{cx+3}" y2="{y+1}" stroke="{lip_color}" stroke-width="1.2" stroke-linecap="round"/>'
    if mi == 2: return f'<path d="M{cx-5} {y} Q{cx} {y+5} {cx+5} {y}" fill="none" stroke="{lip_color}" stroke-width="1.5" stroke-linecap="round"/>'
    if mi == 3: return f'<ellipse cx="{cx}" cy="{y+1}" rx="2.5" ry="3" fill="{lip_color}" opacity="0.7"/>'
    if mi == 4: return f'<path d="M{cx-4} {y+1} Q{cx+1} {y+1} {cx+4} {y-1.5}" fill="none" stroke="{lip_color}" stroke-width="1.3" stroke-linecap="round"/>'
    if mi == 5:
        return (f'<path d="M{cx-5} {y} Q{cx} {y+6} {cx+5} {y}" fill="{tc}" stroke="{lip_color}" stroke-width="1"/>'
                f'<line x1="{cx-4}" y1="{y+1.5}" x2="{cx+4}" y2="{y+1.5}" stroke="{lip_color}" stroke-width="0.3" opacity="0.3"/>')
    if mi == 6: return f'<line x1="{cx-4}" y1="{y+1}" x2="{cx+4}" y2="{y+1}" stroke="{lip_color}" stroke-width="1.5" stroke-linecap="round"/>'
    if mi == 7:
        return (f'<ellipse cx="{cx}" cy="{y+1}" rx="3.5" ry="2" fill="{lip_color}" opacity="0.25"/>'
                f'<path d="M{cx-3} {y} Q{cx} {y+2.5} {cx+3} {y}" fill="none" stroke="{lip_color}" stroke-width="1.2" stroke-linecap="round"/>')
    return f'<path d="M{cx-4} {y} Q{cx} {y+4} {cx+4} {y}" fill="none" stroke="{lip_color}" stroke-width="1.4" stroke-linecap="round"/>'


def _render_accessory(ai: int, acc_color: str, glasses_color: str, earring_color: str, headband_color: str) -> str:
    if ai == 0: return ""
    if ai == 1: return '<circle cx="40" cy="44" r="0.8" fill="#3a2a2a"/>'
    if ai == 2:
        return (f'<g fill="none" stroke="{glasses_color}" stroke-width="1">'
                '<circle cx="25" cy="33" r="5.5"/><circle cx="39" cy="33" r="5.5"/>'
                '<line x1="30.5" y1="33" x2="33.5" y2="33"/>'
                '<line x1="19.5" y1="33" x2="14" y2="31"/>'
                '<line x1="44.5" y1="33" x2="50" y2="31"/></g>')
    if ai == 3:
        return (f'<g fill="none" stroke="{glasses_color}" stroke-width="1">'
                '<rect x="19" y="29" width="12" height="8" rx="1.5"/>'
                '<rect x="33" y="29" width="12" height="8" rx="1.5"/>'
                '<line x1="31" y1="33" x2="33" y2="33"/>'
                '<line x1="19" y1="33" x2="14" y2="31"/>'
                '<line x1="45" y1="33" x2="50" y2="31"/></g>')
    if ai == 4:
        return (f'<circle cx="10" cy="38" r="1.5" fill="{earring_color}"/>'
                f'<circle cx="10" cy="41" r="2" fill="{earring_color}" opacity="0.8"/>')
    if ai == 5:
        return f'<rect x="13" y="20" width="38" height="3.5" rx="1.5" fill="{headband_color}" opacity="0.85"/>'
    if ai == 6:
        return ('<g fill="#a0785a" opacity="0.35">'
                '<circle cx="21" cy="40" r="0.6"/><circle cx="23" cy="42" r="0.5"/>'
                '<circle cx="19" cy="41.5" r="0.5"/><circle cx="43" cy="40" r="0.6"/>'
                '<circle cx="41" cy="42" r="0.5"/><circle cx="45" cy="41.5" r="0.5"/></g>')
    if ai == 7:
        return (f'<circle cx="10" cy="37" r="1.2" fill="{earring_color}"/>'
                f'<circle cx="54" cy="37" r="1.2" fill="{earring_color}"/>')
    if ai == 8:
        return (f'<g fill="none" stroke="{glasses_color}" stroke-width="1.2">'
                f'<path d="M19 30 Q19 28 25 28 Q31 28 31 33 Q31 38 25 38 Q19 38 19 33 Z" fill="{glasses_color}" fill-opacity="0.15"/>'
                f'<path d="M33 30 Q33 28 39 28 Q45 28 45 33 Q45 38 39 38 Q33 38 33 33 Z" fill="{glasses_color}" fill-opacity="0.15"/>'
                '<line x1="31" y1="32" x2="33" y2="32"/>'
                '<line x1="19" y1="31" x2="14" y2="29"/>'
                '<line x1="45" y1="31" x2="50" y2="29"/></g>')
    if ai == 9:
        return ('<g>'
                '<rect x="38" y="38" width="8" height="4" rx="1" fill="#f0d0a0" transform="rotate(-15 42 40)"/>'
                '<line x1="40" y1="39" x2="40" y2="41" stroke="#c0a080" stroke-width="0.4" transform="rotate(-15 42 40)"/>'
                '<line x1="42" y1="39" x2="42" y2="41" stroke="#c0a080" stroke-width="0.4" transform="rotate(-15 42 40)"/>'
                '<line x1="44" y1="39" x2="44" y2="41" stroke="#c0a080" stroke-width="0.4" transform="rotate(-15 42 40)"/></g>')
    return ""


def render_svg(
    wallet_address: str,
    size: int = 64,
    flat: bool = False,
    detail: str = "auto",
) -> str:
    t = generate_traits(wallet_address)

    full = detail == "full" or (detail == "auto" and size >= 48)
    skin = SKIN_COLORS[t.skin_color % len(SKIN_COLORS)]
    eye_col = EYE_COLORS[t.eye_color % len(EYE_COLORS)]
    hair_col = HAIR_COLORS[t.hair_color % len(HAIR_COLORS)]
    bg_col = BG_COLORS[t.bg_color % len(BG_COLORS)]

    derived = derive_skin_colors(skin)
    gid = "sf" + _to_base36(_djb2(wallet_address))

    hi = t.hair_style % 10
    ai = effective_accessory(t)

    glasses_color = "#4a4a5a"
    earring_color = blend(skin, "#d4a840", 0.4)
    headband_color = blend(hair_col, "#c04040", 0.5)

    bg_fill = bg_col if flat else f"url(#{gid}bg)"

    parts = []
    parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="{size}" height="{size}">')
    parts.append(_build_defs(gid, skin, derived["skin_hi"], derived["skin_lo"],
                             hair_col, bg_col, derived["cheek_color"],
                             derived["cheek_opacity"], flat, full))
    parts.append(f'<rect x="0" y="0" width="64" height="64" fill="{bg_fill}" opacity="1" rx="4"/>')
    parts.append(_render_hair_back(hi, gid, flat))
    parts.append(_render_ears(derived["ear_fill"], derived["ear_shadow"]))
    parts.append(_render_face(gid, skin, flat))
    if full:
        parts.append(_render_face_overlays(gid))
    if ai == 5:
        parts.append(_render_accessory(5, derived["acc_color"], glasses_color, earring_color, headband_color))
    parts.append(_render_hair_front(hi, gid, hair_col, skin, flat))
    parts.append(_render_eyes(t.eye_style % 8, eye_col, derived["eye_white"], derived["lid_color"], full))
    parts.append(_render_eyebrows(t.eyebrows % 5, derived["brow_color"]))
    parts.append(_render_nose(t.nose % 4, derived["nose_fill"]))
    parts.append(_render_mouth(t.mouth % 8, derived["lip_color"], derived["is_dark"]))
    if ai != 0 and ai != 5:
        parts.append(_render_accessory(ai, derived["acc_color"], glasses_color, earring_color, headband_color))
    parts.append("</svg>")
    return "".join(p for p in parts if p)


def render_data_uri(wallet_address: str, **kwargs) -> str:
    from urllib.parse import quote
    svg = render_svg(wallet_address, **kwargs)
    return f"data:image/svg+xml;charset=utf-8,{quote(svg)}"


# ─── Description ──────────────────────────────────────────────

_SKIN_DESC = {0: "porcelain", 1: "ivory", 2: "fair", 3: "light", 4: "sand",
              5: "golden", 6: "warm", 7: "caramel", 8: "brown", 9: "deep"}
_EYE_STYLE_DESC = {0: "round, wide-open", 1: "small and minimal", 2: "almond-shaped",
                   3: "wide and expressive", 4: "relaxed, half-lidded", 5: "joyful, crescent-shaped",
                   6: "bright and sparkling", 7: "gentle and narrow"}
_EYE_COLOR_DESC = {0: "dark brown", 1: "blue", 2: "green", 3: "hazel", 4: "gray"}
_BROW_DESC = {0: "wispy", 1: "straight", 2: "natural", 3: "elegantly arched", 4: "sharply angled"}
_NOSE_DESC = {0: "a subtle shadow nose", 1: "a small button nose", 2: "a soft curved nose",
              3: "a button nose with visible nostrils"}
_MOUTH_DESC = {0: "a gentle smile", 1: "a calm, neutral expression", 2: "a happy grin",
               3: "a surprised O-shaped mouth", 4: "a confident smirk", 5: "a wide, toothy grin",
               6: "a flat, straight expression", 7: "a soft pout"}
_HAIR_STYLE_DESC = {0: "bald, with no hair", 1: "short, neatly cropped hair", 2: "bouncy, curly hair",
                    3: "side-swept hair", 4: "a voluminous puff",
                    5: "long hair that falls past the shoulders", 6: "a clean bob cut",
                    7: "a close buzz cut", 8: "flowing, wavy hair", 9: "a neat topknot"}
_HAIR_COLOR_DESC = {0: "jet black", 1: "espresso brown", 2: "walnut", 3: "honey blonde",
                    4: "copper red", 5: "silver", 6: "charcoal", 7: "burgundy",
                    8: "strawberry", 9: "ginger"}
_ACC_DESC = {0: "", 1: "a beauty mark", 2: "round glasses", 3: "rectangular glasses",
             4: "a dangling earring", 5: "a headband", 6: "freckles", 7: "stud earrings",
             8: "aviator sunglasses", 9: "a band-aid"}
_BG_DESC = {0: "rose", 1: "olive", 2: "sage", 3: "fern", 4: "mint",
            5: "ocean", 6: "sky", 7: "lavender", 8: "orchid", 9: "blush"}


def _build_paragraph(
    t, ai: int,
    perspective: str = "third",
    name: Optional[str] = None,
    include_background: bool = True,
) -> str:
    if perspective == "first":
        subj = f"I'm {name}. I have" if name else "I have"
        im = "I'm"
    else:
        subj = f"{name} has" if name else "This SolFace has"
        im = "They're"

    parts = []
    parts.append(f"{subj} a squircle face with {_SKIN_DESC.get(t.skin_color, 'warm')} skin")

    eye_s = _EYE_STYLE_DESC.get(t.eye_style, "round")
    eye_c = _EYE_COLOR_DESC.get(t.eye_color, "dark")
    parts.append(f"{eye_s} {eye_c} eyes")

    brows = _BROW_DESC.get(t.eyebrows, "")
    if brows:
        parts.append(f"{brows} eyebrows")

    if t.hair_style == 0:
        parts.append("and am bald" if perspective == "first" else "and is bald")
    else:
        hc = _HAIR_COLOR_DESC.get(t.hair_color, "")
        hs = _HAIR_STYLE_DESC.get(t.hair_style, "")
        if hs.startswith("a "):
            parts.append(f"and a {hc} {hs[2:]}")
        else:
            parts.append(f"and {hc} {hs}")

    desc = parts[0]
    if len(parts) > 2:
        desc += ", " + ", ".join(parts[1:-1]) + ", " + parts[-1]
    elif len(parts) == 2:
        desc += " and " + parts[1]
    desc += "."

    nose = _NOSE_DESC.get(t.nose, "")
    if nose:
        nose_subj = "I have" if perspective == "first" else (f"{name} has" if name else "They have")
        desc += f" {nose_subj} {nose}."

    acc = _ACC_DESC.get(ai, "")
    if acc:
        desc += f" {im} wearing {acc}."

    mouth = _MOUTH_DESC.get(t.mouth, "a smile")
    mouth_subj = "I have" if perspective == "first" else (f"{name} has" if name else "They have")
    desc += f" {mouth_subj} {mouth}."

    if include_background:
        bg = _BG_DESC.get(t.bg_color, "colorful")
        desc += f" The background is {bg}."

    return desc


def _build_structured(t, ai: int, include_background: bool = True) -> str:
    lines = [
        "Face: squircle",
        f"Skin: {_SKIN_DESC.get(t.skin_color, 'warm')}",
        f"Eyes: {_EYE_STYLE_DESC.get(t.eye_style, 'round')}, {_EYE_COLOR_DESC.get(t.eye_color, 'dark')}",
        f"Eyebrows: {_BROW_DESC.get(t.eyebrows, 'wispy')}",
    ]
    nose = _NOSE_DESC.get(t.nose, "")
    if nose:
        lines.append(f"Nose: {nose.lstrip('a ')}")
    lines.append(f"Mouth: {_MOUTH_DESC.get(t.mouth, 'smile')}")
    if t.hair_style == 0:
        lines.append("Hair: bald")
    else:
        hs = _HAIR_STYLE_DESC.get(t.hair_style, "")
        hc = _HAIR_COLOR_DESC.get(t.hair_color, "")
        lines.append(f"Hair: {hc} {hs[2:] if hs.startswith('a ') else hs}")
    acc = _ACC_DESC.get(ai, "")
    if acc:
        lines.append(f"Accessory: {acc}")
    if include_background:
        lines.append(f"Background: {_BG_DESC.get(t.bg_color, 'colorful')}")
    return "\n".join(lines)


def _build_compact(t, ai: int) -> str:
    parts = []
    parts.append("squircle face")
    parts.append(f"{_SKIN_DESC.get(t.skin_color, 'warm')} skin")
    parts.append(f"{_EYE_COLOR_DESC.get(t.eye_color, 'dark')} {_EYE_STYLE_DESC.get(t.eye_style, 'round')} eyes")
    if t.hair_style == 0:
        parts.append("bald")
    else:
        raw = _HAIR_STYLE_DESC.get(t.hair_style, "hair")
        hs = raw.split(",")[-1].strip() if "," in raw else raw
        hc = _HAIR_COLOR_DESC.get(t.hair_color, "")
        parts.append(f"{hc} {hs[2:] if hs.startswith('a ') else hs}")
    acc = _ACC_DESC.get(ai, "")
    if acc:
        parts.append(acc)
    mouth = _MOUTH_DESC.get(t.mouth, "smiling")
    if mouth.startswith("a "):
        mouth = mouth[2:]
    parts.append(mouth)
    return ", ".join(parts)


def describe_appearance(
    wallet_address: str,
    format: str = "paragraph",
    perspective: str = "third",
    name: Optional[str] = None,
    include_background: bool = True,
) -> str:
    t = generate_traits(wallet_address)
    ai = effective_accessory(t)
    if format == "structured":
        return _build_structured(t, ai, include_background)
    if format == "compact":
        return _build_compact(t, ai)
    return _build_paragraph(t, ai, perspective, name, include_background)


def sol_face_alt_text(wallet_address: str) -> str:
    return f"SolFace avatar: {describe_appearance(wallet_address, format='compact', include_background=False)}"


def agent_appearance_prompt(wallet_address: str, agent_name: Optional[str] = None) -> str:
    desc = describe_appearance(wallet_address, perspective="first", name=agent_name, include_background=False)
    h = trait_hash(wallet_address)
    return f"My visual identity is a SolFace avatar (ID: {h}) derived from my wallet address. {desc} This appearance is deterministic — anyone who looks up my wallet will see the same face."



# ─── SolNames v1 — Deterministic Name Derivation ────────────────

SOLNAMES_VERSION = "v1"

ADJECTIVES = [
    "Frost","Solar","Coral","Amber","Mossy","Lunar","Misty","Alpine","Autumn","Breeze",
    "Cerulean","Cloudy","Cosmic","Crystal","Dewy","Dusty","Earthy","Floral","Forest","Frozen",
    "Glacial","Golden","Grassy","Harbor","Ivory","Jasmine","Lagoon","Leafy","Lush","Marine",
    "Meadow","Mineral","Mosaic","Nectar","Nordic","Oceanic","Orchid","Pearly","Petal","Polar",
    "Prairie","Rain","River","Rocky","Sandy","Savanna","Shore","Sierra","Snowy","Spring",
    "Starry","Stone","Summer","Sunset","Tidal","Timber","Tropic","Tundra","Valley","Verdant",
    "Winding","Winter","Woody","Bloom","Blossom","Brook","Canyon","Cedar","Cloud","Comet",
    "Copper","Dawn","Delta","Dune","Eclipse","Fern","Flame","Flora","Glade","Azure",
    "Cobalt","Crimson","Indigo","Scarlet","Sapphire","Emerald","Ruby","Garnet","Onyx","Jade",
    "Turquoise","Magenta","Plum","Russet","Tawny","Burnt","Gilded","Platinum","Bronze","Chrome",
    "Pearl","Opal","Blush","Rosy","Dusky","Inky","Ashen","Cream","Slate","Charcoal",
    "Steel","Pewter","Honey","Saffron","Citrus","Lemon","Tangerine","Peach","Apricot","Vermilion",
    "Mauve","Lilac","Periwinkle","Cerise","Maroon","Burgundy","Wine","Berry","Cherry","Mint",
    "Olive","Teal","Navy","Cyan","Neon","Pastel","Muted","Lustrous","Gleaming","Glossy",
    "Shining","Glowing","Luminous","Brilliant","Sparkling","Shimmering","Iridescent","Prismatic","Spectral","Twilight",
    "Sunrise","Sunlit","Moonlit","Starlit","Candlelit","Firelit","Sunbeam","Afterglow","Halo","Flicker",
    "Glow","Ray","Beam","Blaze","Glint","Spark","Arc","Prism","Spectrum","Rainbow",
    "Aurora","Nebula","Stellar","Astral","Lucent","Frosted","Swift","Bold","Keen","Brave",
    "Noble","Serene","Fierce","Gentle","Agile","Alert","Astute","Candid","Clever","Daring",
    "Eager","Earnest","Fair","Gallant","Graceful","Hardy","Honest","Humble","Jovial","Joyful",
    "Kind","Loyal","Merry","Mindful","Nimble","Patient","Plucky","Proud","Quick","Ready",
    "Resilient","Savvy","Sincere","Skilled","Steady","Stout","Strong","Sure","Tender","True",
    "Valiant","Willing","Wise","Witty","Worthy","Zealous","Active","Adept","Ardent","Avid",
    "Benign","Bright","Civil","Clean","Clear","Composed","Content","Courtly","Crafty","Curious",
    "Decent","Devout","Diligent","Direct","Driven","Dynamic","Elegant","Elite","Even","Exact",
    "Famed","Fervent","Fine","Firm","Fit","Fluid","Focal","Fond","Frank","Free",
    "Fresh","Friendly","Frugal","Gifted","Glad","Grand","Great","Green","Grounded","Hale",
    "Happy","Hearty","Heroic","Ideal","Infinite","Inner","Intact","Intent","Just","Lively",
    "Lucky","Major","Mellow","Mighty","Modest","Natural","Neat","Optimal","Original","Pacific",
    "Peaceful","Pious","Pleased","Poised","Polite","Popular","Potent","Precious","Premier","Prime",
    "Proper","Proven","Pure","Quiet","Rapid","Rare","Real","Regal","Rich","Rising",
    "Robust","Royal","Sacred","Safe","Scenic","Secure","Senior","Sharp","Simple","Smart",
    "Smooth","Snug","Social","Solid","Sound","Special","Stable","Stately","Still","Super",
    "Supreme","Sweet","Thorough","Tidy","Top","Total","Tough","Trim","Trusted","Ultimate",
    "Unique","United","Upper","Useful","Valid","Valued","Varied","Vital","Vivid","Vocal",
    "Whole","Wide","Young","Zesty","Iron","Gold","Silver","Marble","Granite","Velvet",
    "Satin","Silk","Linen","Cotton","Suede","Denim","Canvas","Leather","Wooden","Bamboo",
    "Wicker","Woven","Braided","Knit","Lace","Mesh","Fiber","Glass","Mirror","Diamond",
    "Flint","Basalt","Obsidian","Chalk","Clay","Gravel","Pebble","Cobble","Brick","Tile",
    "Resin","Fossil","Shell","Bone","Feather","Plush","Brushed","Polished","Hammered","Forged",
    "Cast","Molten","Tempered","Etched","Carved","Sculpted","Spun","Pressed","Rolled","Folded",
    "Layered","Stacked","Ribbed","Matte","Lacquered","Enameled","Glazed","Painted","Dyed","Stained",
    "Refined","Distilled","Purified","Filtered","Alloyed","Plated","Coated","Sealed","Bonded","Fused",
    "Welded","Riveted","Textured","Grained","Veined","Flecked","Speckled","Dappled","Streaked","Banded",
    "Striped","Checkered","Waxed","Oiled","Cured","Tanned","Smoked","Burnished","Antiqued","Patina",
    "Weathered","Aged","Rustic","Hewn","Vast","Broad","Deep","High","Tall","Giant",
    "Colossal","Massive","Immense","Boundless","Endless","Sweeping","Spanning","Extended","Towering","Soaring",
    "Lofty","Elevated","Raised","Summit","Apex","Crest","Crown","Pinnacle","Zenith","Ridge",
    "Ledge","Level","Hollow","Compact","Dense","Thick","Narrow","Slender","Micro","Mini",
    "Small","Ample","Hefty","Jumbo","Mega","Ultra","Macro","Central","Core","Outer",
    "Lateral","Radial","Spiral","Orbital","Linear","Planar","Spherical","Rounded","Angular","Pointed",
    "Tapered","Curved","Arced","Twisted","Coiled","Fractal","Cellular","Quantum","Photon","Plasma",
    "Kinetic","Static","Charged","Maximal","Atomic","Nano","Tiered","Strata","Nested","Stepped",
    "Graded","Scaled","Proportioned","Modular","Symmetric","Parallel","Flowing","Drifting","Gliding","Sailing",
    "Floating","Climbing","Leaping","Bounding","Sprinting","Dashing","Rushing","Surging","Cascading","Rolling",
    "Tumbling","Spinning","Whirling","Twisting","Swirling","Pulsing","Beating","Humming","Buzzing","Ringing",
    "Chiming","Singing","Dancing","Swaying","Waving","Rippling","Bubbling","Fizzing","Crackling","Snapping",
    "Clicking","Tapping","Drumming","Thrumming","Vibrant","Magnetic","Electric","Blazing","Burning","Fiery",
    "Volcanic","Thermal","Warming","Cooling","Chilling","Brisk","Crisp","Breezy","Gusty","Windy",
    "Airy","Light","Buoyant","Weightless","Fleet","Peppy","Zippy","Snappy","Speedy","Sonic",
    "Turbo","Warp","Express","Instant","Darting","Flying","Jetting","Cruising","Coasting","Rhythmic",
    "Cycling","Pacing","Striding","Marching","Trotting","Galloping","Bouncing","Vaulting","Arching","Launched",
    "Propelled","Hovering","Orbiting","Revolving","Rotating","Pivoting","Swinging","Rocking","Tilting","Shifting",
    "Sliding","Skating","Surfing","Diving","Plunging","Dipping","Wading","Celestial","Ethereal","Mystic",
    "Arcane","Ancient","Eternal","Timeless","Ageless","Enduring","Lasting","Perpetual","Legendary","Mythic",
    "Epic","Fabled","Storied","Historic","Classic","Vintage","Retro","Modern","Future","Digital",
    "Cyber","Virtual","Pixel","Binary","Omega","Alpha","Beta","Gamma","Sigma","Theta",
    "Lambda","Kappa","Zeta","Epsilon","Omni","Dual","Triple","Nexus","Vertex","Vector",
    "Matrix","Cipher","Enigma","Phantom","Mirage","Dream","Vision","Oracle","Prophet","Sage",
    "Shaman","Druid","Artisan","Maestro","Virtuoso","Savant","Prodigy","Maven","Guru","Mentor",
    "Guide","Scout","Pioneer","Voyager","Wanderer","Nomad","Rover","Ranger","Sentinel","Guardian",
    "Keeper","Warden","Champion","Vanguard","Herald","Emissary","Envoy","Ambassador","Steward","Curator",
    "Patron","Benefactor","Founder","Architect","Builder","Maker","Crafter","Weaver","Forger","Smith",
    "Wright","Mason","Brewer","Baker","Tanner","Dyer","Scribe","Bard","Minstrel","Troubadour",
    "Storyteller","Chronicler","Lorekeeper","Archivist","Tranquil","Placid","Hushed","Muffled","Soft","Subtle",
    "Faint","Dim","Pale","Warm","Cool","Taut","Tense","Cozy","Homey","Pastoral",
    "Sylvan","Bucolic","Idyllic","Quaint","Charming","Lovely","Pretty","Dapper","Natty","Chic",
    "Posh","Classy","Fancy","Ornate","Lavish","Opulent","Majestic","Dignified","August","Solemn",
    "Sober","Heartfelt","Genuine","Authentic","Novel","Singular","Distinct","Chosen","Select","Premium",
    "Deluxe","Superior","Exquisite","Superb","Splendid","Glorious","Sublime","Resonant","Harmonic","Melodic",
    "Lyrical","Poetic","Seamless","Effortless","Organic","Primal","Devoted","Dedicated","Committed","Focused",
    "Determined","Resolute","Steadfast","Unwavering","Constant","Faithful","Reliable","Dependable","Trusty","Anchored",
    "Moored","Sheltered","Protected","Guarded","Shielded","Fortified","Reinforced","Braced","Bolstered","Supported",
    "Upheld","Sustained","Preserved","Conserved","Stored","Vaulted","Locked","Secured","Fastened","Linked",
    "Joined","Connected","Paired","Matched","Balanced","Aligned","Centered","Aimed","Directed","Guided",
    "Steered","Piloted","Navigated","Charted","Mapped","Tracked","Pursued","Discovered","Unveiled","Displayed",
    "Presented","Granted","Bestowed","Conferred","Sapient","Sentient","Radiant","Fertile","Abundant","Bountiful",
    "Plentiful","Prolific","Thriving","Flourishing","Blooming","Budding","Growing","Expanding","Advancing","Progressing",
    "Evolving","Maturing","Ripening","Developing","Emerging","Nascent","Incipient","Dawning","Unfolding","Awakening",
    "Stirring","Kindling","Igniting","Sparking","Triggering","Launching","Initiating","Pioneering","Trailblazing","Groundbreaking",
    "Innovative","Inventive","Creative","Imaginative","Inspired","Visionary","Prophetic","Prescient","Insightful","Perceptive",
    "Observant","Watchful","Vigilant","Attentive","Thoughtful","Considerate","Caring","Nurturing","Fostering","Cultivating",
    "Tending","Pruning","Trimming","Shaping","Forming","Molding","Fashioning","Designing","Drafting","Sketching",
    "Drawing","Painting","Coloring","Tinting","Shading","Blending","Mixing","Merging","Combining","Uniting",
    "Fusing","Melding","Weaving","Knitting","Stitching","Sewing","Quilting","Patching","Mending","Healing",
    "Restoring","Renewing","Reviving","Refreshing","Rejuvenating","Invigorating","Energizing","Empowering","Strengthening","Fortifying",
    "Hardening","Tempering","Seasoning","Curing","Aging","Mellowing","Softening","Smoothing","Leveling","Planing",
    "Sanding","Buffing","Burnishing","Radiating","Beaming","Lighting","Illuminating","Brightening","Clarifying","Purifying",
    "Filtering","Distilling","Condensing","Concentrating","Focusing","Directing","Channeling","Terraced","Ascending","Streaming",
    "Umber","Careful","Perfecting","Glittering","Twinkling","Verdure","Auroral","Boreal","Austral","Temperate",
]

NOUNS = [
    "Falcon","Hawk","Eagle","Owl","Heron","Crane","Swan","Dove","Raven","Finch",
    "Robin","Wren","Lark","Jay","Ibis","Kite","Osprey","Condor","Pelican","Stork",
    "Sparrow","Tern","Puffin","Parrot","Toucan","Kingfisher","Flamingo","Quail","Pheasant","Grouse",
    "Oriole","Warbler","Thrush","Starling","Magpie","Swallow","Martin","Plover","Curlew","Sandpiper",
    "Wolf","Fox","Bear","Stag","Elk","Moose","Bison","Lynx","Cougar","Panther",
    "Jaguar","Leopard","Tiger","Lion","Cheetah","Gazelle","Antelope","Impala","Zebra","Giraffe",
    "Rhino","Hippo","Otter","Beaver","Badger","Marten","Ferret","Mink","Hare","Rabbit",
    "Squirrel","Chipmunk","Porcupine","Hedgehog","Armadillo","Pangolin","Lemur","Gibbon","Tamarin","Capybara",
    "Chinchilla","Ocelot","Margay","Coati","Kinkajou","Tapir","Okapi","Kudu","Oryx","Chamois",
    "Orca","Dolphin","Whale","Narwhal","Walrus","Seal","Manatee","Turtle","Iguana","Gecko",
    "Chameleon","Newt","Salamander","Crab","Lobster","Seahorse","Starfish","Octopus","Squid","Jellyfish",
    "Stingray","Barracuda","Marlin","Sailfish","Trout","Salmon","Mantis","Cricket","Firefly","Dragonfly",
    "Cedar","Oak","Pine","Birch","Maple","Elm","Ash","Willow","Cypress","Redwood",
    "Sequoia","Spruce","Fir","Larch","Yew","Beech","Alder","Poplar","Aspen","Walnut",
    "Hickory","Teak","Mahogany","Ebony","Bamboo","Palm","Acacia","Baobab","Banyan","Olive",
    "Laurel","Magnolia","Lotus","Orchid","Iris","Lily","Rose","Tulip","Daisy","Aster",
    "Dahlia","Peony","Jasmine","Violet","Clover","Fern","Moss","Lichen","Ivy","Vine",
    "Reed","Sage","Basil","Thyme","Mint","Dill","Fennel","Sorrel","Yarrow","Thistle",
    "Heather","Bluebell","Primrose","Marigold","Sunflower","Zinnia","Pansy","Poppy","Crocus","Snowdrop",
    "Foxglove","Honeysuckle","Wisteria","Hibiscus","Plumeria","Gardenia","Camellia","Begonia","Azalea","Oleander",
    "Canyon","Ridge","Peak","Summit","Cliff","Bluff","Mesa","Butte","Plateau","Terrace",
    "Valley","Basin","Gorge","Ravine","Gulch","Fjord","Inlet","Bay","Cove","Harbor",
    "Lagoon","Reef","Atoll","Isle","Peninsula","Cape","Shoal","Bank","Ledge","Shelf",
    "Dune","Desert","Steppe","Tundra","Glacier","Moraine","Geyser","Oasis","Delta","Estuary",
    "Marsh","Bog","Swamp","Fen","Moor","Heath","Meadow","Prairie","Savanna","Glen",
    "Dale","Dell","Vale","Hollow","Grove","Copse","Thicket","Taiga","Mangrove","Wetland",
    "Cascade","Brook","Creek","Stream","River","Lake","Pond","Pool","Tarn","Loch",
    "Falls","Fountain","Grotto","Cavern","Cave","Tunnel","Arch","Bridge","Ford","Pass",
    "Trail","Path","Route","Caldera","Crater","Vent","Spire","Needle","Dome","Gateway",
    "Portal","Threshold","Verge","Brink","Edge","Rim","Brow","Crest","Promontory","Headland",
    "Spit","Tombolo","Isthmus","Strait","Narrows","Sound","Bight","Reach","Stretch","Expanse",
    "Clearing","Glade","Knoll","Hillock","Mound","Tor","Crag","Scarp","Escarpment","Comet",
    "Meteor","Asteroid","Nebula","Galaxy","Quasar","Pulsar","Star","Sun","Moon","Planet",
    "Orbit","Eclipse","Corona","Flare","Nova","Cosmos","Void","Abyss","Ether","Zenith",
    "Nadir","Horizon","Aurora","Meridian","Equinox","Solstice","Phase","Cycle","Epoch","Eon",
    "Era","Dawn","Dusk","Twilight","Night","Noon","Morning","Evening","Sunset","Sunrise",
    "Daybreak","Nightfall","Starlight","Moonbeam","Sunray","Skyline","Firmament","Canopy","Infinity","Vega",
    "Rigel","Altair","Deneb","Sirius","Polaris","Arcturus","Antares","Lyra","Orion","Draco",
    "Phoenix","Hydra","Corvus","Cygnus","Aquila","Andromeda","Pegasus","Perseus","Gemini","Centauri",
    "Cassiopeia","Scorpius","Sagittarius","Capella","Procyon","Aldebaran","Betelgeuse","Spica","Prism","Quill",
    "Forge","Anvil","Helm","Rune","Atlas","Compass","Anchor","Beacon","Bell","Bugle",
    "Drum","Flute","Harp","Horn","Lyre","Pipe","Gong","Chime","Cymbal","Fiddle",
    "Trumpet","Viola","Cello","Oboe","Lute","Mandolin","Zither","Sitar","Banjo","Lantern",
    "Torch","Candle","Lamp","Globe","Lens","Scope","Mirror","Frame","Easel","Palette",
    "Brush","Chisel","Mallet","Hammer","Tongs","Ladle","Kettle","Crucible","Mortar","Pestle",
    "Flask","Vial","Beaker","Alembic","Furnace","Kiln","Loom","Shuttle","Bobbin","Spool",
    "Thimble","Pin","Clasp","Buckle","Brooch","Pendant","Amulet","Talisman","Charm","Token",
    "Coin","Medal","Badge","Shield","Banner","Flag","Pennant","Sigil","Stamp","Emblem",
    "Totem","Icon","Statue","Obelisk","Monolith","Cairn","Tablet","Scroll","Tome","Codex",
    "Ledger","Journal","Chronicle","Almanac","Manual","Gazette","Folio","Pamphlet","Broadsheet","Parchment",
    "Vellum","Papyrus","Inkwell","Quiver","Satchel","Pouch","Casket","Coffer","Chest","Crate",
    "Barrel","Quartz","Opal","Onyx","Agate","Garnet","Topaz","Beryl","Zircon","Spinel",
    "Peridot","Jasper","Amethyst","Citrine","Tourmaline","Malachite","Azurite","Lapis","Pyrite","Galena",
    "Mica","Talc","Gypsum","Calcite","Dolomite","Basalt","Granite","Marble","Slate","Shale",
    "Sandstone","Limestone","Obsidian","Pumice","Tuff","Chert","Flint","Chalcedony","Carnelian","Sardonyx",
    "Moonstone","Sunstone","Labradorite","Tanzanite","Kunzite","Rhodonite","Sodalite","Chrysocolla","Aventurine","Fluorite",
    "Seraphinite","Charoite","Sugilite","Larimar","Prehnite","Danburite","Scolecite","Celestite","Amazonite","Howlite",
    "Lepidolite","Storm","Thunder","Lightning","Breeze","Gale","Squall","Typhoon","Cyclone","Monsoon",
    "Tempest","Zephyr","Chinook","Mistral","Sirocco","Foehn","Bora","Rain","Drizzle","Shower",
    "Downpour","Deluge","Flood","Torrent","Current","Tide","Wave","Swell","Surf","Spray",
    "Foam","Mist","Fog","Haze","Dew","Frost","Ice","Snow","Sleet","Hail",
    "Rime","Thaw","Flow","Drift","Eddy","Vortex","Whirl","Spiral","Funnel","Column",
    "Plume","Wisp","Streak","Band","Front","Trough","Rainbow","Halo","Mirage","Shimmer",
    "Glimmer","Tower","Turret","Bastion","Citadel","Fortress","Castle","Palace","Manor","Lodge",
    "Cabin","Cottage","Villa","Ranch","Barn","Silo","Mill","Foundry","Workshop","Studio",
    "Gallery","Museum","Library","Archive","Treasury","Vault","Chamber","Hall","Court","Plaza",
    "Garden","Balcony","Porch","Arcade","Colonnade","Pergola","Pavilion","Gazebo","Kiosk","Chapel",
    "Temple","Shrine","Monastery","Abbey","Cathedral","Basilica","Minaret","Pagoda","Stupa","Pyramid",
    "Arena","Stadium","Forum","Market","Bazaar","Emporium","Depot","Station","Terminal","Dock",
    "Wharf","Pier","Jetty","Quay","Marina","Lighthouse","Watchtower","Outpost","Camp","Shelter",
    "Refuge","Sanctuary","Haven","Retreat","Nest","Aerie","Burrow","Den","Lair","Roost",
    "Perch","Bower","Arbor","Alcove","Sextant","Astrolabe","Sundial","Hourglass","Pendulum","Gyroscope",
    "Turbine","Dynamo","Generator","Piston","Valve","Lever","Pulley","Winch","Derrick","Gantry",
    "Scaffold","Trellis","Lattice","Grid","Net","Web","Axle","Gear","Cog","Sprocket",
    "Chain","Link","Cable","Wire","Thread","Cord","Rope","Rigging","Mast","Boom",
    "Spar","Keel","Hull","Rudder","Tiller","Wheel","Chart","Map","Gauge","Meter",
    "Scale","Caliper","Ruler","Level","Plumb","Protractor","Template","Stencil","Mold","Die",
    "Lathe","Bellows","Retort","Condenser","Centrifuge","Spectrometer","Oscilloscope","Theodolite","Transit","Sounding",
    "Probe","Sensor","Relay","Switch","Circuit","Diode","Quest","Saga","Legend","Myth",
    "Fable","Ballad","Anthem","Hymn","Ode","Sonnet","Verse","Stanza","Canto","Chorus",
    "Refrain","Motif","Theme","Arc","Prologue","Epilogue","Prelude","Overture","Finale","Crescendo",
    "Cadence","Tempo","Rhythm","Pulse","Beat","Tone","Note","Chord","Harmony","Melody",
    "Lyric","Opus","Suite","Etude","Fugue","Canon","March","Waltz","Rondo","Aria",
    "Duet","Trio","Quartet","Ensemble","Guild","League","Order","Council","Assembly","Conclave",
    "Synod","Quorum","Cohort","Legion","Brigade","Battalion","Regiment","Division","Corps","Fleet",
    "Squadron","Patrol","Convoy","Caravan","Expedition","Voyage","Journey","Trek","Odyssey","Passage",
    "Crossing","Venture","Enterprise","Mission","Campaign","Crusade","Pilgrimage","Safari","Sortie","Foray",
    "Rally","Charge","Advance","Concord","Ember","Blaze","Inferno","Pyre","Spark","Cinder",
    "Smoke","Vapor","Steam","Nimbus","Cumulus","Cirrus","Stratus","Billow","Puff","Wake",
    "Ripple","Surge","Ebb","Flux","Gush","Rush","Spring","Well","Font","Source",
    "Origin","Root","Seed","Sprout","Bud","Bloom","Petal","Leaf","Branch","Limb",
    "Trunk","Bark","Grain","Fiber","Pulp","Core","Sap","Resin","Nectar","Pollen",
    "Spore","Frond","Tendril","Runner","Shoot","Stalk","Stem","Thorn","Burr","Cone",
    "Acorn","Pinecone","Nutshell","Keystone","Capstone","Milestone","Cornerstone","Foundation","Bedrock","Pillar",
    "Buttress","Parapet","Battlement","Barbican","Gatehouse","Drawbridge","Portcullis","Moat","Stockade","Palisade",
    "Bulwark","Levee","Embankment","Causeway","Aqueduct","Viaduct","Trestle","Span","Lintel","Plinth",
    "Pedestal","Dais","Rostrum","Podium","Stage","Platform","Deck","Landing","Berth","Channel",
    "Lock","Weir","Dam","Spillway","Flume","Chute","Sluice","Nozzle","Spout","Faucet",
    "Cistern","Wellspring","Headwater","Watershed","Alluvium","Loam","Humus","Peat","Marl","Silt",
    "Writ","Clamp","Eyepiece","Traverse","Stride","Parley","Char","Trace","Confluence","Rampart",
]

BLOCKED_COMBOS = set()  # Add any offensive adj+noun combinations here


def derive_name(wallet: str, fmt: str = "display") -> str:
    """Derive a deterministic name from a Solana wallet address.

    Args:
        wallet: Base58 wallet address
        fmt: Name format - "short", "display" (default), "tag", or "full"

    Returns:
        Formatted name string
    """
    identity = derive_identity(wallet)
    return identity[fmt] if fmt != "display" else identity["name"]


def derive_identity(wallet: str) -> dict:
    """Derive the full identity bundle for a wallet address."""
    domain = f"solnames-{SOLNAMES_VERSION}:"
    hash_bytes = hashlib.sha256((domain + wallet).encode("utf-8")).digest()
    hex_str = hash_bytes.hex()

    # Seed PRNG from first 4 bytes (big-endian unsigned)
    seed = struct.unpack(">I", hash_bytes[0:4])[0]
    rng = _mulberry32(seed)

    # Pick first adj+noun pair, retrying if blocked
    adj1 = ADJECTIVES[math.floor(rng() * len(ADJECTIVES))]
    noun1 = NOUNS[math.floor(rng() * len(NOUNS))]
    while (adj1 + noun1) in BLOCKED_COMBOS:
        adj1 = ADJECTIVES[math.floor(rng() * len(ADJECTIVES))]
        noun1 = NOUNS[math.floor(rng() * len(NOUNS))]

    # Pick second adj+noun pair for full format
    adj2 = ADJECTIVES[math.floor(rng() * len(ADJECTIVES))]
    noun2 = NOUNS[math.floor(rng() * len(NOUNS))]

    # Discriminator from bytes 8-9
    discriminator = hex_str[16:20]

    sep = " "

    return {
        "short": adj1,
        "name": adj1 + sep + noun1,
        "tag": adj1 + sep + noun1 + "#" + discriminator,
        "full": adj1 + sep + noun1 + "-" + adj2 + sep + noun2,
        "adjective": adj1,
        "noun": noun1,
        "hash": hex_str,
        "discriminator": discriminator,
    }


def generate_name(wallet: str, **kwargs) -> str:
    """Deprecated: use derive_name() instead. Returns display format for backward compat."""
    return derive_name(wallet, "display")

# ─── CLI ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python solfaces.py <wallet_address> [--svg] [--json] [--describe] [--size N] [--flat]")
        sys.exit(1)

    wallet = sys.argv[1]
    args = set(sys.argv[2:])

    size = 64
    if "--size" in args:
        idx = sys.argv.index("--size")
        if idx + 1 >= len(sys.argv):
            print("Error: --size requires a value", file=sys.stderr)
            sys.exit(1)
        size = int(sys.argv[idx + 1])

    use_flat = "--flat" in args

    if "--svg" in args:
        print(render_svg(wallet, size=size, flat=use_flat))
    elif "--json" in args:
        import json
        t = generate_traits(wallet)
        print(json.dumps({
            "wallet": wallet,
            "hash": trait_hash(wallet),
            "traits": t.to_dict(),
            "labels": get_trait_labels(t),
            "description": describe_appearance(wallet),
        }, indent=2))
    elif "--describe" in args:
        print(describe_appearance(wallet))
    else:
        t = generate_traits(wallet)
        labels = get_trait_labels(t)
        print(f"SolFace for {wallet[:8]}...{wallet[-4:]}")
        print(f"Hash: {trait_hash(wallet)}")
        print("---")
        for k, v in labels.items():
            print(f"  {k}: {v}")
        print("---")
        print(describe_appearance(wallet))
