# Project Clover

## Current State
The site uses a dark neon-green glass-morphism theme with OKLCH-based electric green accents (oklch ~142 hue), Fraunces serif hero text, floating clover SVG particles, glowing gradient buttons, and an animated glass nav. The overall vibe is "neon club" aesthetic.

## Requested Changes (Diff)

### Add
- New visual template: shift from neon-club to a luxurious deep-purple / gold VIP event aesthetic
- New font pairing: `Cinzel` (display/headings, regal serif) + `Raleway` (body, modern sans)
- Rich color palette: deep indigo/violet background (#0d0a1a), gold/amber accents (oklch ~85 hue), subtle champagne shimmer effects
- VIP "velvet rope" aesthetic: deep jewel tones, gold gradients, premium card textures
- Updated splash screen to match new theme
- Ticket cards redesigned with gold foil border effect and dark violet background
- Glowing gold buttons instead of neon green
- Stars/sparkle particle background instead of floating clovers

### Modify
- `index.css`: Completely replace color tokens, background, typography with new purple/gold system
- `App.tsx`: Update all inline styles and class references to new theme
- `SplashScreen.tsx`: Update to new color scheme and particles
- Keep all functional logic intact (reservation flow, admin panel, backend calls)

### Remove
- Neon green color scheme
- Floating clover particles on main background (move clovers to keep brand identity subtly -- gold clovers)
- Glass morphism nav (replace with solid dark velvet-style nav)

## Implementation Plan
1. Update `index.css` with new CSS custom properties: deep purple/indigo background, gold accent system, Cinzel + Raleway fonts (import from Google Fonts)
2. Update `App.tsx`: replace green oklch values with gold oklch values (~85 hue), update particle SVGs to gold stars/sparkles, update nav and button styles
3. Update `SplashScreen.tsx` to use gold/purple palette
4. Ensure all ticket cards, admin panels, modals match new theme
5. Validate and build
