// RangedPatternBehavior —— 弹幕模式库（数据配置驱动 CombatSystem.spawnEnemyBullet）。
// 模式：
//   fan         扇形散射：{count, spreadDeg, speed, damage, color, size, life} 一次齐射
//   ring        环形爆发：{count, speed, damage, color, size, life, phaseStep} 一次全环（phase 随次数旋转）
//   aimed_burst 瞄准连发：{count, interval, speed, damage, color, size, life, trackTarget} 逐发计时
// 配置：{ patterns: [{kind, weight, ...cfg}], cooldown, range }

/** 扇形角度序列（围绕 baseAngle 均匀展开，count=1 时即 baseAngle）。 */
export function computeFanAngles(baseAngle, count, spreadRad) {
    if (count <= 1) return [baseAngle];
    const angles = [];
    for (let i = 0; i < count; i++) {
        angles.push(baseAngle - spreadRad / 2 + (spreadRad * i) / (count - 1));
    }
    return angles;
}

/** 环形角度序列（相位偏移 phase）。 */
export function computeRingAngles(count, phase = 0) {
    const angles = [];
    for (let i = 0; i < count; i++) {
        angles.push(phase + (i / count) * Math.PI * 2);
    }
    return angles;
}

export class RangedPatternBehavior {
    /**
     * @param {Object} opts
     * @param {Array} opts.patterns 模式配置数组（含 weight）
     * @param {number} [opts.cooldown=120] 模式间冷却帧数
     * @param {number} [opts.range=320] 发动距离
     */
    constructor({ patterns, cooldown = 120, range = 320 }) {
        this.patterns = patterns || [];
        this.cooldown = cooldown;
        this.range = range;
        this.cooldownTimer = Math.floor(cooldown * 0.5); // 首发半冷却，避免进房瞬间齐射
        this.active = null;   // { pattern, tick, fired }
        this.ringPhase = 0;
    }

    /** 是否处于开火动作中（供实体切 attack 动画）。 */
    get isFiring() {
        return this.active !== null;
    }

    pickPattern(rng = Math.random) {
        if (this.patterns.length === 0) return null;
        let total = 0;
        for (const p of this.patterns) total += p.weight || 1;
        let roll = rng() * total;
        for (const p of this.patterns) {
            roll -= p.weight || 1;
            if (roll <= 0) return p;
        }
        return this.patterns[this.patterns.length - 1];
    }

    update(ctx) {
        const e = ctx.enemy;
        const cs = ctx.combatSystem;
        if (!cs || !cs.spawnEnemyBullet) return false;

        if (this.active) {
            this._stepActive(ctx);
            return true;
        }

        if (this.cooldownTimer > 0) {
            this.cooldownTimer--;
            return false;
        }

        const dx = ctx.player.x - e.x;
        const dy = ctx.player.y - e.y;
        if (dx * dx + dy * dy > this.range * this.range) return false;

        const pattern = this.pickPattern();
        if (!pattern) return false;
        this.active = { pattern, tick: 0, fired: 0 };
        return true;
    }

    _stepActive(ctx) {
        const { pattern } = this.active;
        const e = ctx.enemy;
        const cs = ctx.combatSystem;
        const aim = Math.atan2(ctx.player.y - e.y, ctx.player.x - e.x);
        const spawn = (angle) => {
            cs.spawnEnemyBullet({
                x: e.x,
                y: e.y,
                angle,
                damage: pattern.damage ?? 8,
                speed: pattern.speed ?? 4,
                color: pattern.color,
                size: pattern.size ?? 4,
                life: pattern.life ?? 110,
                owner: e
            });
        };

        if (pattern.kind === 'fan') {
            const spreadRad = ((pattern.spreadDeg ?? 60) * Math.PI) / 180;
            for (const a of computeFanAngles(aim, pattern.count ?? 5, spreadRad)) spawn(a);
            this._finish();
            return;
        }

        if (pattern.kind === 'ring') {
            this.ringPhase += pattern.phaseStep ?? 0.35;
            for (const a of computeRingAngles(pattern.count ?? 12, this.ringPhase)) spawn(a);
            this._finish();
            return;
        }

        // aimed_burst：每 interval 帧一发，共 count 发
        const interval = pattern.interval ?? 8;
        if (this.active.tick % interval === 0) {
            spawn(aim);
            this.active.fired++;
        }
        this.active.tick++;
        if (this.active.fired >= (pattern.count ?? 3)) this._finish();
    }

    _finish() {
        this.active = null;
        this.cooldownTimer = this.cooldown;
    }
}
