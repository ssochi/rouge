import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { DroppedItem } from '../entities/DroppedItem.js';

export class PlayerSystem {
    constructor({ player, input, handSystem, combatSystem, worldSystem, droppedItems, vehicles, inventorySystem, buildSystem }) {
        this.player = player;
        this.input = input;
        this.handSystem = handSystem;
        this.combatSystem = combatSystem;
        this.worldSystem = worldSystem;
        this.droppedItems = droppedItems;
        this.vehicles = vehicles || [];
        this.inventorySystem = inventorySystem;
        this.buildSystem = buildSystem;
        this.mousePressed = false;

        if (this.handSystem && this.handSystem.bindInstanceSync) {
            this.handSystem.bindInstanceSync((payload) => this.syncEquippedWeaponInstance(payload));
        }
    }

    syncEquippedWeaponInstance(payload) {
        if (!this.inventorySystem || !payload) return;
        this.inventorySystem.updateWeaponInstanceState(payload);
    }

    updateDroppedItems() {
        this.droppedItems.forEach(item => item.update(this.player));
        
        const keys = this.input.keys;
        if (keys.e && !this.player.ePressed) {
            this.player.ePressed = true;
            // Interaction Priority: Vehicle > Portal > Item
            if (!this.tryEnterVehicle()) {
                if (!this.tryEnterPortal()) {
                    if (!this.tryInteractWithObject()) {
                        this.tryPickupWeapon();
                    }
                }
            }
        } else if (!keys.e) {
            this.player.ePressed = false;
        }
    }
    
    tryEnterVehicle() {
        if (!this.vehicles) return false;
        
        for (const v of this.vehicles) {
            // Check distance to vehicle center
            const dx = this.player.x - v.x;
            const dy = this.player.y - v.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Interaction radius: 50px
            if (dist < 50) {
                v.enter(this.player);
                this.player.state = 'driving';
                return true;
            }
        }
        return false;
    }
    
