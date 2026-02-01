# Roguelike Shooter

A top-down pixel art shooter game inspired by Enter the Gungeon.

## Features
- **32x32 Pixel Art Style**: Custom sprite generation system.
- **45-Degree View**: Pseudo-3D wall rendering.
- **Z-Sorting**: Correct depth occlusion for sprites and walls.
- **Combat**: Dodge roll, shooting, and basic enemy AI.
- **Animations**: Player idle and run animations.
- **Responsive**: Fullscreen support with 1.5x zoom scaling.

## Project Structure
- `src/core`: Game loop, input handling, camera.
- `src/graphics`: `SpriteGenerator` for creating pixel art from text templates.
- `src/assets`: Art asset templates (characters, weapons, palette).
- `src/utils`: Constants and helpers.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Pixel Art Tool
We use a text-based `SpriteGenerator` to create assets. See `src/graphics/Assets.js` for examples.
You can define sprites using a character grid and a color palette.
