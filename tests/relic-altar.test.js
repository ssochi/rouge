// tests/relic-altar.test.js
// [tension-batch:power] 遗物三选一祭坛纯逻辑测试：
//   - LootTable.pickRelicChoices（三选一抽取：排除已持有 / 互不重复 / 池不足降级）
//   - RelicAltarCore（选一灭二 / 越界与重复选定的幂等）
//   - 武器分层权重 weaponRarityWeightsForFloor 与每层保底 shouldForceWeaponDrop
import { describe, it, expect } from 'vitest';
import {
    pickRelicChoices,
    weaponRarityWeightsForFloor,
    shouldForceWeaponDrop,
} from '../src/core/dungeon/LootTable.js';
import { RelicAltarCore } from '../src/core/dungeon/RelicAltarCore.js';
import { RELIC_IDS } from '../src/assets/relics/RelicData.js';
import { ROOM_CLEAR } from '../src/core/dungeon/EconomyConfig.js';

describe('pickRelicChoices — 三选一候选抽取', () => {
    it('默认抽 3 个、互不重复', () => {
        const picks = pickRelicChoices([], 3, () => 0);
        expect(picks).toHaveLength(3);
        expect(new Set(picks).size).toBe(3);
        picks.forEach(id => expect(RELIC_IDS).toContain(id));
    });

    it('排除已持有：候选不含玩家已拥有的遗物', () => {
        const owned = [RELIC_IDS[0], RELIC_IDS[1]];
        const picks = pickRelicChoices(owned, 3, () => 0);
        expect(picks).toHaveLength(3);
        for (const id of owned) expect(picks).not.toContain(id);
        expect(new Set(picks).size).toBe(3);
    });

    it('可用池不足 count 时返回尽可能多（不重复、不报错）', () => {
        // 仅留 2 个未持有
        const owned = RELIC_IDS.slice(0, RELIC_IDS.length - 2);
        const picks = pickRelicChoices(owned, 3, () => 0);
        expect(picks).toHaveLength(2);
        expect(new Set(picks).size).toBe(2);
    });

    it('全部已持有时返回空数组', () => {
        expect(pickRelicChoices(RELIC_IDS, 3, () => 0.5)).toEqual([]);
    });
});

describe('RelicAltarCore — 选一灭二', () => {
    it('选定一个：返回该遗物、锁定、其余两座熄灭', () => {
        const core = new RelicAltarCore(['a', 'b', 'c']);
        expect(core.resolved).toBe(false);

        const chosen = core.choose(1);
        expect(chosen).toBe('b');
        expect(core.resolved).toBe(true);
        expect(core.isChosen(1)).toBe(true);
        expect(core.isExtinguished(0)).toBe(true);
        expect(core.isExtinguished(2)).toBe(true);
        expect(core.isExtinguished(1)).toBe(false);
    });

    it('已选定后再次选定无效（幂等）', () => {
        const core = new RelicAltarCore(['a', 'b', 'c']);
        expect(core.choose(0)).toBe('a');
        expect(core.choose(2)).toBe(null); // 已锁定
        expect(core.chosenIndex).toBe(0);
        expect(core.isChosen(0)).toBe(true);
        expect(core.isChosen(2)).toBe(false);
    });

    it('越界 / 非整数下标不改变状态', () => {
        const core = new RelicAltarCore(['a', 'b', 'c']);
        expect(core.choose(-1)).toBe(null);
        expect(core.choose(3)).toBe(null);
        expect(core.choose(1.5)).toBe(null);
        expect(core.resolved).toBe(false);
    });

    it('空候选：选定恒为 null', () => {
        const core = new RelicAltarCore([]);
        expect(core.count).toBe(0);
        expect(core.choose(0)).toBe(null);
        expect(core.resolved).toBe(false);
    });

    it('与 pickRelicChoices 串联：选中项来自未持有候选池', () => {
        const owned = [RELIC_IDS[0]];
        const candidates = pickRelicChoices(owned, 3, () => 0);
        const core = new RelicAltarCore(candidates);
        const chosen = core.choose(2);
        expect(candidates).toContain(chosen);
        expect(owned).not.toContain(chosen);
    });
});

describe('武器稀有度分层 weaponRarityWeightsForFloor', () => {
    it('按层返回上移后的权重', () => {
        expect(weaponRarityWeightsForFloor(1)).toEqual({ common: 55, uncommon: 35, rare: 10 });
        expect(weaponRarityWeightsForFloor(2)).toEqual({ uncommon: 45, rare: 40, epic: 15 });
        expect(weaponRarityWeightsForFloor(3)).toEqual({ rare: 45, epic: 40, legendary: 15 });
    });

    it('层数越界回退旧固定权重', () => {
        expect(weaponRarityWeightsForFloor(99)).toBe(ROOM_CLEAR.weaponRarityWeights);
    });
});

describe('每层武器保底 shouldForceWeaponDrop', () => {
    it('未达阈值不保底、达阈值且未掉过则保底', () => {
        expect(shouldForceWeaponDrop(3, false)).toBe(false); // 3<4
        expect(shouldForceWeaponDrop(4, false)).toBe(true);
        expect(shouldForceWeaponDrop(5, false)).toBe(true);
    });

    it('本层已掉过武器则永不保底', () => {
        expect(shouldForceWeaponDrop(4, true)).toBe(false);
        expect(shouldForceWeaponDrop(10, true)).toBe(false);
    });

    it('模拟清房序列：已清 4 房未掉武器 → 第 5 房必掉，其后不再保底', () => {
        // 复刻 DungeonManager 计数逻辑：先判定保底（用清房前计数），再自增
        let roomsCleared = 0;
        let dropped = false;
        const forced = [];
        for (let r = 0; r < 6; r++) {
            let w = false; // 假设每次概率掉落均未命中
            if (!w && shouldForceWeaponDrop(roomsCleared, dropped)) w = true;
            if (w) dropped = true;
            forced.push(w);
            roomsCleared++;
        }
        // 第 5 次清房（下标 4）触发保底，之后已掉过 → 不再触发
        expect(forced).toEqual([false, false, false, false, true, false]);
    });
});
