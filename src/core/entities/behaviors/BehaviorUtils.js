// BehaviorUtils —— 行为组件共享移动/几何工具。
// ctx 约定（实体 update 注入）：
//   { enemy, player, walls, wallQuery, getFlowDirection, getNavDirection, moveResolver, combatSystem }

/** 玩家距离与单位方向。 */
export function playerVector(ctx) {
    const dx = ctx.player.x - ctx.enemy.x;
    const dy = ctx.player.y - ctx.enemy.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return { dx, dy, dist, nx: dx / dist, ny: dy / dist };
}

/**
 * 朝目标点移动一帧：流场方向优先（追玩家时），退化为直线方向。
 * @param {number} speedMult 速度倍率
 * @param {boolean} useFlow 是否使用流场（流场只指向玩家，逃离/横移时应关闭）
 */
export function steerToward(ctx, tx, ty, speedMult = 1, useFlow = true) {
    const e = ctx.enemy;
    let vx = 0;
    let vy = 0;

    if (useFlow && ctx.getFlowDirection) {
        const flow = ctx.getFlowDirection(e.x, e.y);
        if (flow && (flow.x !== 0 || flow.y !== 0)) {
            vx = flow.x;
            vy = flow.y;
        }
    }

    if (vx === 0 && vy === 0) {
        const dx = tx - e.x;
        const dy = ty - e.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0.001) {
            vx = dx / dist;
            vy = dy / dist;
        }
    }

    const len = Math.sqrt(vx * vx + vy * vy);
    if (len > 0) {
        vx /= len;
        vy /= len;
    }

    moveBy(ctx, vx, vy, speedMult);
    return { vx, vy };
}

/** 沿单位方向移动一帧（moveResolver 优先，退化 resolveWallCollision）。 */
export function moveBy(ctx, vx, vy, speedMult = 1) {
    const e = ctx.enemy;
    const speed = e.getEffectiveSpeed() * speedMult;
    const nextX = e.x + vx * speed;
    const nextY = e.y + vy * speed;
    if (ctx.moveResolver) {
        ctx.moveResolver(e, nextX, nextY, vx, vy);
    } else {
        e.resolveWallCollision(nextX, nextY, ctx.walls, ctx.wallQuery);
    }
}

/** 远离玩家一帧（不用流场）。 */
export function steerAwayFromPlayer(ctx, speedMult = 1) {
    const { nx, ny } = playerVector(ctx);
    moveBy(ctx, -nx, -ny, speedMult);
}
