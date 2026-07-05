// RangedPatternBehavior —— 弹幕模式库（数据配置驱动 CombatSystem.spawnEnemyBullet）。
// 模式：
//   fan         扇形散射：{count, spreadDeg, speed, damage, color, size, life} 一次齐射
//   ring        环形爆发：{count, speed, damage, color, size, life, phaseStep} 一次全环（phase 随次数旋转）
//   aimed_burst 瞄准连发：{count, interval, speed, damage, color, size, life, trackTarget} 逐发计时
//   spiral      螺旋连发：{count, interval, stepRad, speed, damage, ...} 每 interval 帧发 1 颗，角度逐发 +stepRad（起始朝玩家）
//   wave_volley 波浪齐射：{count, spreadDeg, speed, damage, waveAmplitude, waveFrequency, ...} 向玩家齐射带 wave 字段的蛇形弹
//   split_shot  分裂大弹：{speed, damage, size, splitAfter, splitCount, splitDamage, splitSpeed, ...} 单发大弹飞行后裂成环形小弹
//   wall        弹墙压位：{count, spacing, gapCount, speed, damage, ...} 垂直瞄准方向一字排开平行弹，随机留缺口
// 配置：{ patterns: [{kind, weight, ...cfg}], cooldown, range, rng }

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
     * @param {Function} [opts.rng=Math.random] 随机源（wall 缺口用，便于测试注入）
     */
    constructor({ patterns, cooldown = 120, range = 320, rng = Math.random }) {
        this.patterns = patterns || [];
        this.cooldown = cooldown;
        this.range = range;
        this.rng = rng;
        this.cooldownTimer = Math.floor(cooldown * 0.5); // 首发半冷却，避免进房瞬间齐射
        this.active = null;   // { pattern, tick, fired, startAngle }
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

        // spiral：起始角朝玩家，每 interval 帧发 1 颗，逐发角度 +stepRad（旋转扫射）
        if (pattern.kind === 'spiral') {
            if (this.active.startAngle === undefined) this.active.startAngle = aim;
            const interval = pattern.interval ?? 4;
            if (this.active.tick % interval === 0) {
                spawn(this.active.startAngle + this.active.fired * (pattern.stepRad ?? 0.4));
                this.active.fired++;
            }
            this.active.tick++;
            if (this.active.fired >= (pattern.count ?? 12)) this._finish();
            return;
        }

        // wave_volley：向玩家方向齐射 count 颗带 wave 字段的蛇形弹（±小扇形）
        if (pattern.kind === 'wave_volley') {
            const spreadRad = ((pattern.spreadDeg ?? 12) * Math.PI) / 180;
            for (const a of computeFanAngles(aim, pattern.count ?? 3, spreadRad)) {
                cs.spawnEnemyBullet({
                    x: e.x, y: e.y, angle: a,
                    damage: pattern.damage ?? 8,
                    speed: pattern.speed ?? 3,
                    color: pattern.color,
                    size: pattern.size ?? 5,
                    life: pattern.life ?? 150,
                    owner: e,
                    waveAmplitude: pattern.waveAmplitude ?? 14,
                    waveFrequency: pattern.waveFrequency ?? 0.14
                });
            }
            this._finish();
            return;
        }

        // split_shot：单发大弹朝玩家，飞行 splitAfter 帧后裂成环形小弹
        if (pattern.kind === 'split_shot') {
            cs.spawnEnemyBullet({
                x: e.x, y: e.y, angle: aim,
                damage: pattern.damage ?? 10,
                speed: pattern.speed ?? 3,
                color: pattern.color,
                size: pattern.size ?? 8,
                life: pattern.life ?? 120,
                owner: e,
                splitAfter: pattern.splitAfter ?? 45,
                splitCount: pattern.splitCount ?? 8,
                splitSpeed: pattern.splitSpeed ?? 2.5,
                splitDamage: pattern.splitDamage ?? 5,
                splitChildLife: pattern.splitChildLife
            });
            this._finish();
            return;
        }

        // wall：垂直瞄准方向一字排开 count 颗平行弹，随机留 gapCount 个缺口
        if (pattern.kind === 'wall') {
            const count = pattern.count ?? 9;
            const spacing = pattern.spacing ?? 26;
            const perpAngle = aim + Math.PI / 2;
            const px = Math.cos(perpAngle);
            const py = Math.sin(perpAngle);
            const gapCount = Math.min(pattern.gapCount ?? 1, count - 1);
            const gaps = new Set();
            let guard = 0;
            while (gaps.size < gapCount && guard < count * 4) {
                gaps.add(Math.floor(this.rng() * count));
                guard++;
            }
            for (let k = 0; k < count; k++) {
                if (gaps.has(k)) continue;
                const off = (k - (count - 1) / 2) * spacing;
                cs.spawnEnemyBullet({
                    x: e.x + px * off,
                    y: e.y + py * off,
                    angle: aim,
                    damage: pattern.damage ?? 7,
                    speed: pattern.speed ?? 3,
                    color: pattern.color,
                    size: pattern.size ?? 5,
                    life: pattern.life ?? 150,
                    owner: e
                });
            }
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
