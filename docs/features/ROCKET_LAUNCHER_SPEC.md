# Rocket Launcher Implementation Plan

This document outlines the steps to add a Rocket Launcher (RPG) to the game.

## 1. Assets Creation

### 1.1 Weapon Sprite (`src/assets/weapons/RocketLauncherSprite.js`)
*   **Style**: Bulky, shoulder-mounted style. Green/Metal colors.
*   **Dimensions**: 24x12 or larger (e.g., 28x14).
*   **Palette**:
    *   `G`/`g` (Metal)
    *   `7` (Dark Wood/Greenish grip?) - Maybe add green to palette if missing, or use Dark Grey. Actually Palette has 'z'/'Z' for zombie green, maybe use 'v'/'V' (Vest Blue/Grey) or just standard Gun colors. Let's stick to Metal/Black for now, maybe 'b' (Dark Leather) for grip.

### 1.2 Rocket Projectile Sprite (`src/assets/weapons/RocketProjectileSprite.js`)
*   **Style**: Pixel art missile.
*   **Dimensions**: Small, e.g., 8x4 or 10x5.
*   **Palette**: Metal body, Red/Orange tip.

### 1.3 Explosion Animation (`src/assets/fx/ExplosionSprite.js`)
*   **Style**: Expanding sphere of fire/smoke.
*   **Frames**: 5-8 frames of pixel art explosion.
*   **Palette**: `y`/`Y` (Fire), `x`/`X` (Dark Red/Brown for smoke), `9` (Grey smoke).

## 2. Code Implementation

### 2.1 Asset Registration (`src/graphics/Assets.js`)
*   Import and generate sprites for Launcher, Projectile, and Explosion.

### 2.2 Weapon Data Configuration (`src/assets/weapons/WeaponData.js`)
*   Add `rocket_launcher` entry.
*   **Stats**:
    *   `fireRate`: 1500ms (Slow)
    *   `damage`: 50 (High)
    *   `bulletSpeed`: 8 (Slower than bullets)
    *   `bulletLife`: 100
    *   `bulletType`: 'rocket' (New)
    *   `blastRadius`: 64 (2 tiles)
    *   `knockback`: 8

### 2.3 Game Logic Updates (`src/core/Game.js`)

#### Bullet Update Loop (`updateBullets`)
*   **Trail Effect**: If `b.type === 'rocket'`, spawn small smoke particles every frame.
*   **Collision Handling**:
    *   When hitting Wall/Object/Enemy:
        *   If `b.type === 'rocket'`, call `this.spawnExplosion(b.x, b.y, b.damage, b.blastRadius, b.knockback)`.
        *   Else: Standard logic.

#### Explosion Logic (`spawnExplosion`)
*   **Visual**: Spawn `Explosion` entity or particle effect.
*   **Area Damage**:
    *   Iterate all enemies.
    *   Calculate distance. If `dist < radius`:
        *   Deal damage.
        *   Apply knockback (vector from center to enemy).
    *   Iterate breakable objects.
    *   Break them if in radius.

#### Particle System
*   Ensure particles can support the "Smoke Trail" (fading grey squares).

## 3. Validation
*   Build project.
*   Test firing against walls (should explode).
*   Test firing against enemies (should explode, damage multiple if close, knock back).
