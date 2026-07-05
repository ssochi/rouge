// SoundSystem.js
// 音频运行时：AudioContext 生命周期与手势解锁、主总线与压缩、播放调度与节流、
// 立体声定位与距离衰减、音量持久化、静音、传送门循环嗡鸣。
//
// 合成交给 SynthEngine（参数→采样），本文件只负责"何时/以何种音量/位置/音高播放"。
// 节流是射击游戏的硬需求（SMG 每秒 12 发 × 命中音 = 轰炸），从一开始就内建：
//   1) 同音效最小重触发间隔（默认 30ms，天然吞掉同帧重复）
//   2) 全局并发 voices 上限（默认 16）+ 优先级抢占
//   3) 连发音量递减 + ±5% 音高抖动（避免机关枪打成蜂鸣）
//
// 纯逻辑部分（VoiceThrottle / VoicePool）不触碰 Web Audio，导出供 vitest 单测。

import { SynthEngine } from './SynthEngine.js';
import { SfxData, ENEMY_DEATH_SFX } from '../../assets/audio/SfxData.js';
import { resolveWeaponSfx } from '../../assets/audio/WeaponSfxMap.js';

const STORAGE_KEY = 'rl_audio_settings_v1';

// 空间/衰减常量（世界像素）
const PAN_RANGE = 420;      // 声源相对玩家 x 的满偏移距离
const NEAR_DIST = 160;      // 该距离内不衰减
const MAX_DIST = 760;       // 超出则丢弃（不占用 voice）
const PORTAL_HUM_MAX = 280; // 传送门嗡鸣渐入半径

/**
 * 节流器（纯逻辑）：同音效最小间隔 + 连发音量递减/音高抖动 / 金币升调阶梯。
 * request() 返回 null 表示本次应丢弃，否则返回 { volumeScale, pitchScale }。
 */
export class VoiceThrottle {
    constructor({ minIntervalMs = 30, comboWindowMs = 250, decayStep = 0.08, minVolumeScale = 0.5, jitter = 0.05, ladderStep = 0.06, ladderMax = 12, rand = Math.random } = {}) {
        this.minIntervalMs = minIntervalMs;
        this.comboWindowMs = comboWindowMs;
        this.decayStep = decayStep;
        this.minVolumeScale = minVolumeScale;
        this.jitter = jitter;
        this.ladderStep = ladderStep;
        this.ladderMax = ladderMax;
        this._rand = rand;
        this._last = new Map();   // id → last accepted time
        this._combo = new Map();  // id → { count, time }
    }

    request(id, now, { ladder = false } = {}) {
        const last = this._last.get(id);
        if (last != null && now - last < this.minIntervalMs) return null; // 间隔内丢弃（含同帧去重）
        this._last.set(id, now);

        let c = this._combo.get(id);
        if (!c || now - c.time > this.comboWindowMs) c = { count: 0, time: now };
        else c = { count: c.count + 1, time: now };
        this._combo.set(id, c);

        if (ladder) {
            // 连拾金币：音高逐级升高（爽感小技巧），不衰减音量
            return { volumeScale: 1, pitchScale: 1 + Math.min(c.count, this.ladderMax) * this.ladderStep };
        }
        const volumeScale = Math.max(this.minVolumeScale, 1 - c.count * this.decayStep);
        const pitchScale = c.count > 0 ? 1 + (this._rand() * 2 - 1) * this.jitter : 1;
        return { volumeScale, pitchScale };
    }
}

/**
 * 并发声部池（纯逻辑）：维护活跃 voice 记录，超上限时按"优先级最低、其次最老"抢占。
 * 记录的 node 可为任意句柄（测试用普通对象；运行时为 AudioBufferSourceNode）。
 */
export class VoicePool {
    constructor(maxVoices = 16) {
        this.maxVoices = maxVoices;
        this.voices = []; // { node, priority, startTime }
    }
    get size() { return this.voices.length; }
    overCap() { return this.voices.length >= this.maxVoices; }

