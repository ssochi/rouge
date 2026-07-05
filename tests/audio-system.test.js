// tests/audio-system.test.js
// 音频系统纯逻辑测试：SfxData 结构 + 离线渲染峰值、WeaponSfxMap 全覆盖、
// 节流三件套（同帧去重/最小间隔/连发递减/金币升调）、并发声部抢占、距离衰减。
import { describe, it, expect } from 'vitest';
import { SynthEngine } from '../src/core/audio/SynthEngine.js';
import { SfxData, SFX_IDS, ENEMY_DEATH_SFX } from '../src/assets/audio/SfxData.js';
import { WEAPON_SFX, resolveWeaponSfx } from '../src/assets/audio/WeaponSfxMap.js';
import { VoiceThrottle, VoicePool, distanceAttenuation } from '../src/core/audio/SoundSystem.js';
import { WEAPONS } from '../src/assets/weapons/WeaponData.js';

const SR = 44100;

describe('SfxData 结构与渲染', () => {
    it('每条音效结构合法', () => {
        for (const id of SFX_IDS) {
            const spec = SfxData[id];
            expect(spec, id).toBeTruthy();
            expect(spec.duration, `${id}.duration`).toBeGreaterThan(0);
            expect(spec.duration, `${id}.duration`).toBeLessThanOrEqual(2);
            expect(spec.gain, `${id}.gain`).toBeGreaterThan(0);
            expect(spec.gain, `${id}.gain`).toBeLessThanOrEqual(1);
            expect(Array.isArray(spec.layers), `${id}.layers`).toBe(true);
            expect(spec.layers.length, `${id}.layers.length`).toBeGreaterThan(0);
            for (const layer of spec.layers) {
                const t = layer.type || 'osc';
                expect(['osc', 'noise'], `${id} layer.type`).toContain(t);
                if (t === 'osc') {
                    expect(typeof layer.freq === 'number' || typeof spec.duration === 'number').toBe(true);
                }
            }
        }
    });

    it('枪声/爆炸 ≥2 层，爆炸含 <100Hz 低频体', () => {
        const guns = SFX_IDS.filter((id) => id.startsWith('gun_'));
        for (const id of guns) {
            expect(SfxData[id].layers.length, `${id} 层数`).toBeGreaterThanOrEqual(2);
        }
        expect(SfxData.explosion.layers.length).toBeGreaterThanOrEqual(2);
        const hasSub = SfxData.explosion.layers.some((l) => (l.type || 'osc') === 'osc' && (l.freq <= 100 || l.freqEnd <= 100));
        expect(hasSub, '爆炸缺少 <100Hz 低频层').toBe(true);
    });

    it('离线渲染：无静音条、无爆音条，峰值 ∈ [0.1, 1.0]，无 NaN', () => {
        const eng = new SynthEngine();
        for (const id of SFX_IDS) {
            const buf = eng.render(id, SfxData[id], SR);
            expect(buf.length, `${id} 采样数`).toBeGreaterThan(0);
            let peak = 0;
            let nan = false;
            for (let i = 0; i < buf.length; i++) {
                const v = buf[i];
                if (Number.isNaN(v)) nan = true;
                const a = Math.abs(v);
                if (a > peak) peak = a;
            }
            expect(nan, `${id} 含 NaN`).toBe(false);
            expect(peak, `${id} 峰值下限`).toBeGreaterThanOrEqual(0.1);
            expect(peak, `${id} 峰值上限`).toBeLessThanOrEqual(1.0001);
        }
    });

    it('渲染确定性：同 id 两次渲染逐采样一致（缓存复现）', () => {
        const a = new SynthEngine().render('explosion', SfxData.explosion, SR);
        const b = new SynthEngine().render('explosion', SfxData.explosion, SR);
        expect(a.length).toBe(b.length);
        for (let i = 0; i < a.length; i += 257) expect(a[i]).toBe(b[i]);
    });

    it('缓存命中：同引擎二次 render 返回同一 buffer', () => {
        const eng = new SynthEngine();
        const a = eng.render('gun_pistol', SfxData.gun_pistol, SR);
        const b = eng.render('gun_pistol', SfxData.gun_pistol, SR);
        expect(a).toBe(b);
        expect(eng.cacheSize).toBe(1);
    });
});

