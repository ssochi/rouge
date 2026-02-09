// HandSystem.js
// Manages the floating hands and weapon holding
// Style: Enter the Gungeon
// - Gun orbits the body center.
// - Hands are attached to specific points on the gun (Grip, Barrel).
// - Z-Sorting: Hands/Gun can be behind or in front of the player.

import { Assets } from '../graphics/Assets.js';
import { WEAPONS, WeaponType } from '../assets/weapons/WeaponData.js';

export class HandSystem {
    constructor(player) {
        this.player = player;
        
        // Load default weapon
        this.currentWeaponId = 'default_pistol';
        this.currentWeapon = WEAPONS[this.currentWeaponId];
        
        // Config
        this.orbitRadius = this.currentWeapon.orbitRadius; 
        
        // State
        this.angle = 0; // Current aim angle
        
        // Recoil & Flash
        this.recoilOffset = 0;
        this.showFlash = false;
        this.flashTimer = 0;

        // Ammo & Reload State
        this.weaponStates = new Map();
        this.isReloading = false;
        this.reloadTimer = 0;
        this.reloadDuration = 0;
        
        // Init state for default weapon
        this.initWeaponState(this.currentWeaponId);
    }

    initWeaponState(weaponKey) {
        if (!this.weaponStates.has(weaponKey) && WEAPONS[weaponKey]) {
            const data = WEAPONS[weaponKey];
            this.weaponStates.set(weaponKey, {
                currentAmmo: data.magazineSize,
                reserveAmmo: data.maxReserve,
                maxAmmo: data.magazineSize,
                maxReserve: data.maxReserve
            });
        }
    }

    getWeaponState() {
        return this.weaponStates.get(this.currentWeaponId);
    }

    canShoot() {
        if (this.isReloading) return false;
        const state = this.getWeaponState();
        return state && state.currentAmmo > 0;
    }

    consumeAmmo() {
        const state = this.getWeaponState();
        if (state && state.currentAmmo > 0) {
            state.currentAmmo--;
            // Auto reload if empty? Handled by PlayerSystem or here?
            // Let's keep it manual or auto-trigger in update loop if needed.
            // For now just consume.
        }
    }

    startReload() {
        if (this.isReloading) return;
        
        const state = this.getWeaponState();
        if (!state) return;

        // Check if full
        if (state.currentAmmo >= state.maxAmmo) return;
        // Check if has reserve
        if (state.reserveAmmo <= 0) return;

        this.isReloading = true;
        this.reloadDuration = this.currentWeapon.reloadTime || 1000;
        this.reloadTimer = this.reloadDuration;
    }

    update(mouseWorldX, mouseWorldY) {
        // Calculate aim angle
        const dx = mouseWorldX - this.player.x;
        const dy = mouseWorldY - this.player.y;
        this.angle = Math.atan2(dy, dx);

        // Update Reload
        if (this.isReloading) {
            this.reloadTimer -= 16.67; // Approx 60fps (1000/60)
            if (this.reloadTimer <= 0) {
                this.completeReload();
            }
        }

        // Update Recoil
        if (this.recoilOffset > 0) {
            this.recoilOffset *= 0.8; // Decay
            if (this.recoilOffset < 0.1) this.recoilOffset = 0;
        }

        // Update Flash
        if (this.showFlash) {
            this.flashTimer--;
            if (this.flashTimer <= 0) {
                this.showFlash = false;
            }
        }
    }

    completeReload() {
        this.isReloading = false;
        const state = this.getWeaponState();
        if (state) {
            const needed = state.maxAmmo - state.currentAmmo;
            const available = Math.min(needed, state.reserveAmmo);
            state.currentAmmo += available;
            state.reserveAmmo -= available;
        }
    }

    triggerShoot() {
        this.recoilOffset = 4; // Kick back 4 pixels
        this.showFlash = true;
        this.flashTimer = 3; // Show for 3 frames
    }

    // Return true if hands should be drawn BEHIND player
    isBehind() {
        // Up direction: -PI/2
        // If angle is within roughly -PI/4 to -3PI/4, draw behind
        // 45 deg to 135 deg (upwards)
        const PI = Math.PI;
        // Normalize angle to -PI ... PI
        // -PI/2 is Up.
        return (this.angle > -PI * 0.8 && this.angle < -PI * 0.2);
    }

    // Switch weapon
    setWeapon(weaponKey) {
        if (WEAPONS[weaponKey]) {
            // Cancel reload if switching?
            if (this.isReloading) {
                this.isReloading = false;
                this.reloadTimer = 0;
            }

            this.currentWeaponId = weaponKey;
            this.currentWeapon = WEAPONS[weaponKey];
            this.orbitRadius = this.currentWeapon.orbitRadius;
            
            // Ensure state exists
            this.initWeaponState(weaponKey);
        }
    }

