# Design Brief

## Direction

Français Flashcards — warm, inviting French vocabulary memorization app with French Tricolore identity.

## Tone

Educational yet playful; refined, not clinical — celebrating French culture through a warm cream + navy + red palette.

## Differentiation

French Tricolore color system (navy primary, red accent, cream background) creates instant cultural identity; card-flip animation reinforces the flashcard learning metaphor.

## Color Palette

| Token          | OKLCH           | Role                                    |
| -------------- | --------------- | --------------------------------------- |
| background     | 0.96 0.015 75   | Warm cream, primary page background     |
| foreground     | 0.2 0.03 50     | Dark brown text on light backgrounds    |
| card           | 1.0 0.005 0     | Pure white flashcard surfaces           |
| primary        | 0.38 0.18 260   | Navy blue (French Tricolore)            |
| accent         | 0.55 0.25 25    | Red (French Tricolore, highlights)      |
| muted          | 0.92 0.02 75    | Light cream for secondary sections      |
| destructive    | 0.55 0.25 25    | Red accent (matches accent)             |

## Typography

- Display: Fraunces — elegant serif for headings, vocabulary words, hero text
- Body: Nunito — warm, friendly sans-serif for definitions, UI labels, body copy
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`, h2 `text-3xl font-bold`, label `text-sm font-semibold uppercase`, body `text-base`

## Elevation & Depth

Subtle layering: white cards with soft shadows on warm cream background; navy header with white text; muted secondary sections for visual rhythm.

## Structural Zones

| Zone    | Background                | Border            | Notes                           |
| ------- | ------------------------- | ----------------- | ------------------------------- |
| Header  | Navy primary (oklch primary) | White border-b    | App title + logo, high contrast |
| Content | Warm cream (background)   | —                 | Main flashcard study area       |
| Card    | Pure white (card)         | Subtle shadow     | Individual vocabulary cards     |
| Footer  | Muted cream (secondary)   | Muted border-t    | Progress, stats, navigation     |

## Spacing & Rhythm

Mobile-first: section gaps 2rem, card padding 1.5rem, micro-spacing 0.25rem base unit. Border radius 0.75rem (12px) throughout for warm, approachable feel.

## Component Patterns

- Buttons: navy primary on cream, red destructive/accent, white text, 0.75rem radius, hover:opacity-90
- Cards: white background, subtle shadow-md, 0.75rem radius, flip animation on tap
- Badges: small rounded pills with navy or red background

## Motion

- Entrance: fade-up + stagger (0.1s delays) for card lists
- Hover: opacity-90 + subtle scale-105 on buttons
- Decorative: card-flip (rotateY) on study interactions, soft card-float on idle state

## Constraints

- No purple, green, or blue accents — only navy + red + cream
- No gradients on text or backgrounds — only subtle shadow layering
- All colors OKLCH, no raw hex or RGB
- Mobile-first responsive (375px–1400px)

## Signature Detail

Card-flip animation metaphor: each flashcard rotates on interaction, visually reinforcing the act of learning — turning over a card to reveal the answer. Combines interaction delight with educational purpose.
