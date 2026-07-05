// SynthEngine.js
// 程序化音效合成核心：参数 spec → mono Float32 采样缓冲（无任何外部音频文件 / npm 依赖）。
//
// 设计哲学与美术管线同构：本文件是"引擎"（等价 PixelDraw），SfxData.js 是"音色数据"
// （等价每个物件的绘制参数）。合成完全走逐采样数学运算，不依赖 Web Audio 节点图，
// 因此可在 Node（vitest）里离线渲染并做峰值/时长断言，无需浏览器。
//
// 五种原语（方案 §0）：
//   1. 振荡器 sine/square/saw/triangle（含频率包络滑音 glide）
//   2. 噪声源 白噪（确定性 PRNG，缓存可复现）
//   3. ADSR 增益包络
//   4. 状态变量滤波器 SVF（lowpass/highpass/bandpass，支持逐采样扫频）
//   5. WaveShaper 失真（tanh 软削波，出"脏"与冲击感）
//
// 分层出厚度：一条音效由多个 layer 叠加（枪声=低频正弦冲击+中频噪声瞬态+高频啪）。
// 每条音效渲染一次后按 id 缓存 Float32（首播零 GC）；播放期的音高抖动由 SoundSystem
// 用 playbackRate 实现，不破坏缓存。

const TAU = Math.PI * 2;

/** mulberry32 确定性 PRNG：同一 seed 产出同一噪声序列，保证缓存与单测可复现。 */
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** 字符串 → 32 位整型哈希（给每条音效派生噪声 seed）。 */
function hashSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** 在 [0,1] 归一化进度 t 上求频率滑音值（线性 / 指数）。 */
function glideFreq(f0, f1, t, mode) {
    if (f1 == null || f1 === f0) return f0;
    if (mode === 'exp') {
        // 指数滑音更符合听感（枪声基频"坠"下去）
        const a = Math.max(1e-3, f0);
        const b = Math.max(1e-3, f1);
        return a * Math.pow(b / a, t);
    }
    return f0 + (f1 - f0) * t;
}

/** 单周期波形取值（phase 单位为弧度累积量）。 */
function waveSample(wave, phase) {
    switch (wave) {
        case 'square':
            return Math.sin(phase) >= 0 ? 1 : -1;
        case 'saw': {
            const p = (phase / TAU) % 1;
            return 2 * (p < 0 ? p + 1 : p) - 1;
        }
        case 'triangle':
            return (2 / Math.PI) * Math.asin(Math.sin(phase));
        case 'sine':
        default:
            return Math.sin(phase);
    }
}

/**
 * ADSR 包络值。总时长 durSec 内：attack↑ → decay↓sustainLevel → sustain 保持 → release↓0。
 * sustain 段时长 = 总时长扣除 a/d/r 的剩余（可为 0，退化为纯 AD 打击包络）。
 */
function adsrValue(tSec, durSec, env) {
    const a = env.attack ?? 0.002;
    const d = env.decay ?? Math.max(0.01, durSec * 0.5);
    const r = env.release ?? 0.02;
    const sl = env.sustainLevel ?? 0;
    const sustainDur = Math.max(0, durSec - a - d - r);
    const relStart = a + d + sustainDur;

    if (tSec < a) {
        return a <= 1e-6 ? 1 : tSec / a;
    }
    if (tSec < a + d) {
        const k = d <= 1e-6 ? 1 : (tSec - a) / d;
        return 1 + (sl - 1) * k; // 1 → sustainLevel
    }
    if (tSec < relStart) {
        return sl;
    }
    // release：sustainLevel → 0
    const k = r <= 1e-6 ? 1 : (tSec - relStart) / r;
    return Math.max(0, sl * (1 - k));
}

/** 状态变量滤波器（TPT/Chamberlin），逐采样可变截止，稳定且适合扫频。 */
class SVF {
    constructor(sampleRate) {
        this.sr = sampleRate;
        this.ic1 = 0;
        this.ic2 = 0;
    }
    // type: 'lowpass' | 'highpass' | 'bandpass'
    process(x, fc, q, type) {
        const g = Math.tan((Math.PI * Math.min(fc, this.sr * 0.49)) / this.sr);
        const k = 1 / Math.max(0.05, q);
        const a1 = 1 / (1 + g * (g + k));
        const a2 = g * a1;
        const a3 = g * a2;
        const v3 = x - this.ic2;
        const v1 = a1 * this.ic1 + a2 * v3;
        const v2 = this.ic2 + a2 * this.ic1 + a3 * v3;
        this.ic1 = 2 * v1 - this.ic1;
        this.ic2 = 2 * v2 - this.ic2;
        if (type === 'highpass') return x - k * v1 - v2;
        if (type === 'bandpass') return v1;
        return v2; // lowpass
    }
}