    /** 找可被新音（newPriority）抢占的受害者：优先级 ≤ 新音中，最低优先级、最老者；无则 null。 */
    pickVictim(newPriority) {
        let victim = null;
        for (const v of this.voices) {
            if (v.priority > newPriority) continue;
            if (!victim || v.priority < victim.priority || (v.priority === victim.priority && v.startTime < victim.startTime)) {
                victim = v;
            }
        }
        return victim;
    }
    add(record) { this.voices.push(record); }
    remove(node) {
        const i = this.voices.findIndex((v) => v.node === node);
        if (i !== -1) this.voices.splice(i, 1);
    }
}

/** 声源相对玩家的距离衰减系数（0..1），超 MAX_DIST 返回 0（调用方据此丢弃）。 */
export function distanceAttenuation(dist) {
    if (dist <= NEAR_DIST) return 1;
    if (dist >= MAX_DIST) return 0;
    return 1 - (dist - NEAR_DIST) / (MAX_DIST - NEAR_DIST);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

export class SoundSystem {
    constructor({ player = null, maxVoices = 16 } = {}) {
        this.player = player;
        this.engine = new SynthEngine();
        this.throttle = new VoiceThrottle();
        this.pool = new VoicePool(maxVoices);

        this.ctx = null;
        this.unlocked = false;
        this.master = null;      // GainNode（含静音）
        this.compressor = null;  // DynamicsCompressor
        this.sfxBus = null;      // GainNode（音效音量）

        this._buffers = new Map(); // id → AudioBuffer（懒建缓存）
        this._hum = null;          // 传送门循环嗡鸣状态

        // 设置（localStorage 持久化）
        const saved = this._loadSettings();
        this.masterVolume = saved.master ?? 0.8;
        this.sfxVolume = saved.sfx ?? 1.0;
        this.musicVolume = saved.music ?? 0.7; // 预留 P3
        this.muted = saved.muted ?? false;

        this._boundUnlock = () => this._unlock();
        this._attachUnlockListeners();
        this._attachVisibility();
    }

    // ───────────────────── 生命周期 / 解锁 ─────────────────────

    _attachUnlockListeners() {
        if (typeof window === 'undefined') return;
        // 桌面：keydown/mousedown；移动：touchend。一次性，解锁后自摘。
        window.addEventListener('keydown', this._boundUnlock, { once: false });
        window.addEventListener('mousedown', this._boundUnlock, { once: false });
        window.addEventListener('touchend', this._boundUnlock, { once: false });
    }

    _detachUnlockListeners() {
        if (typeof window === 'undefined') return;
        window.removeEventListener('keydown', this._boundUnlock);
        window.removeEventListener('mousedown', this._boundUnlock);
        window.removeEventListener('touchend', this._boundUnlock);
    }

    _attachVisibility() {
        if (typeof document === 'undefined') return;
        document.addEventListener('visibilitychange', () => {
            if (!this.ctx) return;
            if (document.hidden) this.ctx.suspend?.();
            else this.ctx.resume?.();
        });
    }

    _unlock() {
        if (this.unlocked) return;
        const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null;
        if (!AC) return;
        try {
            this.ctx = new AC();
            // master → 压缩器（防多音叠加爆音）→ destination
            this.master = this.ctx.createGain();
            this.compressor = this.ctx.createDynamicsCompressor();
            this.compressor.threshold.value = -14;
            this.compressor.knee.value = 24;
            this.compressor.ratio.value = 4;
            this.compressor.attack.value = 0.003;
            this.compressor.release.value = 0.12;
            this.sfxBus = this.ctx.createGain();

            this.sfxBus.connect(this.master);
            this.master.connect(this.compressor);
            this.compressor.connect(this.ctx.destination);
            this._applyVolumes();

            this.unlocked = true;
            this.ctx.resume?.();
            this._detachUnlockListeners();
        } catch (e) {
            this.ctx = null;
        }
    }

    // ───────────────────── 缓冲 ─────────────────────

    _getBuffer(id) {
        let buf = this._buffers.get(id);
        if (buf) return buf;
        const spec = SfxData[id];
        if (!spec || !this.ctx) return null;
        const samples = this.engine.render(id, spec, this.ctx.sampleRate);
        buf = this.ctx.createBuffer(1, samples.length, this.ctx.sampleRate);
        buf.copyToChannel(samples, 0);
        this._buffers.set(id, buf);
        return buf;
    }

    // ───────────────────── 播放 ─────────────────────

    /**
     * 播放一条音效。
     * @param {string} id SfxData 中的音效 id
     * @param {object} [opts]
     * @param {number} [opts.x] 声源世界 x（提供则做 pan + 距离衰减，超距丢弃）
     * @param {number} [opts.y] 声源世界 y
     * @param {number} [opts.volume=1] 附加音量系数
     * @param {number} [opts.pitch=1] 附加音高（playbackRate 系数）
     * @param {number} [opts.decay=1] 尾音时长比例（<1 提前淡出）
     * @param {number} [opts.priority] 覆盖 spec.priority
     * @param {boolean} [opts.ladder] 连触升调（金币）
     */
    play(id, opts = {}) {
        if (!this.unlocked || !this.ctx || this.muted) return false;
        const spec = SfxData[id];
        if (!spec) return false;

        // 空间定位 + 距离衰减
        let pan = 0;
        let atten = 1;
        if (opts.x != null && this.player) {
            const dx = opts.x - this.player.x;
            const dy = (opts.y != null ? opts.y - this.player.y : 0);
            const dist = Math.hypot(dx, dy);
            atten = distanceAttenuation(dist);
            if (atten <= 0) return false; // 超距丢弃，不占 voice
            pan = clamp(dx / PAN_RANGE, -1, 1);
        }

        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const t = this.throttle.request(id, now, { ladder: !!opts.ladder });
        if (!t) return false;

        // 并发抢占
        const priority = opts.priority ?? spec.priority ?? 1;
        if (this.pool.overCap()) {
            const victim = this.pool.pickVictim(priority);
            if (!victim) return false; // 全是更高优先级音，丢弃新音
            try { victim.node.stop(); } catch (e) { /* already stopped */ }
            this.pool.remove(victim.node);
        }

        const buffer = this._getBuffer(id);
        if (!buffer) return false;

        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        const rate = clamp((opts.pitch || 1) * t.pitchScale, 0.25, 4);
        src.playbackRate.value = rate;

        const gainNode = this.ctx.createGain();
        const vol = clamp((opts.volume ?? 1) * atten * t.volumeScale, 0, 4);
        const nowT = this.ctx.currentTime;
        gainNode.gain.setValueAtTime(vol, nowT);

        // 尾音收束（per-weapon decay<1）：按实际播放时长提前淡出
        const decay = opts.decay ?? 1;
        if (decay < 1) {
            const playDur = buffer.duration / rate;
            const fadeStart = nowT + Math.max(0.02, playDur * clamp(decay, 0.1, 1));
            gainNode.gain.setValueAtTime(vol, fadeStart);
            gainNode.gain.linearRampToValueAtTime(0.0001, fadeStart + 0.02);
        }

        let out = gainNode;
        if (this.ctx.createStereoPanner) {
            const panner = this.ctx.createStereoPanner();
            panner.pan.value = pan;
            gainNode.connect(panner);
            out = panner;
        }
        src.connect(gainNode);
        out.connect(this.sfxBus);

        const record = { node: src, priority, startTime: now };
        this.pool.add(record);
        src.onended = () => {
            this.pool.remove(src);
            try { src.disconnect(); gainNode.disconnect(); if (out !== gainNode) out.disconnect(); } catch (e) { /* noop */ }
        };
        src.start();
        return true;
    }

    /** 按武器 id 播放开火音（查 WeaponSfxMap 得音色族 + pitch/decay 偏移）。 */
    playWeapon(weaponId, opts = {}) {
        const w = resolveWeaponSfx(weaponId);
        return this.play(w.family, { ...opts, pitch: (opts.pitch || 1) * w.pitch, decay: w.decay });
    }

    /** 按敌人 spawnType 播放死亡音（肉/机械/幽体三类，默认肉）。 */
    playEnemyDeath(spawnType, opts = {}) {
        const id = ENEMY_DEATH_SFX[spawnType] || 'enemy_die_flesh';
        return this.play(id, opts);
    }

    /** 拾取金币/钥匙：金币走升调阶梯。 */
    playPickup(kind, opts = {}) {
        if (kind === 'key') return this.play('pickup_key', opts);
        return this.play('pickup_coin', { ...opts, ladder: true });
    }

    // ───────────────────── 传送门循环嗡鸣 ─────────────────────

    /**
     * 每帧驱动传送门嗡鸣：按最近传送门距离渐入音量、按相对 x 定位。
     * @param {number} distance 玩家到最近传送门中心的距离（无传送门传 Infinity 淡出）
     * @param {number} [panValue] 立体声偏移（-1..1）
     */
    updatePortalHum(distance, panValue = 0) {
        if (!this.unlocked || !this.ctx || this.muted) return;
        const target = distance >= PORTAL_HUM_MAX || !Number.isFinite(distance)
            ? 0
            : (1 - distance / PORTAL_HUM_MAX);

        if (!this._hum) {
            if (target <= 0.001) return; // 无需起振
            const buffer = this._getBuffer('portal_hum');
            if (!buffer) return;
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            src.loop = true;
            const gain = this.ctx.createGain();
            gain.gain.value = 0;
            let out = gain;
            let panner = null;
            if (this.ctx.createStereoPanner) {
                panner = this.ctx.createStereoPanner();
                gain.connect(panner);
                out = panner;
            }
            src.connect(gain);
            out.connect(this.sfxBus);
            src.start();
            this._hum = { src, gain, panner };
        }
        const now = this.ctx.currentTime;
        this._hum.gain.gain.setTargetAtTime(target, now, 0.15);
        if (this._hum.panner) this._hum.panner.pan.setTargetAtTime(clamp(panValue, -1, 1), now, 0.15);
    }

    stopPortalHum() {
        if (!this._hum) return;
        try { this._hum.src.stop(); this._hum.src.disconnect(); this._hum.gain.disconnect(); } catch (e) { /* noop */ }
        this._hum = null;
    }

    // ───────────────────── 音量 / 静音 / 持久化 ─────────────────────

    _applyVolumes() {
        if (!this.master || !this.sfxBus) return;
        const t = this.ctx ? this.ctx.currentTime : 0;
        this.master.gain.setValueAtTime(this.muted ? 0 : this.masterVolume, t);
        this.sfxBus.gain.setValueAtTime(this.sfxVolume, t);
    }

    setMasterVolume(v) { this.masterVolume = clamp(v, 0, 1); this._applyVolumes(); this._saveSettings(); }
    setSfxVolume(v) { this.sfxVolume = clamp(v, 0, 1); this._applyVolumes(); this._saveSettings(); }
    setMusicVolume(v) { this.musicVolume = clamp(v, 0, 1); this._saveSettings(); }

    toggleMute() {
        this.muted = !this.muted;
        this._applyVolumes();
        this._saveSettings();
        return this.muted;
    }
    setMuted(m) { this.muted = !!m; this._applyVolumes(); this._saveSettings(); }

    _loadSettings() {
        if (typeof localStorage === 'undefined') return {};
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }
    _saveSettings() {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                master: this.masterVolume, sfx: this.sfxVolume, music: this.musicVolume, muted: this.muted,
            }));
        } catch (e) { /* 隐私模式等：忽略 */ }
    }
}
