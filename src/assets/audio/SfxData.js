// SfxData.js
// 全部音效的纯参数定义（严禁逻辑，类比 WeaponData）。SynthEngine 读取这些 spec 合成缓冲。
//
// spec 结构：
//   { duration, gain, priority, loop?, layers: [ layer, ... ] }
//   - duration: 总时长（秒）
//   - gain: 峰值归一化目标 ∈(0,1]（同时充当跨音效音量基准；受击/爆炸偏高，拾取/UI 偏低）
//   - priority: 抢占优先级（越大越不易被 voice 上限挤掉）：受击/UI ≥5，爆炸/击杀 3~4，命中/环境 1~2
//   - loop: 循环音效（portal），跳过收尾淡出以保证无缝
//   layer 结构：
//   - type: 'osc'（默认）| 'noise'
//   - wave: 'sine'|'square'|'saw'|'triangle'（osc）
//   - freq / freqEnd / glide('exp'|'lin')：基频与频率包络滑音（osc）
//   - filter: { type:'lowpass'|'highpass'|'bandpass', freq, freqEnd, q, glide }（可选扫频）
//   - env: { attack, decay, sustain(隐式), release, sustainLevel }（ADSR，单位秒）
//   - drive: WaveShaper 失真量（0=无）
//   - gain: 层增益（塑造音色配比）
//   - delay: 层起始延迟（秒，做"咔-嗒"两段感 / 琶音）
//
// 分层底线：枪声/爆炸 ≥2 层；爆炸含 <100Hz 低频体（explosion l1 sine 90→30）。

