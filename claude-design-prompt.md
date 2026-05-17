# Design Brief: Jhanav's Math Quest

A math-practice web game for a single 5-year-old boy on a Samsung Galaxy Tab S8. I need a complete visual + interaction design returned as a single `design.md` file that an engineer can build from. **Do not write code.** Design only.

## 1. Context

- **Player:** Jhanav, age 5. Bright. Already comfortable with single-digit addition/subtraction. The game stretches him into column-method 2-digit arithmetic (with carry/borrow) and multiplication via block-counting.
- **Device:** Samsung Galaxy Tab S8 — 11", **2560 × 1600**, used in **landscape**. Touch + S Pen input. Chrome browser.
- **Build target:** Single-file HTML + CSS + JS (no framework, no build step). Design must be implementable in that constraint — use CSS-only effects where possible, with a small sprinkle of JS-driven animation only for the showcase moments (level complete, carry digit floating up, etc.).
- **Audience:** One kid, one tablet, offline-capable. No accounts, no cloud.

## 2. Tone & Aesthetic

- **Extremely fun, warm, encouraging.** Never punishing.
- Bright, saturated, confident colors. Chunky rounded shapes. Big friendly type.
- **Avoid** generic AI-app aesthetic: no glassmorphism-on-pastel-gradient, no minimalist startup look, no Tailwind-default vibe.
- Closer in spirit to: Sago Mini, Khan Academy Kids, Toca Boca, Endless Numbers. Hand-drawn-ish, playful, character-driven.
- **Propose a theme** with 2–3 options (e.g., friendly monsters, jungle critters, space explorers, undersea, dinosaurs, robots). For each, suggest: mascot, color palette, world names, vibe in one line. The parent will pick.
- **Touch ergonomics:** Min tap target 64px. Drag tiles ≥ 90px. Account for thumb zones — kids hold the tablet with both hands on the sides.

## 3. Screens to Design

Detailed layout, spacing, color, and component breakdown for each of the screens below. Provide measurements in CSS-friendly units (px or rem) sized for 2560×1600 landscape. Each screen should have a small wireframe / ASCII sketch and a description.

### 3.1 Splash / Home
- Game title, mascot, "Tap to Play" button.
- Small settings cog (sound on/off, reset progress — hidden behind a parent-gate like "tap and hold 3 seconds").
- Background animation idle loop (subtle, looping).

### 3.2 World Map
- Three worlds visible: **Addition Mountain**, **Subtraction Valley**, **Multiplication Meadow** (rename if your theme dictates).
- Each world shows 6 level nodes along a curved path.
- States per node: **locked** (greyed + padlock), **unlocked-unplayed** (pulsing/glowing), **completed** (with 1/2/3 star ribbon).
- Tapping a completed level should let him replay.
- Show the mascot walking along the path to the current node (idle animation).

### 3.3 Level Screen — Addition (column method)
- Looks like the attached worksheet style: top number on top, operator + bottom number below, horizontal line, **answer slots** below the line.
- **Right-to-left answer entry enforced.** Ones slot is highlighted first; tens slot only becomes droppable after ones is filled.
- Digit tray at the bottom with draggable tiles 0–9 (or a smart subset like 0–9 always visible, or only-relevant digits — please recommend).
- Progress bar / dots showing "problem X of 5".
- Pause/back to map button in a corner.
- **Carry animation:** when ones-sum ≥ 10, a small "1" floats up from the ones column and lands above the tens column with a bounce. Specify the motion path, timing, and easing.

### 3.4 Level Screen — Subtraction (column method)
- Same layout as addition, but with a **borrow animation:** when top-ones < bottom-ones, one "ten" from the tens column animates — the tens digit decreases by 1 (crossed out, new digit appears above) and a "10" floats down to join the ones column. Specify the choreography.

### 3.5 Level Screen — Multiplication (Tap-Count variant, for L1–L3 of the multiplication world)
- Shows a problem like "3 × 4" with the visual of **3 groups of 4 blocks** (e.g., 3 baskets, each with 4 apples — themed to your mascot world).
- Child taps each block to count it; tapped blocks light up and show their count number (1, 2, 3...). Counting persists across groups (so the last block shows the total).
- Once all blocks are tapped, the answer slots highlight and digit tray appears.
- Specify what blocks look like, how they're arranged, the tap-light-up effect, and the count-number style.

### 3.6 Level Screen — Multiplication (Drag-Groups variant, for L4–L6)
- Shows the problem like "Make 3 groups of 4". Child sees an empty tray (3 group-shaped slots) and a pile of single blocks.
- He drags blocks into the slots. As blocks land, they auto-arrange. Slot turns "complete" (glows) when it has the right count.
- After all groups are full, the question reveals: "How many in total?" — then digit-slot answer entry.

