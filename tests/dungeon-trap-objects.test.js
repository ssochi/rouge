// tests/dungeon-trap-objects.test.js
// 房间机关：尖刺陷阱周期状态机 + 踩踏扣血、奖励笼拉杆清房前无效 / 清房后开笼。
import { describe, it, expect } from 'vitest';
import {
    SpikeTrapObject,
    RewardCageObject,
    CageLeverObject,
    DecoyStatueObject,
    spikePhase,
    isRoomCleared,
    openCage,
    findCageForLever,
    SPIKE_IDLE_TICKS,
    SPIKE_WARN_TICKS,
    SPIKE_UP_TICKS,
    SPIKE_CYCLE_TICKS,
    SPIKE_DAMAGE
} from '../src/core/entities/objects/DungeonTrapObjects.js';

// 复刻 BreakableObject 构造的最小对象壳：configure 挂载属性后即可驱动 def。
function makeObj(type, def, x = 0, y = 0) {
    const obj = {
        x, y, type,
        width: 32, height: 32,
        hitbox: { offsetX: 5, offsetY: 20, width: 22, height: 10 },
        hp: 20, shadow: {}, blocksLight: true,
        isBroken: false, isOpen: false, showHint: false
    };
    if (def.configure) def.configure(obj);
    return obj;
}

function makePlayer(x, y) {
    return {
        x, y, hitboxOffsetY: 12, hp: 100, state: 'idle',
        takeDamage(amount, kb) { this.hp -= amount; this.lastKb = kb; }
    };
}

describe('尖刺陷阱周期状态机', () => {
    it('spikePhase 在收回/预警/弹出边界正确切换', () => {
        expect(spikePhase(0)).toBe('idle');
        expect(spikePhase(SPIKE_IDLE_TICKS - 1)).toBe('idle');
        expect(spikePhase(SPIKE_IDLE_TICKS)).toBe('warn');
        expect(spikePhase(SPIKE_IDLE_TICKS + SPIKE_WARN_TICKS - 1)).toBe('warn');
        expect(spikePhase(SPIKE_IDLE_TICKS + SPIKE_WARN_TICKS)).toBe('up');
        expect(spikePhase(SPIKE_CYCLE_TICKS - 1)).toBe('up');
        // 环绕一周回到收回
        expect(spikePhase(SPIKE_CYCLE_TICKS)).toBe('idle');
    });

    it('configure：不阻挡移动、子弹穿过、不可破坏', () => {
        const trap = makeObj('spike_trap', SpikeTrapObject);
        expect(trap.hitbox.width).toBe(0);
        expect(trap.hitbox.height).toBe(0);
        expect(trap.isLocked).toBe(true);
        expect(trap.blocksLight).toBe(false);
        expect(trap.getHurtboxes()).toEqual([]);
        expect(trap.getHurtbox()).toBeNull();
    });

    it('弹出态踩上扣血，收回态无害', () => {
        const trap = makeObj('spike_trap', SpikeTrapObject, 0, 0); // 相位 0
        const player = makePlayer(16, 4); // 脚点 (16,16) 落在中央刺区

        // 驱到弹出前一刻，下一帧进入 up
        trap._age = SPIKE_IDLE_TICKS + SPIKE_WARN_TICKS - 1;
        SpikeTrapObject.update(trap, player); // -> up 首帧
        expect(trap._spikeState).toBe('up');
        expect(player.hp).toBe(100 - SPIKE_DAMAGE);
        expect(player.lastKb).toBeTruthy();

        // 同一轮弹出内不重复扣血
        SpikeTrapObject.update(trap, player);
        expect(player.hp).toBe(100 - SPIKE_DAMAGE);
    });

    it('收回态站在陷阱上不扣血', () => {
        const trap = makeObj('spike_trap', SpikeTrapObject, 0, 0);
        const player = makePlayer(16, 4);
        trap._age = 0;
        SpikeTrapObject.update(trap, player); // idle
        expect(trap._spikeState).toBe('idle');
        expect(player.hp).toBe(100);
    });

    it('弹出态同样刺伤压在刺区上的敌人', () => {
        const enemy = { x: 16, y: 4, hitboxOffsetY: 12, hp: 30, takeDamage(a) { this.hp -= a; } };
        const trap = makeObj('spike_trap', SpikeTrapObject, 0, 0);
        trap.worldSystem = { enemies: [enemy] };
        const player = makePlayer(999, 999); // 玩家不在刺区
        trap._age = SPIKE_IDLE_TICKS + SPIKE_WARN_TICKS - 1;
        SpikeTrapObject.update(trap, player);
        expect(enemy.hp).toBe(30 - SPIKE_DAMAGE);
    });
});

