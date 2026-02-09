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
    
    resolveDoorStuck(door) {
        // If door is closed, check if player or enemies are stuck inside
        const hitbox = door.getHitbox();
        const entities = [this.player, ...this.worldSystem.enemies];
        
        for (const entity of entities) {
            // Check collision with the new door hitbox
            // Use entity hitbox logic (simplified)
            const ew = entity.hitboxWidth || entity.width;
            const eh = entity.hitboxHeight || entity.height;
            const ey = entity.hitboxOffsetY || 0;
            
            const ex = entity.x - ew/2;
            const ey_top = entity.y + ey - eh/2;
            
            // AABB Check
            if (ex < hitbox.x + hitbox.w &&
                ex + ew > hitbox.x &&
                ey_top < hitbox.y + hitbox.h &&
                ey_top + eh > hitbox.y) {
                
                // Stuck! Squeeze out.
                // Find shortest exit direction.
                
                // Centers
                const doorCX = hitbox.x + hitbox.w/2;
                const doorCY = hitbox.y + hitbox.h/2;
                const entCX = ex + ew/2;
                const entCY = ey_top + eh/2;
                
                const dx = entCX - doorCX;
                const dy = entCY - doorCY;
                
                // Normalize to axis
                if (Math.abs(dx) > Math.abs(dy)) {
                    // Push Horizontal
                    const pushDir = dx > 0 ? 1 : -1;
                    // Push to edge + margin
                    const targetX = doorCX + (hitbox.w/2 + ew/2 + 2) * pushDir;
                    entity.x = targetX;
                } else {
                    // Push Vertical
                    const pushDir = dy > 0 ? 1 : -1;
                    const targetY = doorCY + (hitbox.h/2 + eh/2 + 2) * pushDir;
                    // Adjust back to entity.y (center)
                    // targetY is new entCY.
                    // entCY = y + ey. => y = entCY - ey.
                    entity.y = targetY - ey; // Keep center relative offset? No, entity.y is center usually.
                    // Wait, entity.y + ey is center of hitbox?
                    // Player: y is center visual. Hitbox offset Y=12.
                    // So Center Hitbox Y = y + 12.
                    // So y = Center Hitbox Y - 12.
                    entity.y = targetY - ey + eh/2 - eh/2; // wait.
                    // targetY is the new Center Y of hitbox.
                    // So new Entity Y = targetY - (entity.hitboxOffsetY || 0).
                    // Actually Player hitbox center is: y + hitboxOffsetY. (12)
                    // If we set entity.y, we need to respect that.
                    entity.y = targetY - ey;
                }
                
                // Re-verify wall collision to ensure we didn't push into a wall?
                // For now, just a hard push is better than being stuck.
            }
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

        if (keys.space && this.player.rollCooldown <= 0 && isMoving) {
            this.player.state = 'roll';
            this.player.rollDuration = 15;
            this.player.angle = Math.atan2(dy, dx);
            this.player.animationTimer = 0;
            return;
        }

        if (isMoving) {
            this.player.state = 'run';
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;
            const nextX = this.player.x + dx * this.player.speed;
            const nextY = this.player.y + dy * this.player.speed;
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
            this.worldSystem.resolveWallCollision(this.player, nextX, nextY);
        }
    }

    updateEquippedItem() {
        if (!this.inventorySystem) return;
        const item = this.inventorySystem.getSelectedItem();
        
        if (!item || !item.itemId) {
            this.handSystem.setWeapon('default_pistol');
            return;
        }
        
        if (item.def.type === 'weapon') {
            this.handSystem.setWeapon(item.def.data.weaponConfigId);
        } else if (item.def.type === 'placeable') {
            this.handSystem.setWeapon('hammer');
        }
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

        if (mouse.down) {
            // Build Mode
            if (this.buildSystem && this.buildSystem.active) {
                if (!this.mousePressed) {
                    this.mousePressed = true;
                    if (this.buildSystem.place()) {
                         this.updateEquippedItem();
                    }
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