    tryEnterPortal() {
        if (!this.worldSystem || !this.worldSystem.portals) return false;
        
        for (const p of this.worldSystem.portals) {
            const hitbox = p.getHitbox();
            // Check center distance for interaction
            const cx = hitbox.x + hitbox.width / 2;
            const cy = hitbox.y + hitbox.height / 2;
            const dx = this.player.x - cx;
            const dy = this.player.y - cy;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 40) { // 40px interaction range
                this.worldSystem.loadMap(p.targetMap);
                return true;
            }
        }
        return false;
    }

    tryInteractWithObject() {
        if (!this.worldSystem || !this.worldSystem.breakableObjects) return false;

        for (const obj of this.worldSystem.breakableObjects) {
            if (obj.interact) { // Check if object is interactable
                // Simple distance check to object center
                const centerX = obj.x + (obj.width || 32) / 2;
                const centerY = obj.y + (obj.height || 32) / 2;
                
                const dx = this.player.x - centerX;
                const dy = this.player.y - centerY;
                const dist = Math.sqrt(dx*dx + dy*dy);

                if (dist < 50) { // 50px interaction radius
                    // Store state before interaction
                    const wasOpen = obj.isOpen;

                    if (wasOpen && this.isDoorCloseBlocked(obj)) {
                        console.log('Door is blocked');
                        return true;
                    }
                    
                    if (obj.interact()) {
                        // Interaction successful
                        
                        // Check if we just closed a door (Open -> Closed)
                        if (wasOpen && !obj.isOpen) {
                            this.resolveDoorStuck(obj);
                        }
                        
                        return true;
                    }
                }
            }
        }
        return false;
    }

    _rectsOverlap(rect1, rect2) {
        const r1w = rect1.width ?? rect1.w;
        const r1h = rect1.height ?? rect1.h;
        const r2w = rect2.width ?? rect2.w;
        const r2h = rect2.height ?? rect2.h;
        return (
            rect1.x < rect2.x + r2w &&
            rect1.x + r1w > rect2.x &&
            rect1.y < rect2.y + r2h &&
            rect1.y + r1h > rect2.y
        );
    }

    getDoorClosedHitboxes(door) {
        if (door.baseType === 'door_h') {
            return [{
                x: door.x + 0,
                y: door.y + 10,
                width: 32,
                height: 12
            }];
        }
        if (door.baseType === 'door_v') {
            return [{
                x: door.x + 10,
                y: door.y + 0,
                width: 12,
                height: 32
            }];
        }
        return [door.getHitbox()];
    }

    isDoorCloseBlocked(door) {
        if (!door || !door.isOpen) return false;
        const closedHitboxes = this.getDoorClosedHitboxes(door);
        const entities = [this.player, ...this.worldSystem.enemies];

        for (const entity of entities) {
            const eRect = this.worldSystem.getEntityMovementRect(entity, entity.x, entity.y);
            for (const hb of closedHitboxes) {
                if (this._rectsOverlap(eRect, hb)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    resolveDoorStuck(door) {
        const hitboxes = door.getHitboxes ? door.getHitboxes() : [door.getHitbox()];
        const entities = [this.player, ...this.worldSystem.enemies];
        let resolved = true;
        
        for (const entity of entities) {
            const eRect = this.worldSystem.getEntityMovementRect(entity, entity.x, entity.y);
            const overlap = hitboxes.some(hb => this._rectsOverlap(eRect, hb));
            if (overlap) {
                const unstuck = this.worldSystem.unstuckEntity(entity, { startRadius: 4, maxRadius: 96, step: 2 });
                if (!unstuck) {
                    resolved = false;
                }
            }
        }

        if (!resolved && door.interact) {
            // Re-open door if we failed to resolve overlaps.
            door.interact();
        }
    }
    
    tryPickupWeapon() {
        let closestItem = null;
        let minDist = Infinity;
        
        for (const item of this.droppedItems) {
            if (item.canInteract(this.player)) {
                const dx = this.player.x - item.x;
                const dy = this.player.y - item.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < minDist) {
                    minDist = dist;
                    closestItem = item;
                }
            }
        }
        
        if (closestItem) {
            // Use InventorySystem to pick up
            if (this.inventorySystem) {
                const remaining = this.inventorySystem.add(closestItem.itemId, closestItem.count, closestItem.instanceData);
                
                if (remaining === 0) {
                    // Fully picked up
                    const index = this.droppedItems.indexOf(closestItem);
                    if (index > -1) {
                        this.droppedItems.splice(index, 1);
                    }
                    console.log(`Picked up ${closestItem.name}`);
                } else if (remaining < closestItem.count) {
                    // Partially picked up
                    closestItem.count = remaining;
                    console.log(`Picked up some ${closestItem.name}`);
                } else {
                    console.log(`Inventory full!`);
                }
                
                // Refresh Equipped Item in case we picked up a weapon into empty slot
                this.updateEquippedItem();
            }
        }
    }
    
    // New Drop Interface
    dropItem(itemData) {
        if (!itemData || !itemData.itemId) return;
        
        const dropX = this.player.x + (Math.random() - 0.5) * 30;
        const dropY = this.player.y + (Math.random() - 0.5) * 30;
        
        this.droppedItems.push(new DroppedItem(dropX, dropY, itemData.itemId, itemData.count, itemData.instanceData));
    }

    updatePlayerMovement() {
        const keys = this.input.keys;
        const startState = this.player.state;
        const effectiveSpeed = this.getEffectivePlayerSpeed();

        if (Math.abs(this.player.knockbackX) > 0.1 || Math.abs(this.player.knockbackY) > 0.1) {
            const nextX = this.player.x + this.player.knockbackX;
            const nextY = this.player.y + this.player.knockbackY;
            this.resolveMove(nextX, nextY);
            
            this.player.knockbackX *= 0.8;
            this.player.knockbackY *= 0.8;
            
            if (Math.sqrt(this.player.knockbackX**2 + this.player.knockbackY**2) > 1) {
                return;
            }
        } else {
             this.player.knockbackX = 0;
             this.player.knockbackY = 0;
        }

        if (this.player.state === 'roll') {
            if (effectiveSpeed <= 0) {
                this.player.state = 'idle';
                this.player.rollDuration = 0;
                this.player.rollCooldown = Math.max(this.player.rollCooldown || 0, 10);
                return;
            }

            this.player.rollDuration--;
            if (this.player.rollDuration <= 0) {
                this.player.state = 'idle';
                this.player.rollCooldown = 30;
            }
            const speed = this.player.rollSpeed;
            const nextX = this.player.x + Math.cos(this.player.angle) * speed;
            const nextY = this.player.y + Math.sin(this.player.angle) * speed;
            this.resolveMove(nextX, nextY);
            
            if (this.player.state !== startState) this.player.animationTimer = 0;
            else this.player.animationTimer++;
            return;
        }

        if (this.player.rollCooldown > 0) this.player.rollCooldown--;

        let dx = 0;
        let dy = 0;
        if (keys.w) dy -= 1;
        if (keys.s) dy += 1;
        if (keys.a) dx -= 1;
        if (keys.d) dx += 1;

        const isMoving = dx !== 0 || dy !== 0;

        if (keys.space && this.player.rollCooldown <= 0 && isMoving && effectiveSpeed > 0) {
            this.player.state = 'roll';
            this.player.rollDuration = 15;
            this.player.angle = Math.atan2(dy, dx);
            this.player.animationTimer = 0;
            return;
        }

        if (isMoving && effectiveSpeed > 0) {
            this.player.state = 'run';
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
            const nextX = this.player.x + dx * effectiveSpeed;
            const nextY = this.player.y + dy * effectiveSpeed;
            this.resolveMove(nextX, nextY);
        } else {
            this.player.state = 'idle';
        }

        if (this.player.state !== startState) {
            this.player.animationTimer = 0;
        } else {
            this.player.animationTimer++;
        }
    }

    getEffectivePlayerSpeed() {
        if (this.player.frozenTimer > 0) return 0;
        if (this.player.slowTimer > 0) {
            return this.player.speed * Math.max(0, 1 - (this.player.slowAmount || 0));
        }
        return this.player.speed;
    }
    
    resolveMove(nextX, nextY) {
        // Check Vehicle Collision
        let blocked = false;
        if (this.vehicles) {
            for (const v of this.vehicles) {
                if (v.isDead) continue;
                
                const pw = this.player.hitboxWidth / 2 || 7;
                const ph = this.player.hitboxHeight / 2 || 4;
                const py = this.player.hitboxOffsetY || 12;
                
                const pfx = nextX;
                const pfy = nextY + py;
                
                const aabbX = pfx - pw;
                const aabbY = pfy - ph;
                const aabbW = pw * 2;
                const aabbH = ph * 2;
                
                const hitVehicle = v.intersectsAabb
                    ? v.intersectsAabb(aabbX, aabbY, aabbW, aabbH)
                    : (aabbX + aabbW > v.x - v.hitbox.width / 2 &&
                       aabbX < v.x + v.hitbox.width / 2 &&
                       aabbY + aabbH > v.y - v.hitbox.height / 2 &&
                       aabbY < v.y + v.hitbox.height / 2);
                
                if (hitVehicle) {
                    blocked = true;
                    break;
                }
            }
        }
        
        if (!blocked) {
            const intentX = nextX - this.player.x;
            const intentY = nextY - this.player.y;
            this.worldSystem.resolveEntityMovement(this.player, nextX, nextY, intentX, intentY);
        }
    }

    updateEquippedItem() {
        if (!this.inventorySystem) return;
        const selectedIndex = this.inventorySystem.getSelectedSlotIndex();
        const item = this.inventorySystem.getSelectedItem();
        
        if (!item || !item.itemId) {
            this.handSystem.setWeapon('hammer');
            return;
        }
        
        if (item.def.type === 'weapon') {
            const instanceData = this.inventorySystem.ensureWeaponInstanceForSlot(selectedIndex);
            this.handSystem.setWeapon(item.def.data.weaponConfigId, instanceData, item.itemId);
        } else if (item.def.type === 'consumable') {
            const holdWeaponKey = item.def.data?.holdWeaponKey || 'recovery_needle';
            if (WEAPONS[holdWeaponKey]) {
                this.handSystem.setWeapon(holdWeaponKey);
            } else {
                this.handSystem.setWeapon('hammer');
            }
        } else if (item.def.type === 'placeable') {
            this.handSystem.setWeapon('hammer');
        }
    }

    useSelectedConsumable(selectedItem = null) {
        if (!this.inventorySystem) return false;

        const slotIndex = this.inventorySystem.getSelectedSlotIndex();
        const item = selectedItem || this.inventorySystem.getSelectedItem();
        if (!item || !item.itemId || item.def?.type !== 'consumable') return false;

        const removed = this.inventorySystem.remove(slotIndex, 1);
        if (removed <= 0) return false;

        const data = item.def?.data || {};

        // Max HP boost (e.g. recovery needle: +50% max HP then full heal)
        if (data.maxHpBoostPercent) {
            const boost = Math.max(0, Number(data.maxHpBoostPercent) || 0);
            const oldMax = Number.isFinite(this.player.maxHp) ? this.player.maxHp : 100;
            this.player.maxHp = Math.round(oldMax * (1 + boost / 100));
            this.player.hp = this.player.maxHp;
        } else {
            const healAmount = Math.max(0, Number(data.healAmount) || 0);
            const maxHp = Number.isFinite(this.player.maxHp) ? this.player.maxHp : 100;
            const currentHp = Number.isFinite(this.player.hp) ? this.player.hp : maxHp;
            this.player.hp = Math.min(maxHp, currentHp + healAmount);
        }

        this.updateEquippedItem();
        return true;
    }

    handleHotbarInput() {
        if (!this.inventorySystem) return;

        const keys = this.input.keys;
        for (let i = 1; i <= 9; i++) {
            const key = i.toString();
            if (keys[key]) {
                const slotIndex = i - 1;
                if (this.inventorySystem.selectHotbarSlot(slotIndex)) {
                    this.updateEquippedItem();
                }
            }
        }
    }

    updatePlayerAimAndAction() {
        this.handleHotbarInput();

        if (this.player.state === 'roll') return;

        const mouse = this.input.mouse;
        const keys = this.input.keys;

        if (mouse.worldX < this.player.x) this.player.facingRight = false;
        else this.player.facingRight = true;

        this.player.angle = this.handSystem.angle;

        // Reload (R)
        if (keys.r && !this.player.rPressed) {
            this.player.rPressed = true;
            this.handSystem.startReload();
        } else if (!keys.r) {
            this.player.rPressed = false;
        }

        // Spawn nearby vehicle (O)
        if (keys.o && !this.player.oPressed) {
            this.player.oPressed = true;
            if (this.worldSystem && this.worldSystem.spawnVehicleNearPlayer) {
                this.worldSystem.spawnVehicleNearPlayer();
            }
        } else if (!keys.o) {
            this.player.oPressed = false;
        }

        const selectedItem = this.inventorySystem ? this.inventorySystem.getSelectedItem() : null;

        if (mouse.down) {
            // Build Mode
            if (selectedItem && selectedItem.def?.type === 'placeable' && this.buildSystem && this.buildSystem.active) {
                if (!this.mousePressed) {
                    this.mousePressed = true;
                    if (this.buildSystem.place()) {
                         this.updateEquippedItem();
                    }
                }
            } else if (selectedItem && selectedItem.def?.type === 'consumable') {
                if (!this.mousePressed) {
                    this.mousePressed = true;
                    this.useSelectedConsumable(selectedItem);
                }
            } else {
                // Shoot Mode (Auto-fire supported by CombatSystem rate limiting)
                if (this.handSystem.canShoot()) {
                    const shotFired = this.combatSystem.tryShoot();
                    if (shotFired) {
                        this.handSystem.consumeAmmo();
                    }
                } else {
                    // Auto reload if empty and clicking
                    // Only if not already reloading
                    if (!this.handSystem.isReloading) {
                        const state = this.handSystem.getWeaponState();
                        if (state && state.currentAmmo === 0 && state.reserveAmmo > 0) {
                            this.handSystem.startReload();
                        }
                    }
                }
            }
        } else {
            this.mousePressed = false;
        }
    }
}