describe('奖励笼 + 拉杆', () => {
    function makeWorld(roomState) {
        return {
            breakableObjects: [],
            spawnedChests: [],
            coinBursts: [],
            spawnChest(x, y, tier) { this.spawnedChests.push({ x, y, tier }); },
            spawnCoinBurst(x, y, v) { this.coinBursts.push({ x, y, v }); },
            dungeonManager: {
                _room: { id: 'r1', state: roomState },
                getRoomAt() { return this._room; }
            }
        };
    }

    function wireCageAndLever(ws) {
        const cage = makeObj('reward_cage', RewardCageObject, 100, 100);
        const lever = makeObj('cage_lever', CageLeverObject, 132, 100);
        cage.worldSystem = ws;
        lever.worldSystem = ws;
        ws.breakableObjects.push(cage, lever);
        return { cage, lever };
    }

    it('isRoomCleared：无 dungeonManager 时判否', () => {
        const obj = makeObj('cage_lever', CageLeverObject, 0, 0);
        obj.worldSystem = {};
        expect(isRoomCleared(obj)).toBe(false);
    });

    it('清怪前拉杆无效：不开笼、不出箱、E 落空', () => {
        const ws = makeWorld('active');
        const { cage, lever } = wireCageAndLever(ws);
        const consumed = CageLeverObject.interact(lever);
        expect(consumed).toBe(false);
        expect(lever.pulled).toBe(false);
        expect(cage.isOpen).toBe(false);
        expect(ws.spawnedChests.length).toBe(0);
    });

    it('清怪后拉杆开笼：出箱、掷金币、笼变可穿过', () => {
        const ws = makeWorld('cleared');
        const { cage, lever } = wireCageAndLever(ws);
        const consumed = CageLeverObject.interact(lever);
        expect(consumed).toBe(true);
        expect(lever.pulled).toBe(true);
        expect(cage.isOpen).toBe(true);
        expect(cage.hitbox.width).toBe(0);       // 撤除碰撞
        expect(cage.getHurtboxes()).toEqual([]); // 子弹穿过
        expect(ws.spawnedChests.length).toBe(1);
        expect(ws.coinBursts.length).toBe(1);
    });

    it('拉杆后再拉无效（笼已开）', () => {
        const ws = makeWorld('cleared');
        const { lever } = wireCageAndLever(ws);
        CageLeverObject.interact(lever);
        const again = CageLeverObject.interact(lever);
        expect(again).toBe(false);
        expect(ws.spawnedChests.length).toBe(1);
    });

    it('findCageForLever：跳过已开笼、取同房最近', () => {
        const ws = makeWorld('cleared');
        const { cage, lever } = wireCageAndLever(ws);
        expect(findCageForLever(lever, ws)).toBe(cage);
        openCage(cage, ws);
        expect(findCageForLever(lever, ws)).toBeNull(); // 已开则不再匹配
    });

    it('拉杆提示：清怪前"先清怪"、清怪后"[E] 拉杆"', () => {
        const clearedWs = makeWorld('cleared');
        const { lever } = wireCageAndLever(clearedWs);
        const player = makePlayer(132, 100); // 贴着拉杆
        lever.showHint = false;
        CageLeverObject.update(lever, player);
        expect(lever.showHint).toBe(true);
        expect(lever.hintText).toContain('拉杆');

        const activeWs = makeWorld('active');
        const l2 = wireCageAndLever(activeWs).lever;
        l2.showHint = false;
        CageLeverObject.update(l2, makePlayer(132, 100));
        expect(l2.hintText).toContain('先清怪');
    });
});

describe('诱饵雕像', () => {
    it('configure：可破坏（非锁定）', () => {
        const statue = makeObj('decoy_statue', DecoyStatueObject);
        expect(statue.isLocked).toBeFalsy();
        expect(statue.hp).toBeGreaterThan(0);
        expect(statue.hitbox.width).toBeGreaterThan(0);
    });
});
