# UI Refresh Prompt — paste into Claude (claude.ai)

**How to use:** Upload the project's `index.html` to Claude, paste everything in
the box below, and fill in the **"THE LOOK I WANT"** line at the bottom. When
Claude returns a new file, send it back to me — I'll fold only the visual
changes into the real source, rebuild, and run the game's tests to prove it
still plays identically before pushing.

---

I'm uploading a finished, working single-file HTML math game for my 5-year-old.
Everything about HOW IT WORKS is exactly right — the screen flow, drag-and-drop,
scoring, sounds, and animations must all stay identical. I only want to refresh
how it LOOKS.

How the file is built:
- A tiny HTML `<body>` (just two wrapper `<div>`s).
- One `<style>` block = all the visual styling, built on CSS custom-property design tokens.
- One `<script>` block = the entire game engine; it creates every screen and element at runtime.

YOUR JOB: restyle the visual skin only. (See "THE LOOK I WANT" at the bottom.)

HARD RULES — do not break any:
1. Return the COMPLETE file, ready to run.
2. Do NOT change one character inside `<script>...</script>`. Copy it through exactly. (That's the game logic.)
3. Do NOT change the `<body>` markup, and do NOT rename, remove, reorder, or add any element IDs, class names, `data-*` attributes, or selectors. The script builds elements by these names — restyle a class, but keep its exact name.
4. Make changes only inside the `<style>` block (and the Google-Fonts `<link>` in `<head>` if you swap fonts).
5. Do NOT change any size, position, padding, margin, width, height, or the `#stage` dimensions (1280×800 landscape / 720×1280 portrait) or its scaling. Keep all geometry — change only "paint": color, font, shadow, border, border-radius, background, gradient, glow, filter, decorative pseudo-elements. (The game measures element positions live for drag-and-drop; moving or resizing breaks it.)
6. Keep all animation durations, keyframe motion, and the `--ease-*` curves. You may recolor things used in animations, not re-time them.
7. If you change the number/digit font, keep one with tabular figures (`font-feature-settings: "tnum"`), or the column math will misalign.

HOW THE STYLING IS ORGANIZED (restyle cleanly via this):
The look is driven by CSS variables in `:root`:
- Colors: `--bg-paper`, `--bg-card`, `--ink`, `--ink-soft`, `--success`, `--success-deep`, `--gentle-no`, `--star`, `--star-glow`, `--lock`.
- Per-world tints (re-tinted via `#stage[data-world="add|sub|mult"]`): `--world-primary`, `--world-accent`, `--world-sky`, `--world-ground`.
- Shadows: `--sh-1`, `--sh-2`, `--sh-3`, `--sh-pressed`. Radii: `--r-sm/md/lg/xl/pill`.
The cleanest restyle = redefine these token VALUES, then refine component rules (buttons, digit tiles, answer slots, cards, map nodes). Keep token NAMES.

Before finishing, list the visual changes you made (palette, fonts, shadows, textures) so I can review.

THE LOOK I WANT:
<!-- Replace this line with your direction. Examples:
 - "Keep the warm jungle feel but make it richer and more storybook — deeper jewel-tone palette, a subtle paper-grain background, more colorful soft shadows, rounder bouncier buttons."
 - "Cute candy-shop pastel theme — soft pinks and mints, glossy rounded tiles, sticker-style outlines."
 - "Surprise me — keep it warm, high-contrast, playful, and never flat or corporate." -->
