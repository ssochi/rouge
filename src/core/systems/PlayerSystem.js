import { WEAPONS } from '../../assets/weapons/WeaponData.js';
import { DroppedItem } from '../entities/DroppedItem.js';
import { getCostumeStats } from '../../assets/characters/player/costumes/CostumeStats.js';
import { PetDog } from '../entities/PetDog.js';
import { PetCat } from '../entities/PetCat.js';
import { Pet2B } from '../entities/Pet2B.js';

export class PlayerSystem {
    constructor({ player, input, handSystem, combatSystem, worldSystem, droppedItems, vehicles, inventorySystem, buildSystem, meleeSystem, particles, pets, onInteract, costumeSystem }) {
        this.player = player;
        this.costumeSystem = costumeSystem || null;
        this.input = input;
        this.handSystem = handSystem;
        this.combatSystem = combatSystem;
        this.worldSystem = worldSystem;
        this.droppedItems = droppedItems;
        this.vehicles = vehicles || [];
        this.inventorySystem = inventorySystem;
        this.buildSystem = buildSystem;
        this.meleeSystem = meleeSystem;
        this.particles = particles || [];
        this.pets = pets || [];
        this.mousePressed = false;
        this.onInteract = onInteract || null;

        if (this.handSystem && this.handSystem.bindInstanceSync) {
            this.handSystem.bindInstanceSync((payload) => this.syncEquippedWeaponInstance(payload));
        }
        // 弹尽销毁：最后一发打出且备弹为零时，销毁当前枪并自动切到下一把武器
        if (this.handSystem && this.handSystem.bindOutOfAmmo) {
            this.handSystem.bindOutOfAmmo(() => this.onWeaponDepleted());
        }
    }