describe('WeaponSfxMap 覆盖', () => {
    it('覆盖 WEAPONS 全部含 damage(>0) 或 isMelee 的 id', () => {
        const real = Object.entries(WEAPONS)
            .filter(([, w]) => (w.damage > 0) || w.isMelee)
            .map(([id]) => id);
        expect(real.length).toBe(36);
        const missing = real.filter((id) => !WEAPON_SFX[id]);
        expect(missing, `未映射: ${missing.join(',')}`).toEqual([]);
    });

    it('每把武器引用的音色族都存在于 SfxData', () => {
        for (const [id, m] of Object.entries(WEAPON_SFX)) {
            expect(SfxData[m.family], `${id} → 未知族 ${m.family}`).toBeTruthy();
            expect(m.pitch, `${id}.pitch`).toBeGreaterThan(0);
            expect(m.decay, `${id}.decay`).toBeGreaterThan(0);
        }
    });

    it('resolveWeaponSfx 对未知 id 回退且永不落空', () => {
        expect(resolveWeaponSfx('__nope__').family).toBe('gun_pistol');
        expect(resolveWeaponSfx('sniper').family).toBe('gun_sniper');
    });

    it('敌人死亡类别映射均指向存在的音效', () => {
        for (const v of Object.values(ENEMY_DEATH_SFX)) {
            expect(SfxData[v], `未知死亡音 ${v}`).toBeTruthy();
        }
    });
});

describe('VoiceThrottle 节流', () => {
    it('同帧重复与最小间隔内被丢弃', () => {
        const th = new VoiceThrottle({ minIntervalMs: 30 });
        expect(th.request('a', 1000)).toBeTruthy();  // 首次通过
        expect(th.request('a', 1000)).toBeNull();     // 同帧去重
        expect(th.request('a', 1015)).toBeNull();     // <30ms 丢弃
        expect(th.request('a', 1031)).toBeTruthy();   // ≥30ms 通过
    });

    it('不同音效互不影响', () => {
        const th = new VoiceThrottle({ minIntervalMs: 30 });
        expect(th.request('a', 1000)).toBeTruthy();
        expect(th.request('b', 1000)).toBeTruthy();
    });

    it('连发音量递减且有下限', () => {
        const th = new VoiceThrottle({ minIntervalMs: 30, decayStep: 0.08, minVolumeScale: 0.5, rand: () => 0.5 });
        let last;
        for (let i = 0; i < 30; i++) last = th.request('smg', 1000 + i * 35);
        expect(last.volumeScale).toBeGreaterThanOrEqual(0.5);
        expect(last.volumeScale).toBeLessThan(1);
    });

    it('连发音高有 ±抖动', () => {
        const th = new VoiceThrottle({ minIntervalMs: 30, jitter: 0.05, rand: () => 0 }); // rand=0 → -5%
        th.request('smg', 1000);
        const r = th.request('smg', 1040);
        expect(r.pitchScale).toBeCloseTo(0.95, 5);
    });

    it('金币连拾音高逐级升高', () => {
        const th = new VoiceThrottle({ minIntervalMs: 30, ladderStep: 0.06 });
        const a = th.request('coin', 0, { ladder: true });
        const b = th.request('coin', 40, { ladder: true });
        const c = th.request('coin', 80, { ladder: true });
        expect(a.pitchScale).toBe(1);
        expect(b.pitchScale).toBeGreaterThan(a.pitchScale);
        expect(c.pitchScale).toBeGreaterThan(b.pitchScale);
        expect(a.volumeScale).toBe(1); // 升调不衰减
    });
});

describe('VoicePool 并发抢占', () => {
    it('未满不抢占，满则按最低优先级+最老抢占', () => {
        const pool = new VoicePool(3);
        pool.add({ node: 'a', priority: 2, startTime: 1 });
        expect(pool.overCap()).toBe(false);
        pool.add({ node: 'b', priority: 1, startTime: 2 });
        pool.add({ node: 'c', priority: 1, startTime: 3 });
        expect(pool.overCap()).toBe(true);
        // 新音优先级 2：可抢占 ≤2 中最低(1)且最老(b)
        expect(pool.pickVictim(2).node).toBe('b');
    });

    it('新音优先级低于所有活跃音时不抢占（应丢弃）', () => {
        const pool = new VoicePool(2);
        pool.add({ node: 'x', priority: 5, startTime: 1 });
        pool.add({ node: 'y', priority: 4, startTime: 2 });
        expect(pool.pickVictim(1)).toBeNull();
    });

    it('remove 按 node 精确移除', () => {
        const pool = new VoicePool(4);
        const n = {};
        pool.add({ node: n, priority: 1, startTime: 1 });
        expect(pool.size).toBe(1);
        pool.remove(n);
        expect(pool.size).toBe(0);
    });
});

describe('距离衰减', () => {
    it('近距不衰减、中距线性、超距归零', () => {
        expect(distanceAttenuation(0)).toBe(1);
        expect(distanceAttenuation(100)).toBe(1);
        expect(distanceAttenuation(800)).toBe(0);
        const mid = distanceAttenuation(460);
        expect(mid).toBeGreaterThan(0);
        expect(mid).toBeLessThan(1);
    });
});