export const SfxData = {
    // ───────────────────── 枪械音色族（10 族，WeaponSfxMap 映射 36 把武器）─────────────────────

    // 手枪：紧实中频"啪" —— 低频胸腔冲击 + 中频噪声瞬态 + 高频尖啪
    gun_pistol: {
        duration: 0.14, gain: 0.85, priority: 4,
        layers: [
            { wave: 'sine', freq: 180, freqEnd: 70, glide: 'exp', env: { attack: 0.001, decay: 0.05, release: 0.02 }, gain: 1.0 },
            { type: 'noise', filter: { type: 'bandpass', freq: 1200, freqEnd: 600, q: 1.2 }, env: { attack: 0.001, decay: 0.04, release: 0.02 }, drive: 1.5, gain: 0.9 },
            { type: 'noise', filter: { type: 'highpass', freq: 5000, q: 0.7 }, env: { attack: 0, decay: 0.012, release: 0.005 }, gain: 0.5 },
        ],
    },
    // 霰弹：低频轰 + 宽噪声体 + 散射嘶
    gun_shotgun: {
        duration: 0.3, gain: 0.95, priority: 5,
        layers: [
            { wave: 'sine', freq: 120, freqEnd: 45, glide: 'exp', env: { attack: 0.001, decay: 0.12, release: 0.04 }, gain: 1.0 },
            { type: 'noise', filter: { type: 'lowpass', freq: 900, freqEnd: 300, q: 0.9 }, env: { attack: 0.001, decay: 0.16, release: 0.05 }, drive: 2.0, gain: 1.0 },
            { type: 'noise', filter: { type: 'bandpass', freq: 2500, q: 0.8 }, env: { attack: 0, decay: 0.05, release: 0.02 }, gain: 0.6 },
        ],
    },
    // 冲锋枪：轻快短促（连发靠节流的音量递减 + 音高抖动做散点）
    gun_smg: {
        duration: 0.09, gain: 0.72, priority: 3,
        layers: [
            { wave: 'square', freq: 200, freqEnd: 90, glide: 'exp', env: { attack: 0.001, decay: 0.03, release: 0.01 }, gain: 0.8 },
            { type: 'noise', filter: { type: 'bandpass', freq: 1800, q: 1.5 }, env: { attack: 0.001, decay: 0.04, release: 0.015 }, drive: 1.2, gain: 0.8 },
            { type: 'noise', filter: { type: 'highpass', freq: 6000, q: 0.7 }, env: { attack: 0, decay: 0.008, release: 0.004 }, gain: 0.4 },
        ],
    },
    // 步枪：干脆中频 crack
    gun_rifle: {
        duration: 0.13, gain: 0.85, priority: 4,
        layers: [
            { wave: 'sine', freq: 160, freqEnd: 60, glide: 'exp', env: { attack: 0.001, decay: 0.05, release: 0.02 }, gain: 0.9 },
            { type: 'noise', filter: { type: 'bandpass', freq: 1500, freqEnd: 800, q: 1.0 }, env: { attack: 0.001, decay: 0.05, release: 0.02 }, drive: 1.8, gain: 1.0 },
            { type: 'noise', filter: { type: 'highpass', freq: 7000, q: 0.7 }, env: { attack: 0, decay: 0.01, release: 0.005 }, gain: 0.5 },
        ],
    },
    // 狙击：厚重 crack + 长尾余响
    gun_sniper: {
        duration: 0.45, gain: 0.96, priority: 5,
        layers: [
            { wave: 'sine', freq: 140, freqEnd: 40, glide: 'exp', env: { attack: 0.001, decay: 0.18, release: 0.05 }, drive: 1.5, gain: 1.0 },
            { type: 'noise', filter: { type: 'bandpass', freq: 1200, freqEnd: 400, q: 0.8 }, env: { attack: 0.001, decay: 0.12, release: 0.04 }, drive: 2.2, gain: 1.0 },
            { type: 'noise', filter: { type: 'highpass', freq: 4000, q: 0.7 }, env: { attack: 0, decay: 0.02, release: 0.01 }, gain: 0.6 },
            { type: 'noise', filter: { type: 'lowpass', freq: 600, q: 0.7 }, env: { attack: 0.005, decay: 0.25, release: 0.05 }, delay: 0.05, gain: 0.35 },
        ],
    },
    // 激光：下滑"啾" —— 锯齿基音扫频 + 纯音 + 电火花噪声
    gun_laser: {
        duration: 0.22, gain: 0.8, priority: 4,
        layers: [
            { wave: 'saw', freq: 900, freqEnd: 180, glide: 'exp', filter: { type: 'lowpass', freq: 3000, freqEnd: 800, q: 1.0 }, env: { attack: 0.001, decay: 0.12, release: 0.04 }, gain: 0.9 },
            { wave: 'sine', freq: 1400, freqEnd: 300, glide: 'exp', env: { attack: 0.001, decay: 0.08, release: 0.03 }, gain: 0.5 },
            { type: 'noise', filter: { type: 'bandpass', freq: 3000, q: 2.0 }, env: { attack: 0, decay: 0.03, release: 0.01 }, gain: 0.3 },
        ],
    },
    // 火焰：喷射呼呼 + 嘶 + 低频 fwoomp（持续型，中等增益）
    gun_flame: {
        duration: 0.35, gain: 0.62, priority: 3,
        layers: [
            { type: 'noise', filter: { type: 'lowpass', freq: 500, freqEnd: 900, q: 0.7 }, env: { attack: 0.02, decay: 0.3, sustainLevel: 0.6, release: 0.05 }, gain: 1.0 },
            { type: 'noise', filter: { type: 'bandpass', freq: 1600, q: 0.6 }, env: { attack: 0.02, decay: 0.2, sustainLevel: 0.3, release: 0.05 }, drive: 1.5, gain: 0.6 },
            { wave: 'sine', freq: 80, env: { attack: 0.005, decay: 0.1, release: 0.05 }, gain: 0.3 },
        ],
    },
    // 火箭/榴弹：发射 thump + 拖尾 whoosh + 点火噼啪
    gun_rocket: {
        duration: 0.4, gain: 0.9, priority: 5,
        layers: [
            { wave: 'sine', freq: 110, freqEnd: 40, glide: 'exp', env: { attack: 0.002, decay: 0.15, release: 0.05 }, drive: 1.5, gain: 1.0 },
            { type: 'noise', filter: { type: 'bandpass', freq: 800, freqEnd: 400, q: 0.7 }, env: { attack: 0.005, decay: 0.3, sustainLevel: 0.3, release: 0.05 }, drive: 2.0, gain: 0.9 },
            { type: 'noise', filter: { type: 'highpass', freq: 3000, q: 0.7 }, env: { attack: 0, decay: 0.03, release: 0.02 }, gain: 0.4 },
        ],
    },
    // 能量/等离子/闪电：合成电击"biu"
    gun_energy: {
        duration: 0.2, gain: 0.82, priority: 4,
        layers: [
            { wave: 'square', freq: 300, freqEnd: 120, glide: 'exp', filter: { type: 'lowpass', freq: 2000, q: 1.5 }, env: { attack: 0.001, decay: 0.1, release: 0.04 }, gain: 0.7 },
            { wave: 'saw', freq: 1200, freqEnd: 600, glide: 'exp', env: { attack: 0.001, decay: 0.06, release: 0.02 }, gain: 0.4 },
            { type: 'noise', filter: { type: 'bandpass', freq: 4000, q: 3.0 }, env: { attack: 0, decay: 0.04, release: 0.02 }, gain: 0.4 },
        ],
    },
    // 弓弩：弦振 twang + 破空 thwip
    gun_bow: {
        duration: 0.18, gain: 0.72, priority: 3,
        layers: [
            { wave: 'triangle', freq: 400, freqEnd: 200, glide: 'exp', env: { attack: 0.001, decay: 0.05, release: 0.03 }, gain: 0.6 },
            { type: 'noise', filter: { type: 'bandpass', freq: 2000, q: 1.5 }, env: { attack: 0, decay: 0.04, release: 0.02 }, gain: 0.5 },
            { wave: 'sine', freq: 150, env: { attack: 0.001, decay: 0.03, release: 0.01 }, gain: 0.3 },
        ],
    },

    // ───────────────────── 近战 ─────────────────────
    // 挥砍破空 whoosh（刀/匕首/巨剑/长矛/斧）
    melee_swing: {
        duration: 0.2, gain: 0.6, priority: 3,
        layers: [
            { type: 'noise', filter: { type: 'bandpass', freq: 800, freqEnd: 1600, q: 1.2, glide: 'lin' }, env: { attack: 0.03, decay: 0.12, release: 0.04 }, gain: 1.0 },
            { type: 'noise', filter: { type: 'highpass', freq: 3000, q: 0.7 }, env: { attack: 0.02, decay: 0.08, release: 0.03 }, gain: 0.4 },
        ],
    },

    // ───────────────────── 换弹 ─────────────────────
    reload_start: {
        duration: 0.12, gain: 0.55, priority: 4,
        layers: [
            { type: 'noise', filter: { type: 'bandpass', freq: 2000, q: 2.0 }, env: { attack: 0, decay: 0.02, release: 0.01 }, gain: 0.7 },
            { wave: 'square', freq: 300, env: { attack: 0.001, decay: 0.03, release: 0.01 }, gain: 0.3 },
        ],
    },
    reload_done: {
        duration: 0.16, gain: 0.6, priority: 4,
        layers: [
            { type: 'noise', filter: { type: 'bandpass', freq: 1500, q: 2.0 }, env: { attack: 0, decay: 0.02, release: 0.01 }, gain: 0.6 },
            { type: 'noise', filter: { type: 'bandpass', freq: 1000, q: 2.0 }, env: { attack: 0, decay: 0.03, release: 0.01 }, delay: 0.08, gain: 0.7 },
            { wave: 'sine', freq: 120, env: { attack: 0.001, decay: 0.04, release: 0.01 }, delay: 0.08, gain: 0.4 },
        ],
    },

    // ───────────────────── 命中 ─────────────────────
    hit_flesh: {
        duration: 0.1, gain: 0.55, priority: 2,
        layers: [
            { wave: 'sine', freq: 160, freqEnd: 80, glide: 'exp', env: { attack: 0.001, decay: 0.05, release: 0.02 }, gain: 0.7 },
            { type: 'noise', filter: { type: 'lowpass', freq: 700, q: 0.8 }, env: { attack: 0.001, decay: 0.05, release: 0.02 }, drive: 1.5, gain: 0.7 },
            { type: 'noise', filter: { type: 'bandpass', freq: 1400, q: 1.0 }, env: { attack: 0, decay: 0.02, release: 0.01 }, gain: 0.3 },
        ],
    },
    hit_crit: {
        duration: 0.13, gain: 0.7, priority: 3,
        layers: [
            { wave: 'sine', freq: 220, freqEnd: 90, glide: 'exp', env: { attack: 0.001, decay: 0.05, release: 0.02 }, gain: 0.6 },
            { type: 'noise', filter: { type: 'bandpass', freq: 2500, q: 1.5 }, env: { attack: 0, decay: 0.04, release: 0.02 }, drive: 1.8, gain: 0.8 },
            { wave: 'triangle', freq: 900, freqEnd: 500, glide: 'exp', env: { attack: 0.001, decay: 0.03, release: 0.01 }, gain: 0.4 },
            { type: 'noise', filter: { type: 'highpass', freq: 6000, q: 0.7 }, env: { attack: 0, decay: 0.015, release: 0.005 }, gain: 0.4 },
        ],
    },

    // ───────────────────── 敌人死亡（三类）─────────────────────
    enemy_die_flesh: {
        duration: 0.4, gain: 0.72, priority: 3,
        layers: [
            { wave: 'sine', freq: 140, freqEnd: 45, glide: 'exp', env: { attack: 0.002, decay: 0.2, release: 0.06 }, gain: 0.8 },
            { type: 'noise', filter: { type: 'lowpass', freq: 600, freqEnd: 250, q: 0.8 }, env: { attack: 0.01, decay: 0.3, release: 0.06 }, drive: 1.8, gain: 0.9 },
            { type: 'noise', filter: { type: 'bandpass', freq: 1000, q: 0.7 }, env: { attack: 0, decay: 0.08, release: 0.03 }, gain: 0.4 },
        ],
    },
    enemy_die_mech: {
        duration: 0.45, gain: 0.76, priority: 3,
        layers: [
            { wave: 'square', freq: 200, freqEnd: 70, glide: 'exp', filter: { type: 'lowpass', freq: 1500, q: 1.0 }, env: { attack: 0.002, decay: 0.12, release: 0.05 }, gain: 0.6 },
            { type: 'noise', filter: { type: 'bandpass', freq: 3000, q: 1.2 }, env: { attack: 0.005, decay: 0.35, release: 0.05 }, drive: 2.0, gain: 0.85 },
            { wave: 'saw', freq: 500, freqEnd: 120, glide: 'exp', env: { attack: 0.005, decay: 0.2, release: 0.05 }, gain: 0.4 },
            { type: 'noise', filter: { type: 'highpass', freq: 5000, q: 0.7 }, env: { attack: 0, decay: 0.05, release: 0.02 }, delay: 0.1, gain: 0.4 },
        ],
    },
    enemy_die_ghost: {
        duration: 0.5, gain: 0.62, priority: 3,
        layers: [
            { wave: 'sine', freq: 600, freqEnd: 180, glide: 'exp', env: { attack: 0.01, decay: 0.4, release: 0.08 }, gain: 0.6 },
            { wave: 'triangle', freq: 900, freqEnd: 300, glide: 'exp', env: { attack: 0.02, decay: 0.3, release: 0.08 }, gain: 0.4 },
            { type: 'noise', filter: { type: 'bandpass', freq: 2500, freqEnd: 800, q: 2.0 }, env: { attack: 0.05, decay: 0.4, release: 0.05 }, gain: 0.5 },
        ],
    },

    // ───────────────────── 爆炸（≥5 层，含 <100Hz 低频体）─────────────────────
    explosion: {
        duration: 0.7, gain: 0.98, priority: 6,
        layers: [
            { wave: 'sine', freq: 90, freqEnd: 30, glide: 'exp', env: { attack: 0.002, decay: 0.35, release: 0.1 }, drive: 2.0, gain: 1.0 },
            { type: 'noise', filter: { type: 'lowpass', freq: 500, freqEnd: 120, q: 0.9 }, env: { attack: 0.002, decay: 0.5, release: 0.1 }, drive: 2.5, gain: 1.0 },
            { type: 'noise', filter: { type: 'bandpass', freq: 2000, q: 0.6 }, env: { attack: 0.001, decay: 0.15, release: 0.05 }, drive: 2.0, gain: 0.7 },
            { type: 'noise', filter: { type: 'highpass', freq: 4000, q: 0.7 }, env: { attack: 0, decay: 0.04, release: 0.02 }, gain: 0.5 },
            { type: 'noise', filter: { type: 'lowpass', freq: 300, q: 0.7 }, env: { attack: 0.005, decay: 0.4, release: 0.08 }, delay: 0.1, gain: 0.4 },
        ],
    },

    // ───────────────────── 玩家 ─────────────────────
    player_hurt: {
        duration: 0.25, gain: 0.75, priority: 6,
        layers: [
            { wave: 'sine', freq: 300, freqEnd: 150, glide: 'exp', env: { attack: 0.002, decay: 0.12, release: 0.05 }, gain: 0.6 },
            { type: 'noise', filter: { type: 'lowpass', freq: 900, q: 1.0 }, env: { attack: 0.001, decay: 0.08, release: 0.03 }, drive: 1.5, gain: 0.6 },
            { wave: 'triangle', freq: 400, freqEnd: 200, glide: 'exp', env: { attack: 0.002, decay: 0.1, release: 0.04 }, gain: 0.4 },
        ],
    },
    player_roll: {
        duration: 0.22, gain: 0.42, priority: 2,
        layers: [
            { type: 'noise', filter: { type: 'bandpass', freq: 700, freqEnd: 1500, q: 1.0, glide: 'lin' }, env: { attack: 0.03, decay: 0.15, release: 0.04 }, gain: 1.0 },
            { type: 'noise', filter: { type: 'highpass', freq: 2500, q: 0.7 }, env: { attack: 0.02, decay: 0.1, release: 0.03 }, gain: 0.4 },
        ],
    },

    // ───────────────────── 拾取 ─────────────────────
    // 金币：明亮叮（连拾时 SoundSystem 用 playbackRate 阶梯升调）
    pickup_coin: {
        duration: 0.18, gain: 0.5, priority: 2,
        layers: [
            { wave: 'sine', freq: 1200, env: { attack: 0.001, decay: 0.05, release: 0.06 }, gain: 0.7 },
            { wave: 'sine', freq: 1800, env: { attack: 0.001, decay: 0.04, release: 0.06 }, delay: 0.02, gain: 0.4 },
            { wave: 'triangle', freq: 2400, env: { attack: 0.001, decay: 0.03, release: 0.02 }, gain: 0.2 },
        ],
    },
    pickup_key: {
        duration: 0.22, gain: 0.55, priority: 3,
        layers: [
            { wave: 'square', freq: 900, env: { attack: 0.001, decay: 0.03, release: 0.01 }, gain: 0.4 },
            { wave: 'sine', freq: 1400, freqEnd: 1500, glide: 'lin', env: { attack: 0.001, decay: 0.06, release: 0.03 }, delay: 0.04, gain: 0.5 },
            { type: 'noise', filter: { type: 'bandpass', freq: 3000, q: 2.0 }, env: { attack: 0, decay: 0.02, release: 0.01 }, gain: 0.3 },
            { wave: 'sine', freq: 2000, env: { attack: 0.001, decay: 0.05, release: 0.02 }, delay: 0.1, gain: 0.3 },
        ],
    },
    // 遗物：神圣大三和弦（C-E-G-C）琶入
    pickup_relic: {
        duration: 0.6, gain: 0.6, priority: 4,
        layers: [
            { wave: 'sine', freq: 523, env: { attack: 0.02, decay: 0.5, sustainLevel: 0.5, release: 0.08 }, gain: 0.5 },
            { wave: 'sine', freq: 659, env: { attack: 0.02, decay: 0.5, sustainLevel: 0.5, release: 0.08 }, delay: 0.03, gain: 0.45 },
            { wave: 'sine', freq: 784, env: { attack: 0.02, decay: 0.5, sustainLevel: 0.5, release: 0.08 }, delay: 0.06, gain: 0.4 },
            { wave: 'triangle', freq: 1046, env: { attack: 0.05, decay: 0.4, release: 0.05 }, delay: 0.1, gain: 0.25 },
        ],
    },
    pickup_weapon: {
        duration: 0.25, gain: 0.55, priority: 3,
        layers: [
            { type: 'noise', filter: { type: 'bandpass', freq: 1600, q: 2.0 }, env: { attack: 0, decay: 0.02, release: 0.01 }, gain: 0.5 },
            { wave: 'square', freq: 400, freqEnd: 600, glide: 'lin', env: { attack: 0.002, decay: 0.05, release: 0.02 }, gain: 0.4 },
            { wave: 'sine', freq: 800, env: { attack: 0.002, decay: 0.08, release: 0.03 }, delay: 0.06, gain: 0.4 },
        ],
    },

    // ───────────────────── 世界物件 ─────────────────────
    chest_open: {
        duration: 0.5, gain: 0.6, priority: 4,
        layers: [
            { type: 'noise', filter: { type: 'bandpass', freq: 400, q: 1.5 }, env: { attack: 0.05, decay: 0.2, release: 0.05 }, drive: 2.0, gain: 0.6 },
            { wave: 'saw', freq: 200, freqEnd: 120, glide: 'lin', env: { attack: 0.02, decay: 0.15, release: 0.04 }, gain: 0.3 },
            { wave: 'sine', freq: 1400, env: { attack: 0.005, decay: 0.1, release: 0.04 }, delay: 0.15, gain: 0.4 },
            { wave: 'sine', freq: 1900, env: { attack: 0.005, decay: 0.1, release: 0.04 }, delay: 0.25, gain: 0.35 },
        ],
    },
    door_slam: {
        duration: 0.4, gain: 0.85, priority: 5,
        layers: [
            { wave: 'sine', freq: 100, freqEnd: 40, glide: 'exp', env: { attack: 0.001, decay: 0.2, release: 0.06 }, drive: 2.0, gain: 1.0 },
            { type: 'noise', filter: { type: 'lowpass', freq: 400, q: 1.0 }, env: { attack: 0.001, decay: 0.25, release: 0.06 }, drive: 2.0, gain: 0.8 },
            { type: 'noise', filter: { type: 'bandpass', freq: 1200, q: 1.0 }, env: { attack: 0, decay: 0.04, release: 0.02 }, gain: 0.5 },
        ],
    },
    door_open: {
        duration: 0.55, gain: 0.6, priority: 4,
        layers: [
            { type: 'noise', filter: { type: 'bandpass', freq: 300, freqEnd: 500, q: 1.5, glide: 'lin' }, env: { attack: 0.05, decay: 0.4, release: 0.05 }, drive: 2.0, gain: 0.8 },
            { wave: 'saw', freq: 120, freqEnd: 80, glide: 'lin', env: { attack: 0.02, decay: 0.35, release: 0.05 }, gain: 0.4 },
            { wave: 'sine', freq: 70, env: { attack: 0.01, decay: 0.2, release: 0.05 }, gain: 0.4 },
        ],
    },

    // ───────────────────── UI / 老虎机 ─────────────────────
    ui_click: {
        duration: 0.06, gain: 0.4, priority: 5,
        layers: [
            { wave: 'square', freq: 800, freqEnd: 1000, glide: 'lin', env: { attack: 0.001, decay: 0.02, release: 0.01 }, gain: 0.6 },
            { wave: 'sine', freq: 1600, env: { attack: 0.001, decay: 0.015, release: 0.005 }, gain: 0.3 },
        ],
    },
    slot_spin: {
        duration: 0.12, gain: 0.5, priority: 3,
        layers: [
            { wave: 'sine', freq: 1500, freqEnd: 1200, glide: 'lin', env: { attack: 0.001, decay: 0.04, release: 0.02 }, gain: 0.5 },
            { type: 'noise', filter: { type: 'bandpass', freq: 3500, q: 2.0 }, env: { attack: 0, decay: 0.02, release: 0.01 }, gain: 0.4 },
            { wave: 'square', freq: 400, env: { attack: 0.001, decay: 0.02, release: 0.01 }, gain: 0.3 },
        ],
    },
    // 中奖：上行琶音（C-E-G-C）
    slot_win: {
        duration: 0.6, gain: 0.7, priority: 4,
        layers: [
            { wave: 'square', freq: 523, env: { attack: 0.005, decay: 0.08, release: 0.02 }, gain: 0.5 },
            { wave: 'square', freq: 659, env: { attack: 0.005, decay: 0.08, release: 0.02 }, delay: 0.1, gain: 0.5 },
            { wave: 'square', freq: 784, env: { attack: 0.005, decay: 0.08, release: 0.02 }, delay: 0.2, gain: 0.5 },
            { wave: 'square', freq: 1046, env: { attack: 0.005, decay: 0.15, release: 0.04 }, delay: 0.3, gain: 0.5 },
            { wave: 'sine', freq: 1046, env: { attack: 0.01, decay: 0.25, release: 0.05 }, delay: 0.3, gain: 0.4 },
        ],
    },

    // ───────────────────── 机关 / 传送门 ─────────────────────
    spike_out: {
        duration: 0.15, gain: 0.6, priority: 3,
        layers: [
            { type: 'noise', filter: { type: 'bandpass', freq: 2500, freqEnd: 1500, q: 2.0, glide: 'lin' }, env: { attack: 0.001, decay: 0.05, release: 0.02 }, gain: 0.7 },
            { wave: 'saw', freq: 800, freqEnd: 400, glide: 'exp', env: { attack: 0.001, decay: 0.04, release: 0.02 }, gain: 0.4 },
            { wave: 'sine', freq: 200, env: { attack: 0.001, decay: 0.03, release: 0.01 }, gain: 0.4 },
        ],
    },
    // 传送门嗡鸣：整数 Hz + 恒定包络 → 1s 缓冲无缝循环（SoundSystem 按距离渐入音量）
    portal_hum: {
        duration: 1.0, gain: 0.5, priority: 1, loop: true,
        layers: [
            { wave: 'sine', freq: 80, env: { attack: 0, sustainLevel: 1, release: 0 }, gain: 0.6 },
            { wave: 'sine', freq: 121, env: { attack: 0, sustainLevel: 1, release: 0 }, gain: 0.35 },
            { wave: 'triangle', freq: 240, env: { attack: 0, sustainLevel: 1, release: 0 }, gain: 0.2 },
            { wave: 'sine', freq: 60, env: { attack: 0, sustainLevel: 1, release: 0 }, gain: 0.3 },
        ],
    },
};

/** 敌人 spawnType → 死亡音效类别（粗分肉/机械/幽体三类，默认肉）。 */
export const ENEMY_DEATH_SFX = {
    // 机械 / 石构 / 构装体
    mecha_golem: 'enemy_die_mech',
    sentry: 'enemy_die_mech',
    spinner: 'enemy_die_mech',
    arc_twin: 'enemy_die_mech',
    flail_warden: 'enemy_die_mech',
    gargoyle: 'enemy_die_mech',
    turret: 'enemy_die_mech',
    // 幽体 / 亡魂
    wraith: 'enemy_die_ghost',
    revenant: 'enemy_die_ghost',
    weeper: 'enemy_die_ghost',
    // 其余皆走血肉（zombie/hunter/soldier/warlock/boomer/summoner/shieldbearer/lobber/
    // archer/hellhound/plague_rat/cultist/splitter/loot_goblin/burrower/mutant_beast…）
};

/** 全部音效 id 列表（供预热 / 单测遍历）。 */
export const SFX_IDS = Object.keys(SfxData);