    /**
     * 当前武器弹药彻底耗尽：从背包移除该枪，播放损毁反馈，自动切换到下一个武器槽。
     * 近战/无限弹武器不会触发（HandSystem 侧已过滤）。
     */
    onWeaponDepleted() {
        const inv = this.inventorySystem;
        if (!inv) return;
        const idx = inv.getSelectedSlotIndex();
        const slot = inv.getSelectedSlot();
        if (!slot || !slot.itemId) return;
        const def = inv.getItemDef(slot.itemId);
        if (!def || def.type !== 'weapon') return;

        inv.remove(idx, slot.count);
        this.handSystem?.soundSystem?.play('ui_click');
        // 损毁碎屑
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            this.particles.push({
                x: this.player.x, y: this.player.y - 4,
                vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 1.2 - 0.8,
                life: 18, color: '#9aa4b0', size: 2, friction: 0.9
            });
        }
        // 环扫快捷栏找下一把武器（找不到武器就保持当前空槽）
        const hotbarSize = Math.min(inv.slots.length, 9);
        for (let off = 1; off <= hotbarSize; off++) {
            const j = (idx + off) % hotbarSize;
            const s = inv.slots[j];
            if (s && s.itemId) {
                const d = inv.getItemDef(s.itemId);
                if (d && d.type === 'weapon') {
                    inv.selectHotbarSlot(j);
                    break;
                }
            }
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
            // Interaction Priority: Vehicle > Portal > Shop > Chest > Item > Object(Door)
            const interacted =
                this.tryEnterVehicle() ||
                this.tryEnterPortal() ||
                this.tryBuyShopItem() ||
                this.tryOpenChest() ||
                this.tryUseRelicAltar() || // [tension-batch:power]
                this.tryPickupWeapon() || // 拾取优先于老虎机：奖品落在机旁时 E 先捡奖品而不是再抽一次
                this.tryUseSlotMachine() || // [depth-batch:gamble]
                this.tryInteractWithObject();
            // 无世界交互目标时，E 键回退为「使用当前选中的消耗品」。
            // 这样移动端「交互」按钮（映射 keys.e）与桌面 E 键都能吃血瓶/道具；
            // 桌面左键使用消耗品的原路径不受影响。
            if (!interacted) {
                this.tryUseSelectedConsumable();
            }
        } else if (!keys.e) {
            this.player.ePressed = false;
        }
    }

    /**
     * 使用当前快捷栏选中的消耗品（若为消耗品）。供 E/交互 键在无世界交互目标时回退调用。
     */
    tryUseSelectedConsumable() {
        if (!this.inventorySystem) return false;
        const item = this.inventorySystem.getSelectedItem();
        if (item && item.itemId && item.def?.type === 'consumable') {
            return this.useSelectedConsumable(item);
        }
        return false;
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

    tryBuyShopItem() {
        const ws = this.worldSystem;
        if (!ws || !ws.shopItems || ws.shopItems.length === 0) return false;

        for (const item of ws.shopItems) {
            if (item.sold) continue;
            const dx = this.player.x - item.x;
            const dy = this.player.y - item.y;
            if (dx * dx + dy * dy < 44 * 44) {
                // 余额不足/已拥有时 tryBuy 触发红字提示，同样消费本次交互
                item.tryBuy(ws.dungeonRunState, ws);
                return true;
            }
        }
        return false;
    }

    tryOpenChest() {
        const ws = this.worldSystem;
        if (!ws || !ws.chests || ws.chests.length === 0) return false;

        for (const chest of ws.chests) {
            if (chest.isOpen) continue;
            const cx = chest.x + chest.width / 2;
            const cy = chest.y + chest.height / 2;
            const dx = this.player.x - cx;
            const dy = this.player.y - cy;
            if (dx * dx + dy * dy < 50 * 50) {
                // 缺钥匙时 tryOpen 返回 need_key 并触发红字提示；同样消费本次交互
                chest.tryOpen(ws.dungeonRunState, ws);
                return true;
            }
        }
        return false;
    }

    // [depth-batch:gamble] 老虎机交互：50px 半径内 E 键投币开抽（金币不足/爆机由实体给红字提示）。
    tryUseSlotMachine() {
        const ws = this.worldSystem;
        if (!ws || !ws.slotMachines || ws.slotMachines.length === 0) return false;

        for (const machine of ws.slotMachines) {
            const dx = this.player.x - machine.centerX;
            const dy = this.player.y - machine.centerY;
            if (dx * dx + dy * dy < 50 * 50) {
                machine.tryUse(ws.dungeonRunState, ws);
                return true; // 消费本次交互（含金币不足/忙碌/爆机的红字反馈）
            }
        }
        return false;
    }

    // [tension-batch:power] 遗物祭坛交互：靠近某底座时 E 选定该遗物（授予 + 灭二），已选定则跳过。
    tryUseRelicAltar() {
        const ws = this.worldSystem;
        if (!ws || !ws.relicAltars || ws.relicAltars.length === 0) return false;

        for (const altar of ws.relicAltars) {
            if (altar.resolved) continue;
            if (altar.nearestPedestal(this.player.x, this.player.y) >= 0) {
                return altar.tryChoose(ws, this.player.x, this.player.y);
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
                        if (this.worldSystem && this.worldSystem.markWorldStaticDirty) {
                            this.worldSystem.markWorldStaticDirty();
                        }
                        // Interaction successful

                        // Notify callback (e.g. PixelOS)
                        if (this.onInteract) this.onInteract(obj);

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

        if (!closestItem) return false;

        // 遗物：效果立即生效，同时以凭证形式自动入背包（可查看效果，不可丢弃）
        if (closestItem.isRelic && this.worldSystem && this.worldSystem.relicSystem) {
            const relicId = closestItem.itemId.replace('relic:', '');
            this.worldSystem.relicSystem.addRelic(relicId);
            this.soundSystem?.play('pickup_relic'); // [audio-p1] 遗物神圣和弦
            if (this.inventorySystem) {
                this.inventorySystem.add(closestItem.itemId, 1);
            }
            const index = this.droppedItems.indexOf(closestItem);
            if (index > -1) this.droppedItems.splice(index, 1);
            return true;
        }

        // 服装：拾取立即自动穿戴（被替换的旧件回背包）
        if (this.inventorySystem && this.costumeSystem) {
            const pickupDef = this.inventorySystem.getItemDef(closestItem.itemId);
            if (pickupDef && pickupDef.type === 'costume' && pickupDef.data) {
                const { costumeSlot, costumePieceId } = pickupDef.data;
                const oldPieceId = this.player.costume ? this.player.costume[costumeSlot] : null;
                if (this.costumeSystem.equipCostume(this.player, costumeSlot, costumePieceId)) {
                    if (oldPieceId && oldPieceId !== costumePieceId) {
                        this.inventorySystem.add(`costume:${oldPieceId}`, 1);
                    }
                    const index = this.droppedItems.indexOf(closestItem);
                    if (index > -1) this.droppedItems.splice(index, 1);
                    // 穿戴提示（名称+属性加成）
                    if (this.onCostumeEquipped) {
                        this.onCostumeEquipped(pickupDef.name, pickupDef.description || null);
                    }
                    return true;
                }
            }
        }

        // 血包/宠物：拾取即用，不入背包（回血/召唤当场生效）
        if (this.inventorySystem) {
            const instantDef = this.inventorySystem.getItemDef(closestItem.itemId);
            if (this.isInstantUseConsumable(instantDef)) {
                const d = instantDef.data || {};
                const isPureHeal = !!d.healAmount && !d.maxHpBoostPercent && !d.petType;
                const maxHp = Number.isFinite(this.player.maxHp) ? this.player.maxHp : 100;
                // 满血时不捡纯回血道具：留在地上，等受伤再来拿，避免浪费
                if (isPureHeal && this.player.hp >= maxHp) {
                    return true;
                }
                this.applyConsumableEffect(instantDef);
                this.soundSystem?.play('pickup_relic'); // 复用正向拾取和弦
                const idx = this.droppedItems.indexOf(closestItem);
                if (idx > -1) this.droppedItems.splice(idx, 1);
                this.updateEquippedItem();
                console.log(`Instantly used ${closestItem.name}`);
                return true;
            }
        }

        if (this.inventorySystem) {
            const remaining = this.inventorySystem.add(closestItem.itemId, closestItem.count, closestItem.instanceData);

            if (remaining === 0) {
                // Fully picked up
                const index = this.droppedItems.indexOf(closestItem);
                if (index > -1) {
                    this.droppedItems.splice(index, 1);
                }
                if (closestItem.itemId?.startsWith('weapon:')) this.soundSystem?.play('pickup_weapon'); // [audio-p1] 武器拾取
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
        return true;
    }
    
    // New Drop Interface
    dropItem(itemData) {
        if (!itemData || !itemData.itemId) return;

        // 不可丢弃物品（遗物凭证等）：塞回背包而不是丢地上
        const def = this.inventorySystem && this.inventorySystem.getItemDef(itemData.itemId);
        if (def && def.undroppable) {
            this.inventorySystem.add(itemData.itemId, itemData.count || 1, itemData.instanceData);
            return;
        }

        let dropX = this.player.x + (Math.random() - 0.5) * 30;
        let dropY = this.player.y + (Math.random() - 0.5) * 30;

        // Validate drop position against walls
        if (this.worldSystem) {
            const radius = 10;
            const rect = { x: dropX - radius, y: dropY - radius, width: radius * 2, height: radius * 2 };
            if (this.worldSystem.isRectBlocked(rect)) {
                dropX = this.player.x;
                dropY = this.player.y;
            }
        }

        this.droppedItems.push(new DroppedItem(dropX, dropY, itemData.itemId, itemData.count, itemData.instanceData));
    }

    updatePlayerMovement() {
        const keys = this.input.keys;
        const startState = this.player.state;
        const effectiveSpeed = this.getEffectivePlayerSpeed();

        // 受击无敌帧递减（takeDamage 置 40）
        if (this.player.invulnTimer > 0) this.player.invulnTimer--;

        this._updatePitFall();

        // M12: Grapple movement — pull player toward target
        if (this.player._grappleTarget) {
            const gt = this.player._grappleTarget;
            const dx = gt.x - this.player.x;
            const dy = gt.y - this.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 16) {
                this.player._grappleTarget = null;
            } else {
                const speed = this.player._grappleSpeed || 8;
                const moveX = (dx / dist) * speed;
                const moveY = (dy / dist) * speed;
                this.resolveMove(this.player.x + moveX, this.player.y + moveY);
                return; // Skip normal movement while grappling
            }
        }

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
                this._spawnRollDust(this.player.x, this.player.y, true);
                return;
            }

            this.player.rollDuration--;
            if (this.player.rollDuration <= 0) {
                this.player.state = 'idle';
                this.player.rollCooldown = 30;
                this._spawnRollDust(this.player.x, this.player.y, true);
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
        // 移动端：虚拟摇杆向量优先于 WASD（最小侵入的一处方向源替换）。
        const mv = this.input.moveVector;
        if (mv && (mv.x !== 0 || mv.y !== 0)) {
            dx = mv.x;
            dy = mv.y;
        } else {
            if (keys.w) dy -= 1;
            if (keys.s) dy += 1;
            if (keys.a) dx -= 1;
            if (keys.d) dx += 1;
        }

        const isMoving = dx !== 0 || dy !== 0;

        if (keys.space && this.player.rollCooldown <= 0 && isMoving && effectiveSpeed > 0) {
            this._spawnRollDust(this.player.x, this.player.y, false, Math.atan2(dy, dx));
            this.soundSystem?.play('player_roll'); // [audio-p1] 翻滚布料嗖
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

    /**
     * 地牢坑判定：踩空掉坑（扣血 + 回最近安全点 + 黑烟粒子）；
     * 翻滚/驾驶状态可跨坑（Gungeon 式 dodge roll 过坑）。
     */
    _updatePitFall() {
        const ws = this.worldSystem;
        if (!ws || !ws.isPitAt || !ws.dungeonPitTiles || ws.dungeonPitTiles.size === 0) return;
        const p = this.player;
        if (p.state === 'roll' || p.state === 'driving') return;

        if (this._pitCooldown > 0) this._pitCooldown--;

        if (ws.isPitAt(p.x, p.y + 12)) {
            // 坑免疫窗口：刚被拉回时不再重复触发（防止击退把玩家连续顶回坑里连帧扣血）
            if (this._pitCooldown > 0) return;
            this._pitCooldown = 30;
            if (p.takeDamage) p.takeDamage(10, null);
            for (let i = 0; i < 8; i++) {
                const a = (i / 8) * Math.PI * 2;
                this.particles.push({
                    x: p.x,
                    y: p.y + 8,
                    vx: Math.cos(a) * 1.5,
                    vy: Math.sin(a) * 1.5 - 0.5,
                    life: 20,
                    color: '#1a1a22',
                    size: 3,
                    friction: 0.88
                });
            }
            // 拉回远端安全采样点（15 帧前的位置，离坑沿有余量），并清零击退避免二次坠坑
            const safe = this._safePosFar || this._lastSafePos;
            if (safe) {
                p.x = safe.x;
                p.y = safe.y;
                p.knockbackX = 0;
                p.knockbackY = 0;
            }
        } else {
            this._lastSafePos = { x: p.x, y: p.y };
            // 双采样：远端安全点每 15 帧更新一次，保证拉回位置不贴坑沿
            this._safePosTick = (this._safePosTick || 0) + 1;
            if (!this._safePosFar || this._safePosTick % 15 === 0) {
                this._safePosFar = { x: p.x, y: p.y };
            }
        }
    }

    getEffectivePlayerSpeed() {
        if (this.player.frozenTimer > 0) return 0;
        const costumeMult = getCostumeStats(this.player.costume).moveSpeedMult;
        const relicMult = costumeMult * ((this.worldSystem && this.worldSystem.relicSystem)
            ? this.worldSystem.relicSystem.moveSpeedMult()
            : 1);
        if (this.player.slowTimer > 0) {
            return this.player.speed * relicMult * Math.max(0, 1 - (this.player.slowAmount || 0));
        }
        return this.player.speed * relicMult;
    }
    
    _spawnRollDust(x, y, isLanding, rollAngle) {
        const count = isLanding ? 4 : 5;
        for (let i = 0; i < count; i++) {
            let angle;
            if (isLanding) {
                // Landing: spread in all directions
                angle = Math.random() * Math.PI * 2;
            } else {
                // Takeoff: bias toward opposite of roll direction
                angle = rollAngle + Math.PI + (Math.random() - 0.5) * 1.2;
            }
            const speed = 0.5 + Math.random() * 1.0;
            this.particles.push({
                type: 'smoke',
                x: x + (Math.random() - 0.5) * 6,
                y: y + 10 + Math.random() * 4,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed * 0.5,
                life: 15 + Math.random() * 10,
                color: '#a0896e',
                size: 2 + Math.random() * 2,
                alpha: 0.5
            });
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

        this.applyConsumableEffect(item.def);
        this.updateEquippedItem();
        return true;
    }

    /**
     * 血包/宠物类消耗品：拾取即用、不入背包（用户 2026-07 需求：加血道具与宠物捡起即生效）。
     * 判定=消耗品且带回血/最大血提升/宠物召唤效果。
     */
    isInstantUseConsumable(def) {
        if (!def || def.type !== 'consumable') return false;
        const d = def.data || {};
        return !!(d.healAmount || d.maxHpBoostPercent || d.petType);
    }

    /**
     * 应用消耗品效果（召唤宠物 / 加最大血 / 回血）。背包使用与拾取即用共用；
     * 不负责扣库存与装备刷新（由调用方处理）。
     */
    applyConsumableEffect(def) {
        const data = def?.data || {};

        // Pet summoning
        if (data.petType) {
            let pet;
            const spawnX = this.player.x + (Math.random() > 0.5 ? 30 : -30);
            const spawnY = this.player.y + 20;
            if (data.petType === 'dog') {
                pet = new PetDog(spawnX, spawnY);
            } else if (data.petType === 'cat') {
                pet = new PetCat(spawnX, spawnY);
            } else if (data.petType === '2b') {
                pet = new Pet2B(spawnX, spawnY);
            }
            if (pet && this.pets) {
                // 注入 worldSystem 引用，供宠物独特技能读取 droppedItems/pickups/enemies。
                // WorldSystem 为跨楼层稳定单例（数组原地清空复用），引用持续有效。
                pet.worldSystem = this.worldSystem;
                this.pets.push(pet);
                // Summon VFX
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2;
                    this.particles.push({
                        type: 'smoke',
                        x: spawnX,
                        y: spawnY,
                        vx: Math.cos(angle) * 1.5,
                        vy: Math.sin(angle) * 1.0,
                        life: 15 + Math.random() * 10,
                        color: i % 2 === 0 ? '#ffffff' : '#ffe066',
                        size: 2 + Math.random() * 2,
                        alpha: 0.8
                    });
                }
            }
            return true;
        }

        // Max HP boost (e.g. recovery needle: +50% max HP then full heal)
        if (data.maxHpBoostPercent) {
            const boost = Math.max(0, Number(data.maxHpBoostPercent) || 0);
            const oldMax = Number.isFinite(this.player.maxHp) ? this.player.maxHp : 100;
            this.player.maxHp = Math.round(oldMax * (1 + boost / 100));
            this.player.hp = this.player.maxHp;
            return true;
        }

        const healAmount = Math.max(0, Number(data.healAmount) || 0);
        const maxHp = Number.isFinite(this.player.maxHp) ? this.player.maxHp : 100;
        const currentHp = Number.isFinite(this.player.hp) ? this.player.hp : maxHp;
        this.player.hp = Math.min(maxHp, currentHp + healAmount);
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

        // 滚轮循环切换快捷栏（无需打开背包）
        if (this.input.wheelDelta !== 0) {
            const dir = Math.sign(this.input.wheelDelta);
            this.input.wheelDelta = 0;
            const current = this.inventorySystem.getSelectedSlotIndex();
            const next = (current + dir + 9) % 9;
            if (this.inventorySystem.selectHotbarSlot(next)) {
                this.updateEquippedItem();
            }
        }
    }

    updatePlayerAimAndAction() {
        this.handleHotbarInput();

        if (this.player.state === 'roll') return;
        if (this.player.state === 'driving') return;

        const mouse = this.input.mouse;
        const keys = this.input.keys;

        if (mouse.worldX < this.player.x) this.player.facingRight = false;
        else this.player.facingRight = true;

        this.player.angle = this.handSystem.angle;

        // Reload (R) - not for melee weapons
        if (keys.r && !this.player.rPressed) {
            this.player.rPressed = true;
            if (!(this.handSystem.currentWeapon && this.handSystem.currentWeapon.isMelee)) {
                this.handSystem.startReload();
            }
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
            } else if (this.handSystem.currentWeapon && this.handSystem.currentWeapon.isMelee) {
                // Melee attack
                if (this.meleeSystem && !this.meleeSystem.isAttacking) {
                    this.meleeSystem.tryAttack();
                }
            } else {
                const weapon = this.handSystem.currentWeapon;

                // M1: Charge weapons — hold to charge
                if (weapon && weapon.chargeTime) {
                    this.combatSystem.updateCharge(true);
                }
                // M8: Continuous beam — hold to fire
                else if (weapon && weapon.continuous) {
                    if (this.handSystem.canShoot()) {
                        this.combatSystem.updateBeam(true);
                    }
                }
                // Normal Shoot Mode (Auto-fire supported by CombatSystem rate limiting)
                else if (this.handSystem.canShoot()) {
                    // M14: Blood cost weapons bypass ammo but cost HP
                    if (weapon && weapon.bloodCost) {
                        const shotFired = this.combatSystem.tryShoot();
                        // Don't consume ammo for blood weapons
                        if (shotFired) {
                            // HP deduction handled in tryShoot
                        }
                    } else {
                        const shotFired = this.combatSystem.tryShoot();
                        if (shotFired) {
                            this.handSystem.consumeAmmo();
                        }
                    }
                } else {
                    // Auto reload if empty and clicking
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
            // M1: Release charge — fire charged shot
            const weapon = this.handSystem.currentWeapon;
            if (weapon && weapon.chargeTime && this.combatSystem.chargeState) {
                const shotFired = this.combatSystem.updateCharge(false);
                if (shotFired) {
                    this.handSystem.consumeAmmo();
                }
            }
            // M8: Release beam
            if (weapon && weapon.continuous) {
                this.combatSystem.updateBeam(false);
            }
        }
    }
}