/** tanh 软削波失真；drive 越大谐波越丰富，归一化保持整体幅度。 */
function shape(x, drive) {
    if (!drive) return x;
    const g = 1 + drive;
    return Math.tanh(x * g) / Math.tanh(g);
}

/**
 * 渲染单个 layer 到目标缓冲（就地累加）。
 * @param {Float32Array} out 目标缓冲
 * @param {object} layer 层参数
 * @param {number} sampleRate
 * @param {number} totalSec 整条音效时长
 * @param {() => number} rng 噪声源
 */
function renderLayer(out, layer, sampleRate, totalSec, rng) {
    const delay = layer.delay || 0;
    const layerDur = Math.min(layer.duration ?? (totalSec - delay), totalSec - delay);
    if (layerDur <= 0) return;
    const startIdx = Math.floor(delay * sampleRate);
    const n = Math.floor(layerDur * sampleRate);
    const gain = layer.gain ?? 1;
    const env = layer.env || {};
    const isNoise = layer.type === 'noise';
    const wave = layer.wave || 'sine';
    const filter = layer.filter || null;
    const svf = filter ? new SVF(sampleRate) : null;
    const drive = layer.drive || 0;

    let phase = 0;
    for (let i = 0; i < n; i++) {
        const idx = startIdx + i;
        if (idx >= out.length) break;
        const t = i / n; // 0..1 层内进度
        const tSec = i / sampleRate;

        let s;
        if (isNoise) {
            s = rng() * 2 - 1;
        } else {
            const f = glideFreq(layer.freq ?? 220, layer.freqEnd, t, layer.glide || 'exp');
            phase += (TAU * f) / sampleRate;
            s = waveSample(wave, phase);
        }

        if (svf) {
            const fc = glideFreq(filter.freq ?? 1000, filter.freqEnd, t, filter.glide || 'lin');
            s = svf.process(s, fc, filter.q ?? 1, filter.type || 'lowpass');
        }

        if (drive) s = shape(s, drive);

        const e = adsrValue(tSec, layerDur, env);
        out[idx] += s * e * gain;
    }
}

export class SynthEngine {
    constructor() {
        // key: `${id}@${sampleRate}` → Float32Array
        this._cache = new Map();
    }

    /**
     * 渲染一条音效为 mono Float32 采样缓冲（带缓存）。
     * 渲染后按 spec.gain 做峰值归一化：保证峰值恒等于 gain（∈(0,1]），
     * 既避免静音条目也避免爆音条目，跨音效音量由各自 gain 掌控（便于混音）。
     * @param {string} id 音效 id（用于缓存键与噪声 seed）
     * @param {object} spec { duration, gain, layers:[...] }
     * @param {number} sampleRate
     * @returns {Float32Array}
     */
    render(id, spec, sampleRate = 44100) {
        const key = `${id}@${sampleRate}`;
        const cached = this._cache.get(key);
        if (cached) return cached;

        const totalSec = spec.duration || 0.2;
        const total = Math.max(1, Math.floor(totalSec * sampleRate));
        const out = new Float32Array(total);
        const rng = mulberry32(hashSeed(id));

        const layers = spec.layers || [];
        for (const layer of layers) {
            renderLayer(out, layer, sampleRate, totalSec, rng);
        }

        // 峰值归一化到目标增益
        let peak = 0;
        for (let i = 0; i < total; i++) {
            const a = Math.abs(out[i]);
            if (a > peak) peak = a;
        }
        const targetGain = spec.gain ?? 0.8;
        if (peak > 1e-6) {
            const scale = targetGain / peak;
            for (let i = 0; i < total; i++) out[i] *= scale;
        }

        // 收尾淡出（避免缓冲末端硬切爆音）；循环音效跳过以保持无缝拼接
        if (!spec.loop) {
            const fade = Math.min(total, Math.floor(sampleRate * 0.003));
            for (let i = 0; i < fade; i++) {
                out[total - 1 - i] *= i / fade;
            }
        }

        this._cache.set(key, out);
        return out;
    }

    /** 清空缓存（一般无需调用；采样率变更时可复位）。 */
    clearCache() {
        this._cache.clear();
    }

    /** 已缓存条目数（调试/测试用）。 */
    get cacheSize() {
        return this._cache.size;
    }
}

// 便于单测直接引用内部纯函数
export const _internals = { mulberry32, hashSeed, glideFreq, waveSample, adsrValue, shape, SVF };