### 3.7 Level Complete
- Big star reveal (1, 2, or 3 stars dropping in with sound). Mascot does a celebration animation. Confetti, glitter, or theme-appropriate equivalent.
- Buttons: "Play again" / "Next level" / "Back to map".

### 3.8 Wrong-answer feedback (overlay state, not a separate screen)
- Wrong tile dropped → tile bounces back to the tray, the empty slot wiggles, soft "boing" sound.
- After 2 wrong tries on the same slot → hint kicks in. Specify the hint visual (e.g., wrong digits in the tray dim out, leaving only candidates; or the column being solved gets a gentle highlight; or for multiplication, the blocks pulse to invite recount). Recommend the best approach.

## 4. Reusable Components

For each, give visual spec + states (default / hover / active / disabled / success / error):

- **DigitTile** (draggable, 0–9) — base, dragging, dropped-correct, dropped-wrong-rebound.
- **AnswerSlot** — empty, active/highlighted, filled, wrong-flash.
- **Block** (for multiplication) — default, tapped/counted, in-group, glowing.
- **GroupTray** (drag target) — empty, partial, full/complete.
- **LevelNode** (world map) — locked, unlocked, in-progress, 1-star, 2-star, 3-star.
- **CarryDigit** (the little floating "1" or "10") — appearance, motion, settle.
- **PrimaryButton** — the chunky kid-friendly button.
- **StarMeter** — 3 stars filling up.
- **MathColumn** layout — the whole top-number / operator+bottom-number / line / slots structure. Specify alignment grid, digit baseline, line thickness.

## 5. Animations to Choreograph

For each, specify: trigger, duration, easing, motion description, and whether it's CSS-only or needs JS.

1. **Tile pickup** — slight scale-up + lift shadow when grabbed.
2. **Tile bounce-back** (wrong) — spring back to tray with elastic easing.
3. **Tile snap-in** (correct) — quick magnetic snap into the slot.
4. **Carry "1" float** — appears above ones, arcs over to tens column, settles with bounce.
5. **Borrow "10" descent** — tens digit crosses out, new digit appears above; "10" floats down to ones.
6. **Block tap-count light-up** — each block when tapped pulses + reveals count number.
7. **Block fly-in** (multiplication intro) — blocks tumble in from off-screen with stagger.
8. **Star reveal** (level complete) — stars drop with bounce, escalating excitement per star earned.
9. **Mascot idle + celebration** loops.
10. **Locked node unlock** (after completing prior level on map) — padlock breaks, node glows.

## 6. Audio Spec

The build will include **sound effects only** (no music, no voice). Specify the moments that get sound, what the sound feels like (e.g., "soft pop," "wooden thunk," "magical chime"), and an approximate length. Engineer will source actual files; you describe the audio palette.

- Tile pickup, tile drop, wrong (boing), correct slot fill, carry/borrow whoosh, block tap, level complete fanfare, star ding (×1, ×2, ×3), node unlock.

## 7. Color, Type, and Spacing System

- **Color palette** — primary, accent, success, error, neutral surface tones. Provide hex codes. Each world can have a subtle color shift (Addition = warm, Subtraction = cool, Multiplication = earthy). Don't go pastel-only — saturated and confident.
- **Typography** — one display font (chunky, friendly, for digits and titles) + one UI font (clear, readable). Use **system or freely-licensed Google Fonts only** (engineer will load via CDN). Recommend specific fonts with weights.
- **Spacing scale** — define a base unit (e.g., 8px or 12px) and a scale.
- **Radius / shadow / elevation system** — kid-friendly chunky rounded. Soft, warm shadows, no harsh material drop shadows.

## 8. Constraints Reminder

- **Single HTML file.** Inline `<style>` and `<script>`. CDN imports for fonts / Lottie / GSAP are OK if specified.
- **Landscape 2560×1600 native; should still scale gracefully** to other tablet sizes (the engineer will handle responsive).
- **No external image dependencies** unless you flag exactly which assets are needed and why (e.g., "1 mascot SVG, 3 background SVGs"). Prefer CSS-drawn shapes, emoji, or simple SVG for blocks/objects to keep the build self-contained.
- **Offline-capable.** Once loaded, no network calls.

## 9. Output Format

Return a single `design.md` file containing:

1. **Theme recommendation** (with 2–3 alternatives, your top pick first, brief rationale).
2. **Color, type, spacing systems** (with hex codes, font names, scale values).
3. **Each screen** — ASCII wireframe + measured layout + component list + interaction notes.
4. **Each component** — visual description + state matrix + sizing.
5. **Each animation** — trigger, motion path, duration, easing, implementation note (CSS-only vs JS).
6. **Sound palette** — list of moments with audio character notes.
7. **Asset list** — exactly what SVGs/images need to be sourced or drawn, with notes on what each looks like.

Make it concrete enough that an engineer can implement without asking follow-ups. Make decisions where the brief is silent — don't punt back to me with open questions. If you're unsure between two options, pick one and note the alternative in one line.
