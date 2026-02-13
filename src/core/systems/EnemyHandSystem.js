import { Assets } from '../../graphics/Assets.js';
import { WEAPONS, WeaponType } from '../../assets/weapons/WeaponData.js';

// HandSystem for Enemies
// Supports aiming, ranged weapon rendering, and melee swing rendering
export class EnemyHandSystem {
    constructor(owner, weaponId = 'default_pistol') {
        this.owner = owner;
        this.currentWeaponId = 'default_pistol';
        this.currentWeapon = WEAPONS[this.currentWeaponId];
        this.orbitRadius = this.currentWeapon.orbitRadius;
        this.angle = 0;

        // Recoil
        this.recoilOffset = 0;
        this.showFlash = false;
        this.flashTimer = 0;

        // Melee system reference (set via setMeleeSystem)
        this.meleeSystem = null;

        this.setWeapon(weaponId);
    }

    setMeleeSystem(meleeSystem) {
        this.meleeSystem = meleeSystem;
    }

    setWeapon(weaponId) {
        if (!weaponId || !WEAPONS[weaponId]) return;
        if (this.meleeSystem && this.meleeSystem.isAttacking) {
            this.meleeSystem.cancelAttack();
        }
        this.currentWeaponId = weaponId;
        this.currentWeapon = WEAPONS[weaponId];
        this.orbitRadius = this.currentWeapon.orbitRadius;
    }

    update(targetX, targetY) {
        // Aim at target
        const dx = targetX - this.owner.x;
        const dy = targetY - this.owner.y;
        this.angle = Math.atan2(dy, dx);

        // Recoil decay
        if (this.recoilOffset > 0) {
            this.recoilOffset *= 0.8;
            if (this.recoilOffset < 0.1) this.recoilOffset = 0;
        }

        if (this.showFlash) {
            this.flashTimer--;
            if (this.flashTimer <= 0) this.showFlash = false;
        }
    }

    triggerShoot() {
        this.recoilOffset = 4;
        this.showFlash = true;
        this.flashTimer = 3;
    }

    getMuzzleWorldPosition() {
        const angle = this.angle;
        const weapon = this.currentWeapon;
        const gunScale = weapon.scale || 1;

        const bobY = 0;

        const currentDist = this.orbitRadius - this.recoilOffset;
        const pivotX = this.owner.x + Math.cos(angle) * currentDist;
        const pivotY = this.owner.y + Math.sin(angle) * currentDist + bobY;

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
        ctx.save();
        ctx.translate(this.owner.x, this.owner.y);

        // Melee swing angle / thrust extension override
        let effectiveAngle = this.angle;
        let effectiveRadius = this.orbitRadius;
        if (this.currentWeapon.isMelee && this.meleeSystem && this.meleeSystem.isAttacking) {
            effectiveAngle = this.meleeSystem.getSwingAngle();
            if (this.meleeSystem.isThrust) {
                effectiveRadius = this.orbitRadius + this.meleeSystem.getThrustProgress() * 20;
            } else {
                effectiveRadius = this.orbitRadius + 2;
            }
        }

        const currentDist = effectiveRadius - this.recoilOffset;
        const gunX = Math.cos(effectiveAngle) * currentDist;
        const gunY = Math.sin(effectiveAngle) * currentDist;

        ctx.translate(gunX, gunY);
        ctx.rotate(effectiveAngle);

        const isFlipped = Math.abs(effectiveAngle) > Math.PI / 2;
        if (isFlipped) {
            ctx.scale(1, -1);
        }

        const gunScale = this.currentWeapon.scale || 1;

        if (Assets[this.currentWeapon.sprite]) {
             const drawOffset = this.currentWeapon.drawOffset || { x: 0, y: -5 };
             ctx.save();
             ctx.scale(gunScale, gunScale);
             ctx.drawImage(Assets[this.currentWeapon.sprite], drawOffset.x, drawOffset.y);

             if (this.showFlash && Assets.muzzleFlash) {
                 const muzzle = this.currentWeapon.muzzleOffset || {x: 10, y: 0};
                 ctx.drawImage(Assets.muzzleFlash, muzzle.x - 4, muzzle.y - 8);
             }
             ctx.restore();
        }

        // Draw Hands — two-hand grip for melee and rifle weapons
        const hands = this.currentWeapon.hands;
        if ((this.currentWeapon.type === WeaponType.RIFLE || this.currentWeapon.type === WeaponType.MELEE)
            && hands.left && hands.right) {
            this.drawHand(ctx, hands.right.x * gunScale, hands.right.y * gunScale);
            this.drawHand(ctx, hands.left.x * gunScale, hands.left.y * gunScale);
        } else if (hands.right) {
            this.drawHand(ctx, hands.right.x * gunScale, hands.right.y * gunScale);
        }

        ctx.restore();
    }

    drawHand(ctx, x, y) {
        if (Assets.hand) {
            ctx.drawImage(Assets.hand, x - 16, y - 16);
        }
    }
}
