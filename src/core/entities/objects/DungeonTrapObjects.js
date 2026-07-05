// 地牢机关物件逻辑（尖刺陷阱 / 奖励笼 / 拉杆 / 诱饵雕像）。
// 美术在 src/assets/objects/dungeon/Dungeon{SpikeTrap,RewardCage,CageLever,DecoyStatue}Sprite.js。
// 走 BreakableObject 管线：configure 挂载属性、update 每帧驱动状态机、interact 交互、draw 复用默认精灵帧。
// 需每帧 update + 玩家/敌人判定：BreakableObject.update(player) 会转调 def.update(obj, player)，
// 拉杆/笼子需读房间清怪状态与生成宝箱——由 WorldSystem 在建对象时注入 obj.worldSystem 引用。

// ─────────────────────────── 尖刺陷阱 ───────────────────────────
// 周期：收回(2s) → 预警(0.5s，尖头半露) → 弹出(1s，踩上扣血) → 收回。
// 低矮地面机关：不阻挡移动、子弹穿过（getHurtboxes 置空）、不可破坏。
export const SPIKE_IDLE_TICKS = 120;
export const SPIKE_WARN_TICKS = 30;
export const SPIKE_UP_TICKS = 60;
export const SPIKE_CYCLE_TICKS = SPIKE_IDLE_TICKS + SPIKE_WARN_TICKS + SPIKE_UP_TICKS;
export const SPIKE_DAMAGE = 8;
const SPIKE_KNOCKBACK = 2.4;

/** 由周期计数得出当前态：'idle' | 'warn' | 'up'。 */
export function spikePhase(tick) {
    const t = ((tick % SPIKE_CYCLE_TICKS) + SPIKE_CYCLE_TICKS) % SPIKE_CYCLE_TICKS;
    if (t < SPIKE_IDLE_TICKS) return 'idle';
    if (t < SPIKE_IDLE_TICKS + SPIKE_WARN_TICKS) return 'warn';
    return 'up';
}

function pointInRect(px, py, rx, ry, rw, rh) {
    return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function knockbackFrom(cx, cy, tx, ty, strength) {
    const dx = tx - cx;
    const dy = ty - cy;
    const d = Math.hypot(dx, dy) || 1;
    return { x: (dx / d) * strength, y: (dy / d) * strength };
}

/** 弹出态：对压在中央刺区上的玩家/敌人各扣一次血（本轮弹出内不重复）。 */
function applySpikeDamage(obj, player) {
    // 中央刺区（避开边框，需较实在地踩上）
    const rx = obj.x + 6, ry = obj.y + 8, rw = 20, rh = 18;
    const cx = obj.x + 16, cy = obj.y + 16;

    if (!obj._hitPlayer && player && player.takeDamage) {
        const pfx = player.x;
        const pfy = player.y + (player.hitboxOffsetY || 0);
        if (pointInRect(pfx, pfy, rx, ry, rw, rh)) {
            player.takeDamage(SPIKE_DAMAGE, knockbackFrom(cx, cy, pfx, pfy, SPIKE_KNOCKBACK));
            obj._hitPlayer = true;
        }
    }

    // 敌人同样受刺（可把敌人引上尖刺——走位博弈）
    const enemies = obj.worldSystem && obj.worldSystem.enemies;
    if (Array.isArray(enemies)) {
        for (const e of enemies) {
            if (!e || e.isDead || !e.takeDamage || obj._hitEnemies.has(e)) continue;
            const efx = e.x;
            const efy = e.y + (e.hitboxOffsetY || 0);
            if (pointInRect(efx, efy, rx, ry, rw, rh)) {
                e.takeDamage(SPIKE_DAMAGE, knockbackFrom(cx, cy, efx, efy, SPIKE_KNOCKBACK));
                obj._hitEnemies.add(e);
            }
        }
    }
}

export const SpikeTrapObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 0, width: 0, height: 0 }; // 不阻挡移动
        obj.hp = 999;
        obj.isLocked = true;      // 不可破坏
        obj.blocksLight = false;
        obj.shadow = null;
        obj.noAnimation = true;   // 帧由状态机控制
        obj.frameIndex = 0;
        // 相位错开：同房多个陷阱不同步弹出
        obj._phase0 = (Math.abs(obj.x * 7 + obj.y * 13)) % SPIKE_CYCLE_TICKS;
        obj._spikeState = 'idle';
        obj._hitPlayer = false;
        obj._hitEnemies = new Set();
        // 低矮机关：子弹穿过（无受击框）
        obj.getHurtbox = () => null;
        obj.getHurtboxes = () => [];
    },
    update(obj, player) {
        obj._age = (obj._age || 0) + 1;
        const state = spikePhase(obj._age + obj._phase0);
        obj.frameIndex = state === 'idle' ? 0 : (state === 'warn' ? 1 : 2);
        if (state === 'up' && obj._spikeState !== 'up') {
            // 进入弹出：重置本轮命中集
            obj._hitPlayer = false;
            obj._hitEnemies = new Set();
            obj.worldSystem?.soundSystem?.play('spike_out', { x: obj.x + 16, y: obj.y + 16 }); // [audio-p1] 尖刺弹出铿
        }
        obj._spikeState = state;
        if (state === 'up') applySpikeDamage(obj, player);
    }
};