    getMuzzleWorldPosition(now) {
        const angle = this.angle;
        const weapon = this.currentWeapon;
        const gunScale = weapon.scale || 1;

        let bobY = 0;
        if (this.player.state === 'idle') {
            bobY = Math.sin(now / 300) * 0.5;
        } else if (this.player.state === 'run') {
            bobY = Math.sin(now / 100) * 1.0;
        }

        const currentDist = this.orbitRadius - this.recoilOffset;
        const pivotX = this.player.x + Math.cos(angle) * currentDist;
        const pivotY = this.player.y + Math.sin(angle) * currentDist + bobY;

        const muzzle = weapon.muzzleOffset || { x: 10, y: 0 };
        let mx = muzzle.x * gunScale;
        let my = muzzle.y * gunScale;

        const isFlipped = Math.abs(angle) > Math.PI / 2;
        if (isFlipped) my = -my;

        const rx = mx * Math.cos(angle) - my * Math.sin(angle);
        const ry = mx * Math.sin(angle) + my * Math.cos(angle);

        return { x: pivotX + rx, y: pivotY + ry, angle };
    }

    draw(ctx) {
        if (this.player.state === 'roll') return;

        ctx.save();
        ctx.translate(this.player.x, this.player.y);

        // Global Bobbing (Applied to hands and gun)
        let bobY = 0;
        if (this.player.state === 'idle') {
            bobY = Math.sin(Date.now() / 300) * 0.5; 
        } else if (this.player.state === 'run') {
            bobY = Math.sin(Date.now() / 100) * 1.0;
        }

        // --- 1. Draw Idle Off-Hand (if one-handed) ---
        // If one-handed (Pistol), left hand is not on gun.
        // It should be drawn relative to body, not gun.
        // And it should be behind/front based on facing?
        // Usually idle hand is just at side.
        // Let's draw it simple: slightly offset from body center.
        if (this.currentWeapon.type === WeaponType.PISTOL) {
             // Calculate position for idle hand
             // If facing right (angle around 0), left hand is "behind" body (further Z).
             // If facing left (angle around PI), left hand is "front" body (closer Z).
             // Wait, standard 2D side view:
             // Facing Right: Left hand is the "back" hand (far side)? No, Left hand is usually off-hand.
             // Actually, let's just place it at body side.
             // Offset: x = -2, y = 10 (low down)
             // We need to Flip if player is facing left?
             // HandSystem doesn't know player.facingRight explicitly, but we have this.angle.
             
             // Draw Idle Left Hand
             ctx.save();

             if (Math.abs(this.angle) > Math.PI / 2) {
                 // Facing Left
                 ctx.translate(4, 10 + bobY); 
             } else {
                 // Facing Right
                 ctx.translate(-4, 10 + bobY);
             }
             this.drawHand(ctx, 0, 0);
             ctx.restore();
        }

        // --- 2. Calculate Gun Position & Transform ---
        const currentDist = this.orbitRadius - this.recoilOffset;
        const gunX = Math.cos(this.angle) * currentDist;
        const gunY = Math.sin(this.angle) * currentDist;

        // Apply bobY to gun vertical position
        ctx.translate(gunX, gunY + bobY);
        ctx.rotate(this.angle);

        const isFlipped = Math.abs(this.angle) > Math.PI / 2;
        if (isFlipped) {
            ctx.scale(1, -1);
        }

        // --- 3. Draw Weapon Components (Z-Sorted) ---
        const gunScale = this.currentWeapon.scale || 1;
        
        // Draw Gun Sprite
        if (Assets[this.currentWeapon.sprite]) {
             const drawOffset = this.currentWeapon.drawOffset || { x: 0, y: -5 };
             ctx.save();
             ctx.scale(gunScale, gunScale);
             ctx.drawImage(Assets[this.currentWeapon.sprite], drawOffset.x, drawOffset.y);
             
             // Draw Muzzle Flash
             if (this.showFlash && Assets.muzzleFlash) {
                 const muzzle = this.currentWeapon.muzzleOffset || {x: 10, y: 0};
                 // Adjust X by -4 because the flash sprite has padding/start offset
                 // Adjust Y by -8 to center vertically (16px height)
                 ctx.drawImage(Assets.muzzleFlash, muzzle.x - 4, muzzle.y - 8);
             }
             
             ctx.restore();
        }

        if (this.currentWeapon.type === WeaponType.RIFLE && this.currentWeapon.hands.left && this.currentWeapon.hands.right) {
            const left = this.currentWeapon.hands.left;
            const right = this.currentWeapon.hands.right;
            this.drawHand(ctx, right.x * gunScale, right.y * gunScale);
            this.drawHand(ctx, left.x * gunScale, left.y * gunScale);
        } else if (this.currentWeapon.hands.right) {
            this.drawHand(
                ctx,
                this.currentWeapon.hands.right.x * gunScale,
                this.currentWeapon.hands.right.y * gunScale
            );
        }

        ctx.restore();
    }

    drawHand(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y);
        // Draw Hand Asset
        // Hand asset is 32x32 with hand at center.
        // We draw it centered at (x,y)
        if (Assets.hand) {
             ctx.drawImage(Assets.hand, -16, -16);
        }
        ctx.restore();
    }
}
