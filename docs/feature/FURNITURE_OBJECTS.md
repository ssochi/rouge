# Furniture & Environmental Objects Specification

## Overview
This document outlines the implementation of environmental objects (Furniture, Walls) with a focus on Pseudo-3D visualization in a Top-Down 2.5D perspective.

## Bed Object
### Variants
1. **Vertical Bed (`bed`)**
   - **Dimensions**: 28x48px (Visual), 32x48px (Sprite Canvas).
   - **Orientation**: Vertical (Head at top, Foot at bottom).
   - **Placement**: Aligns with tile grid but sprite projects upward (Draw Offset `y: -16`).
2. **Horizontal Bed (`bed_h`)**
   - **Dimensions**: 48x28px (Visual), 48x32px (Sprite Canvas).
   - **Orientation**: Horizontal (Head at left, Foot at right).
   - **Placement**: Spans 1.5 tiles width.

### Visual Design (Pseudo-3D)
Implemented using `PixelDraw` procedural generation.
- **Perspective**: Top-Down with slight front-facing projection (approx 35-45 degree tilt implied).
- **Techniques**:
  - **Bevels**: Light pixels on top-left edges, dark pixels on bottom-right edges of wood frames.
  - **Thickness**: "Top Face" polygons drawn above the "Front Face" to simulate depth.
  - **Volumetric Shading**:
    - **Pillow**: Center indent shadow and side volume shading.
    - **Mattress**: Side thickness shadow.
    - **Blanket**: Fold-over top edge with thickness, volumetric side overhangs.

### Physics & Collision
- **Hitbox (Movement)**: Matches the "ground footprint" of the object.
  - Vertical: `26x40` (Offset to match bed frame base).
  - Horizontal: `44x26` (Offset to match bed frame base).
- **Hurtbox (Combat)**: Matches the full visual volume (Hitbox used as proxy for solid block).
- **Shadow**: Rectangular shadow drawn beneath the object to ground it.

## Furniture Set
### 1. Nightstand (`nightstand`)
- **Visuals**: 16x24px. 2 Drawers with Gold knobs.
- **3D Details**: Top face projection, drawer depth shading, bevelled edges.
- **Physics**: 16x16 Hitbox centered in tile. HP 30.

### 2. Wardrobe (`wardrobe`)
- **Visuals**: 32x56px. Tall double-door closet.
- **3D Details**: Top cornice (overhang), plinth base, door gap bevels, side depth shading.
- **Physics**: 32x24 Hitbox (Footprint). HP 80.
- **Combat**: Tall Hurtbox covers full height (56px) to catch high-flying projectiles.

### 3. Table (`table`)
- **Visuals**: 32x24px. Wood table.
- **3D Details**: Thick table top, legs with inner shading, top surface perspective.
- **Physics**: 30x20 Hitbox. HP 40.

### 4. Sofa (`sofa`)
- **Visuals**: 48x24px. Deep red fabric, tufted backrest, rounded arms.
- **3D Details**: Fabric shading, button tufts, rounded cushion fronts.
- **Physics**: 44x20 Hitbox. HP 60.

### 5. Bookshelf (`bookshelf`)
- **Visuals**: 32x48px. Tall wooden shelves filled with varied books.
- **3D Details**: Deep back panel shadow, thick shelves, varied book orientations (leaning, stacked).
- **Physics**: 32x16 Hitbox (Footprint). HP 60.

### 6. TV Stand (`tv_stand`)
- **Visuals**: 40x32px. Low wooden cabinet with CRT TV on top.
- **Animation**: 4-frame animation of a "News Anchor" on the TV screen (talking, moving head).
- **3D Details**: TV screen reflection/glare, bezel depth, glass doors on cabinet, power light blinking.
- **Physics**: 40x16 Hitbox. HP 40.
- **Implementation**: Uses `createTVStandAnimatedSprite` generating an array of frames. `BreakableObject` handles frame updates.

## Wall Object
### Variants
1. **Vertical Wall (`wall_v`)**
   - **Size**: 8x32px (Physical), Taller visual sprite.
   - **Logic**: Thin wall, blocks movement and bullets.
2. **Horizontal Wall (`wall_h`)**
   - **Size**: 32x8px.

### Implementation
- **Material**: Concrete/Stone.
- **3D Details**: Bevel highlights, corner shading.
- **Collision**:
  - **Bullet Tunneling Fix**: Uses Continuous Collision Detection (Raycasting) to prevent fast bullets from skipping over thin walls.

## Integration
- **File**: `src/core/entities/BreakableObject.js`
- **Assets**: 
  - `src/assets/objects/BedSprite.js`
  - `src/assets/objects/furniture/` (Nightstand, Wardrobe, Table, Sofa, Bookshelf, TVStand)
- **Rendering**: Uses `drawOffset` to align tall sprites correctly with their physics footprint.
