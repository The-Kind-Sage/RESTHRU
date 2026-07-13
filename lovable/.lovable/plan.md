# Creative 404 Page

## Goal
A single, self-contained 404 route with a continuous CSS-only animated loop of custom-coded food items (pizza slice, ramen bowl, soft-serve cone) drifting across a "kitchen void" background, plus headline, home button, and minimal footer.

## Files

**New: `src/routes/404-showcase.tsx`** (dedicated demo route so it's visible without triggering an unmatched URL)
- Full-viewport section with a "kitchen void" backdrop: deep midnight gradient, soft radial glows, subtle dotted grid, faint floating specks (flour dust) via CSS keyframes.
- Centerpiece: a horizontally scrolling conveyor belt (`@keyframes drift`, infinite linear) containing duplicated food items so the loop is seamless. Each item has its own secondary animation:
  - Pizza slice — SVG wedge with pepperoni dots, `animate-spin` slow.
  - Ramen bowl — SVG bowl with noodle squiggles and steam lines (steam rises via keyframe), bowl bobs up/down.
  - Soft-serve cone — SVG cone with swirled cream, gentle float + slight tilt.
- Extra ambient shapes (chopsticks, cherry, sparkle) drifting at different speeds/parallax layers for depth.
- Headline: "404: This dish isn't on the menu" in a display font, with a smaller subline "Looks like that recipe failed."
- CTA button: "Return to Home Page" using shadcn Button styling with semantic tokens + subtle glow ring.
- Minimal footer nav: Home · About · Contact links (placeholder Links), centered, muted.
- `head()` with unique title/description/og.

**Update: `src/routes/__root.tsx`**
- Replace `NotFoundComponent` body to render the same visual (extract into a shared component `src/components/not-found-scene.tsx`) so both the root 404 boundary and the demo route show the design.

**New: `src/components/not-found-scene.tsx`**
- Houses the scene + animation markup. Uses only Tailwind classes and inline `<style>` block for custom `@keyframes` (drift, bob, steam, float-tilt, dust) since Tailwind v4 doesn't have these built in. Uses semantic color tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-primary`, etc.) — no hardcoded colors in components. Any needed custom color tokens (e.g., a warm accent) added to `src/styles.css` under `@theme inline`.

**Update: `src/styles.css`**
- Add 1–2 warm accent tokens (e.g., `--accent-warm`, `--accent-glow`) if needed for the kitchen-void mood, mapped via `@theme inline`.

## Technical Notes
- Pure CSS/Tailwind animations — no motion libraries, no external assets.
- SVGs inlined as React components inside the scene file; use `currentColor` so they inherit token colors.
- Seamless loop: render the food row twice inside a track that translates -50% over N seconds.
- Respect `prefers-reduced-motion` via a media query in the `<style>` block to pause drift.
- No use of the forbidden word anywhere.

## Out of Scope
- No backend, no routing changes beyond the new route + shared component.
- No new dependencies.
