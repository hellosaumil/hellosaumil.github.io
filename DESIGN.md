# Design System — hellosaumil.github.io

## Goal
Enforce a strict, simplified design hierarchy across the landing page to ensure consistency and clean aesthetics. Dark-first, code-culture, Swiss minimalism.

---

## Typography Rules

| Level | Font | Size | Weight | Style | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Name** | Inter | `clamp(26pt, 8vw, 60pt)` | `700` | Normal | Full name on hero section |
| **Hero Tagline** | JetBrains Mono | `clamp(12pt, 2vw, 9.5pt)` | `400` | Normal | Typing animation, accent color |
| **Section Label** | JetBrains Mono | `14pt` | `500` | Uppercase | "PROJECTS", `letter-spacing: 3px`, muted |
| **Bio Body** | Inter | `13.5pt` | `400` | Normal | About section prose, `line-height: 1.7` |
| **Card Title** | Inter | `12pt` | `600` | Normal | Project card name |
| **Card Desc** | Inter | `12pt` | `400` | Normal | Project description, muted, `line-height: 1.5` |
| **Card Highlight** | JetBrains Mono | `11pt` | `400` | Normal | Backtick spans in desc — no bg, mono font, primary color |
| **Nav Brand** | JetBrains Mono | `10.5pt` | `500` | Normal | "Saumil Shah" in nav |
| **Nav Links** | JetBrains Mono | `10pt` | `400` | Normal | About, Projects, WebResume — muted |
| **Tag / Pill** | JetBrains Mono | `9pt` | `400` | Normal | Tech tags on cards, accent color, bordered |
| **Year Badge** | JetBrains Mono | `9pt` | `400` | Normal | Bottom-right on cards, muted, border bg |
| **Social Links** | JetBrains Mono | `10.5pt` | `400` | Normal | GitHub, LinkedIn, Email, WebResume |
| **Footer** | JetBrains Mono | `10pt` | `400` | Normal | `© 2026 Saumil Shah`, muted |

**Rule:** Inter for prose and headings. JetBrains Mono for anything "meta" — nav, tagline, tags, dates, labels, footer.

---

## Color Tokens

### Dark Mode (default)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg` | `#0A0A0A` | Page background |
| `--bg-card` | `#111111` | Card surfaces |
| `--text` | `#EDEDED` | Primary text |
| `--text-muted` | `#888888` | Labels, nav links, secondary text |
| `--accent` | `#C8FF00` | Links, cursor, highlights, tags |
| `--accent-hover` | `#D4FF4D` | Hover on accent elements |
| `--border` | `#1E1E1E` | Card borders, year badge background |
| `--dot` | `#1E1E1E` | Hero dot-grid pattern |
| `--nav-bg` | `rgba(10,10,10,0.85)` | Nav blur after scrolling past hero |

### Light Mode

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--bg` | `#FAFAFA` | Page background |
| `--bg-card` | `#FFFFFF` | Card surfaces |
| `--text` | `#0A0A0A` | Primary text |
| `--text-muted` | `#666666` | Secondary text |
| `--accent` | `#8BC34A` | Links, highlights, tags |
| `--accent-hover` | `#9CCC65` | Hover on accent elements |
| `--border` | `#E0E0E0` | Card borders |
| `--dot` | `#DDDDDD` | Hero dot-grid pattern |
| `--nav-bg` | `rgba(250,250,250,0.85)` | Nav blur |

---

## Brand Colors

Fixed per brand — not affected by light/dark mode. Applied via `.link-*` classes, detected by `brandClass(url, label)` in JS.

| Brand | Class | Color |
| :--- | :--- | :--- |
| Qualcomm | `.link-qualcomm` | `#3953DC` |
| Snapdragon / Adreno | `.link-snapdragon` | `#E81B23` |
| KORE Wireless / SecurityPro | `.link-kore` | `#FF6B35` |
| GitHub | `.link-github` | `#8957e5` |
| LinkedIn | `.link-linkedin` | `#0A66C2` |
| Email | `.link-email` | `var(--accent)` |
| WebResume | `.link-webresume` | `#FF6000` |

---

## Layout Rules

- **Max content width:** `1000px` (global `.container`). About section overrides to `1200px`.
- **Bio text max-width:** `1100px`, centered.
- **Section padding:** `80px 0` desktop, `60px 0` mobile.
- **Project grid:** 2-column CSS grid, `gap: 24px`. Collapses to 1-column at `≤ 640px`.
- **Card padding:** `24px`. Border-radius: `12px`.
- **Nav height:** `64px`, fixed, `z-index: 100`. Gains blur backdrop after scrolling past hero.
- **Hero:** Full `100vh`, dot-grid background (`radial-gradient`, 24×24px spacing), scroll-snap.

## Card Footer Structure

Cards use `display: flex; flex-direction: column`. The footer row pins to bottom via `margin-top: auto`:

```
[ Tag1 ][ Tag2 ][ Tag3 ]          2025
↑ .project-card__tags (flex: 1)   ↑ .project-card__year
```

---

## Content Sources

| Content | File | Format |
| :--- | :--- | :--- |
| Bio / summary | `data/summary.md` | Markdown with backtick highlights |
| Projects | `data/projects.md` | Custom markdown (see below) |
| Profile photo | `assets/images/profile.jpg` | — |
| Favicon | `favicon.svg` | Inline SVG dolphin |

**`projects.md` entry format:**
```
### [Project Name](url)
##### Tag1, Tag2, Tag3 | YYYY
- Description with `backtick highlights` for key terms.
  Optional second line continuation.
```

---

## Implementation Notes

- **Theme toggle:** Stored in `localStorage` key `theme`. Transitions: `background-color 0.3s, color 0.3s`.
- **Typing animation:** Hero tagline cycles phrases at 80ms/char type, 40ms/char delete.
- **Nav activation:** `IntersectionObserver` on hero — adds blur backdrop when hero leaves viewport.
- **Section fade-in:** `IntersectionObserver` (threshold 0.1), 0.6s ease.
- **Backtick highlights (code blocks):** Rendered as `<mark>` via `renderMd()` — no background, mono font, primary text color, **11pt**.
- **URLs (links):** In project descriptions, **11pt**.
- **Project description text:** Regular text **12pt**, code blocks and URLs **11pt**.
- **Reduced motion:** All animations wrapped in `@media (prefers-reduced-motion: reduce)`.

---

## Verification

- Use Element Inspector to confirm font family switches between Inter (prose) and JetBrains Mono (meta).
- Toggle light/dark mode — accent and card surface tokens must update, brand colors must not change.
- Check card footer alignment: tags left, year right, both at the same baseline.
- Confirm `brandClass()` detection fires for Qualcomm, Snapdragon/Adreno, KORE, SecurityPro URLs and labels.
