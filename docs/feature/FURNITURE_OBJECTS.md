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
Implemented using `PixelDraw` procedural generation，对标 Barrel/Vase 高品质标准。
- **Perspective**: Top-Down with slight front-facing projection (approx 35-45 degree tilt implied).
- **Techniques**:
  - **Outlines**: 深色轮廓线（`strokePath`）包裹床头板/床尾板/枕头/被子各部件。
  - **Bevels**: Light pixels on top-left edges, dark pixels on bottom-right edges of wood frames.
  - **Thickness**: "Top Face" polygons drawn above the "Front Face" to simulate depth.
  - **Wood Grain**: 床头板 3 条竖向板条纹 + 高光像素。
  - **Volumetric Shading**:
    - **Pillow**: Center crease shadow, rounded outline, side volume shading.
    - **Mattress**: Side thickness shadow + stitch lines at 1/3 and 2/3 height.
    - **Blanket**: Fold ridges using `fillPath` trapezoid shapes, side overhangs, dark fold-over edge.
  - **Shadow Overlay**: 右侧 `rgba(0,0,0,0.25)` 半透明阴影覆盖。

### Physics & Collision
- **Hitbox (Movement)**: Matches the "ground footprint" of the object.
  - Vertical: `26x40` (Offset to match bed frame base).
  - Horizontal: `44x26` (Offset to match bed frame base).
- **Hurtbox (Combat)**: Matches the full visual volume (Hitbox used as proxy for solid block).
- **Shadow**: Rectangular shadow drawn beneath the object to ground it.

## Furniture Set

所有家具统一使用高品质绘制标准（5 层结构）：
1. **有机形状** — `fillPath` 替代 `rect`，角落切角
2. **深色轮廓** — `strokePath` 轮廓线
3. **内部细节** — 木纹线、面板倒角、五金件双像素（高光+阴影）
4. **右侧阴影叠加** — `rgba(0,0,0,0.25)` 覆盖右侧 25-30%
5. **左上高光** — 顶边/左边高光色

共享色板: `FurniturePalette.js`（含 cWoodOutline, cWoodHighlight, cWoodGrain, cShadow, cShadowDeep）。

### 1. Nightstand (`nightstand`)
- **Visuals**: 16x24px. 2 Drawers with Gold knobs.
- **3D Details**: Top face with chamfer, drawer recesses using `fillPath`+`cShadowDeep`（非 strokeRect）, bevelled panel edges (top-left light, bottom-right dark), body outline, right-side shadow overlay.
- **Physics**: 16x16 Hitbox centered in tile. HP 30.

### 2. Wardrobe (`wardrobe`)
- **Visuals**: 32x56px. Tall double-door closet.
- **3D Details**: Door panels with `fillPath` inner bevel, vertical wood grain lines per door, center gap deep shadow, cornice 3D molding with overhang shadow, plinth base highlight, full outline, right-side 5px shadow overlay.
- **Physics**: 32x24 Hitbox (Footprint). HP 80.
- **Combat**: Tall Hurtbox covers full height (56px) to catch high-flying projectiles.

### 3. Table (`table`)
- **Visuals**: 32x24px. Wood table.
- **3D Details**: Tapered legs via `fillPath` (narrower at bottom), chamfered top surface corners, 4 wood grain lines, front face with chamfered bottom corners, full slab outline, right-side shadow overlay, left/top highlights.
- **Physics**: 30x20 Hitbox. HP 40.

### 4. Sofa (`sofa`)
- **Visuals**: 48x24px. Steel blue fabric, tufted backrest, rounded arms.
- **3D Details**: Cushion center depression dots, armrest chamfered bottom corners with top-face highlights, full outline in deep blue, stitching lines on backrest, right-side shadow overlay.
- **Physics**: 44x20 Hitbox. HP 60.

### 5. Bookshelf (`bookshelf`)
- **Visuals**: 32x48px. Tall wooden shelves filled with varied books.
- **3D Details**: Chamfered top corners, cornice with highlight bevel, shelf top highlight + bottom shadow, **deterministic** book layout (no `Math.random()`), plant pot with `fillPath` rounded shape, bottom cabinet with dual door panels + bevels + gold handles, frame outline, right-side 4px shadow overlay, left edge highlight.
- **Physics**: 32x16 Hitbox (Footprint). HP 60.

### 6. TV Stand (`tv_stand`)
- **Visuals**: 40x32px. Low wooden cabinet with CRT TV on top.
- **Animation**: 4-frame animation of a "News Anchor" on the TV screen (talking, moving head).
- **3D Details**: Tapered legs, cabinet body with chamfered corners, glass door recesses with reflection lines, cabinet outline + shadow. CRT TV with chamfered 4-corner casing, 3px top face, dark bezel around screen, scanlines + glare, power light blinking, antenna, TV right-side shadow overlay.
- **Architecture**: 柜体绘制提取为 `drawCabinet()` 辅助函数，4 帧共享。
- **Physics**: 40x16 Hitbox. HP 40.

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
