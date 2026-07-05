// RoomVerbs —— 房间玩法动词状态机（生存 / 猎杀 / 契约）。
// 纯逻辑：所有副作用（出怪 / 封门 / 开门 / 掉落 / 遁走）经 ctx 回调注入，
// 由 DungeonManager 提供真实实现、由单测提供 spy 实现（对齐 DungeonTrapObjects 的 def+fakeWorld 测试范式）。
//
// 帧率基准 60fps：时长以帧计。消费方 DungeonManager.update 每帧对 active 房调用对应 update*。

// ─────────────── 生存房 survival ───────────────
// 进房封门 → 每 4-6s 涌入一小批（2-3 只）→ 撑 30s → 全灭现存 + 丰厚掉落。
export const SURVIVAL = {
    duration: 1800,       // 30s
    batchMin: 240,        // 增援间隔下限 4s
    batchMax: 360,        // 增援间隔上限 6s
    batchSizeMin: 2,
    batchSizeMax: 3,
};

// ─────────────── 猎杀房 hunt ───────────────
// 刷 1 只金边目标怪（精英词缀 + 1.5 倍速 + 加厚血）+ 2-3 护卫 →
// 45s 内击杀目标 = 丰厚奖励；超时目标遁地逃走、门开无奖励。
export const HUNT = {
    duration: 2700,       // 45s
    guardMin: 2,
    guardMax: 3,
    targetSpeedMult: 1.5,
    targetHpMult: 2.5,
};

// ─────────────── 契约房 pact ───────────────
// 进房不封门、无敌人；拉杆 → 封门开战：敌人 ×1.5 且全精英 → 清完奖励翻倍 + 保底遗物。
export const PACT = {
    countMult: 1.5,
};

/** 闭区间随机整数。 */
export function randRange(min, max, rng) {
    return min + Math.floor(rng() * (max - min + 1));
}

// ─────────────────────── 生存房 ───────────────────────

/** 激活生存房：起计时、立即放首批。 */
export function activateSurvival(room, ctx) {
    room.verb = 'survival';
    room.survivalTimer = SURVIVAL.duration;
    room.survivalTimerMax = SURVIVAL.duration;
    room.survivalComplete = false;
    // 首批增援与后续增援错开：进房即来一小股，之后每 4-6s 一批
    room.survivalBatchTimer = randRange(SURVIVAL.batchMin, SURVIVAL.batchMax, ctx.rng);
    ctx.spawnBatch(room, randRange(SURVIVAL.batchSizeMin, SURVIVAL.batchSizeMax, ctx.rng));
}

/** 每帧推进生存房：倒计时 + 定时增援；撑满 30s → 全灭现存 + 丰厚奖励。 */
export function updateSurvival(room, ctx) {
    if (room.survivalTimer > 0) {
        room.survivalTimer--;
        room.survivalBatchTimer--;
        if (room.survivalBatchTimer <= 0) {
            ctx.spawnBatch(room, randRange(SURVIVAL.batchSizeMin, SURVIVAL.batchSizeMax, ctx.rng));
            room.survivalBatchTimer = randRange(SURVIVAL.batchMin, SURVIVAL.batchMax, ctx.rng);
        }
        return;
    }
    // 撑住了：全灭现存敌人（作为通关犒赏）+ 丰厚掉落
    room.survivalComplete = true;
    ctx.wipeEnemies(room);
    ctx.clearWithReward(room, 'survival');
}

// ─────────────────────── 猎杀房 ───────────────────────

/** 激活猎杀房：刷目标怪 + 护卫、起计时。目标缺失时直接失败开门。 */
export function activateHunt(room, ctx) {
    room.verb = 'hunt';
    room.huntTimer = HUNT.duration;
    room.huntTimerMax = HUNT.duration;
    room.huntEscaped = false;
    room.huntTarget = ctx.spawnHuntTarget(room);
    if (!room.huntTarget) {
        // 目标未能落位：视为失败，直接开门无奖励
        ctx.clearNoReward(room);
        return;
    }
    ctx.spawnGuards(room, randRange(HUNT.guardMin, HUNT.guardMax, ctx.rng));
}

/** 每帧推进猎杀房：目标死亡 = 丰厚奖励；超时目标遁地逃走、门开无奖励。 */
export function updateHunt(room, ctx) {
    const target = room.huntTarget;
    if (target && target.hp > 0) {
        room.huntTimer--;
        if (room.huntTimer <= 0) {
            ctx.escapeTarget(room, target);
            room.huntEscaped = true;
            ctx.clearNoReward(room);
        }
        return;
    }
    // 目标已死：猎杀成功
    ctx.clearWithReward(room, 'hunt');
}

// ─────────────────────── 契约房 ───────────────────────

/** 拉杆开战：封门、刷 ×1.5 全精英敌人。返回是否成功开战（已开战则否）。 */
export function startPact(room, ctx) {
    if (room.pactStarted) return false;
    room.pactStarted = true;
    room.verb = 'pact';
    ctx.lockGates(room);
    ctx.spawnPactEnemies(room);
    return true;
}

/** 每帧推进契约房：未拉杆则空转（可自由通行）；开战后清光 → 翻倍奖励 + 保底遗物。 */
export function updatePact(room, ctx) {
    if (!room.pactStarted) return;
    if (ctx.aliveCount(room) === 0) {
        ctx.clearWithReward(room, 'pact');
    }
}

/** 该 category 是否为三种新玩法动词房之一。 */
export function isVerbCategory(category) {
    return category === 'survival' || category === 'hunt' || category === 'pact';
}