// ─────────────────────────── 奖励笼 + 拉杆 ───────────────────────────
// 铁笼锁着宝箱；房间清怪前拉杆无效（提示"先清怪"），清怪后按 E 拉杆开笼、
// 生成真实 Chest 实体并掷出保底金币。笼子/拉杆均不可破坏。

const CAGE_INTERACT_RANGE = 52;

/** 读机关所在房间是否已清怪（起始房默认已清）。 */
export function isRoomCleared(obj) {
    const dm = obj.worldSystem && obj.worldSystem.dungeonManager;
    if (!dm || !dm.getRoomAt) return false;
    const room = dm.getRoomAt(obj.x + 16, obj.y + 16);
    return !!room && room.state === 'cleared';
}

/** 拉杆开笼：撤笼碰撞、生成宝箱、掷保底金币。返回是否成功开出新笼。 */
export function openCage(cage, ws) {
    if (!cage || cage.isOpen) return false;
    cage.isOpen = true;
    cage.frameIndex = 1;
    // 敞开：撤除移动碰撞与受击框（玩家可入笼取箱、子弹穿过）
    cage.hitbox = { offsetX: 0, offsetY: 0, width: 0, height: 0 };
    cage.blocksLight = false;
    cage.getHurtbox = () => null;
    cage.getHurtboxes = () => [];
    if (ws) {
        const tier = cage.cageTier || 'iron';
        if (ws.spawnChest) ws.spawnChest(cage.x + 6, cage.y + 8, tier);
        // 无钥匙也有回报：开笼即掷一小簇金币
        if (ws.spawnCoinBurst) ws.spawnCoinBurst(cage.x + 16, cage.y + 16, 12);
    }
    return true;
}

/** 为拉杆寻找同房间、未开启、最近的奖励笼。 */
export function findCageForLever(lever, ws) {
    if (!ws || !Array.isArray(ws.breakableObjects)) return null;
    const lcx = lever.x + 16, lcy = lever.y + 16;
    const dm = ws.dungeonManager;
    const leverRoom = dm && dm.getRoomAt ? dm.getRoomAt(lcx, lcy) : null;
    let best = null, bestD = Infinity;
    for (const o of ws.breakableObjects) {
        if (!o || o.type !== 'reward_cage' || o.isOpen) continue;
        const ocx = o.x + 16, ocy = o.y + 16;
        if (leverRoom && dm && dm.getRoomAt) {
            const r = dm.getRoomAt(ocx, ocy);
            if (r && r.id !== leverRoom.id) continue;
        }
        const d = (ocx - lcx) ** 2 + (ocy - lcy) ** 2;
        if (d < bestD) { bestD = d; best = o; }
    }
    return best;
}

export const RewardCageObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 5, offsetY: 10, width: 22, height: 16 }; // 铁栏挡路
        obj.hp = 999;
        obj.isLocked = true;
        obj.shadow = null;
        obj.noAnimation = true;
        obj.frameIndex = 0;
        obj.isOpen = false;
    },
    update(obj) {
        obj.frameIndex = obj.isOpen ? 1 : 0;
    }
};

export const CageLeverObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 11, offsetY: 20, width: 10, height: 8 }; // 底座小挡
        obj.hp = 999;
        obj.isLocked = true;
        obj.blocksLight = false;
        obj.shadow = null;
        obj.noAnimation = true;
        obj.frameIndex = 0;
        obj.pulled = false;
        obj.hintOffsetY = -14;
    },
    update(obj, player) {
        obj.frameIndex = obj.pulled ? 1 : 0;
        if (obj.pulled || !player) return;
        const dx = player.x - (obj.x + 16);
        const dy = player.y - (obj.y + 16);
        if (dx * dx + dy * dy > CAGE_INTERACT_RANGE * CAGE_INTERACT_RANGE) return;
        // BreakableObject.update 每帧已置 showHint=false，此处按状态重亮
        if (isRoomCleared(obj)) {
            obj.showHint = true;
            obj.hintText = '[E] 拉杆';
            obj.hintColor = '#f1c40f';
        } else {
            obj.showHint = true;
            obj.hintText = '先清怪';
            obj.hintColor = '#e74c3c';
        }
    },
    interact(obj) {
        if (obj.pulled) return false;
        const ws = obj.worldSystem;
        if (!ws) return false;
        if (!isRoomCleared(obj)) return false; // 未清怪：拉杆无效，E 落回消耗品
        const cage = findCageForLever(obj, ws);
        if (!cage) return false;
        openCage(cage, ws);
        obj.pulled = true;
        obj.frameIndex = 1;
        return true;
    }
};

// ─────────────────────────── 诱饵雕像 ───────────────────────────
// 可击破的石偶：破碎掉落由 WorldSystem._onBreakableBroken 处理（70% 金币 / 30% 小爆炸）。
export const DecoyStatueObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 9, offsetY: 22, width: 14, height: 8 };
        obj.hp = 18;
        obj.shadow = null;
    }
};
