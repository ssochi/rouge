// WeaponSfxMap.js
// 武器 id → 音色族 + 个性偏移（纯数据，禁逻辑）。
//
// family: SfxData 中的枪械音色族 id（gun_pistol / gun_shotgun / ... / melee_swing）
// pitch:  播放时叠加到 playbackRate 的基准音高（1.0=原样；>1 更亮/尖，<1 更闷/重）——不改缓存
// decay:  尾音时长比例（1.0=完整；<1 更短促）——SoundSystem 播放时对 voice 增益做提前淡出
//
// 覆盖 WeaponData.WEAPONS 全部含 damage(>0) 或 isMelee 的 36 把武器（单测断言全覆盖）。
// 零伤害工具类（hammer/medkit/hamburger/recovery_needle/turret_deployer）不经开火路径，
// 一并给出兜底映射以保证 resolveWeaponSfx 永不落空。

export const WEAPON_SFX = {
    // —— 手枪族 ——
    default_pistol: { family: 'gun_pistol', pitch: 1.0, decay: 1.0 },
    ricochet_gun: { family: 'gun_pistol', pitch: 1.12, decay: 0.9 },
    vampyre_gun: { family: 'gun_pistol', pitch: 0.9, decay: 1.1 },
    phantom_pistol: { family: 'gun_pistol', pitch: 1.2, decay: 0.85 },
    teleport_gun: { family: 'gun_pistol', pitch: 1.05, decay: 1.15 },
    boomerang: { family: 'gun_pistol', pitch: 0.85, decay: 1.2 },

    // —— 步枪族 ——
    default_rifle: { family: 'gun_rifle', pitch: 1.0, decay: 1.0 },
    needle_gun: { family: 'gun_rifle', pitch: 1.25, decay: 0.8 },

    // —— 冲锋枪族 ——
    smg: { family: 'gun_smg', pitch: 1.0, decay: 1.0 },

    // —— 霰弹族 ——
    shotgun: { family: 'gun_shotgun', pitch: 1.0, decay: 1.0 },
    gale_shotgun: { family: 'gun_shotgun', pitch: 1.15, decay: 0.9 },
    force_gun: { family: 'gun_shotgun', pitch: 0.9, decay: 1.1 },

    // —— 狙击族 ——
    sniper: { family: 'gun_sniper', pitch: 1.0, decay: 1.0 },
    railgun: { family: 'gun_sniper', pitch: 1.1, decay: 1.15 },

    // —— 激光族 ——
    laser_gun: { family: 'gun_laser', pitch: 1.0, decay: 1.0 },
    laser_rifle: { family: 'gun_laser', pitch: 1.3, decay: 0.7 },
    laser_shotgun: { family: 'gun_laser', pitch: 0.85, decay: 1.15 },
    freeze_ray: { family: 'gun_laser', pitch: 1.45, decay: 1.1 }, // 冰霜：更亮更"晶"

    // —— 火焰 / 喷射族 ——
    flamethrower: { family: 'gun_flame', pitch: 1.0, decay: 1.0 },
    venom_sprayer: { family: 'gun_flame', pitch: 1.2, decay: 0.9 },
    acid_gun: { family: 'gun_flame', pitch: 1.1, decay: 0.95 },

    // —— 火箭 / 榴弹族 ——
    rocket_launcher: { family: 'gun_rocket', pitch: 1.0, decay: 1.0 },
    grenade_launcher: { family: 'gun_rocket', pitch: 1.1, decay: 0.9 },
    homing_launcher: { family: 'gun_rocket', pitch: 1.05, decay: 1.05 },
    meteor_cannon: { family: 'gun_rocket', pitch: 0.85, decay: 1.2 },
    cluster_gun: { family: 'gun_rocket', pitch: 1.2, decay: 0.85 },

    // —— 能量族 ——
    plasma_rifle: { family: 'gun_energy', pitch: 1.0, decay: 1.0 },
    lightning_gun: { family: 'gun_energy', pitch: 1.15, decay: 0.9 },
    black_hole_gun: { family: 'gun_energy', pitch: 0.8, decay: 1.25 },
    storm_revolver: { family: 'gun_energy', pitch: 1.25, decay: 0.85 },

    // —— 弓弩族 ——
    crossbow: { family: 'gun_bow', pitch: 1.0, decay: 1.0 },

    // —— 近战族（挥砍破空，MeleeSystem 触发）——
    katana: { family: 'melee_swing', pitch: 1.1, decay: 1.0 },
    dagger: { family: 'melee_swing', pitch: 1.35, decay: 0.75 },
    greatsword: { family: 'melee_swing', pitch: 0.8, decay: 1.25 },
    spear: { family: 'melee_swing', pitch: 1.0, decay: 1.1 },
    battle_axe: { family: 'melee_swing', pitch: 0.85, decay: 1.2 },

    // —— 零伤害工具类兜底（不发子弹，一般不触发开火音）——
    hammer: { family: 'melee_swing', pitch: 0.9, decay: 1.1 },
    medkit: { family: 'ui_click', pitch: 1.0, decay: 1.0 },
    hamburger: { family: 'ui_click', pitch: 0.9, decay: 1.0 },
    recovery_needle: { family: 'ui_click', pitch: 1.2, decay: 1.0 },
    turret_deployer: { family: 'gun_energy', pitch: 0.9, decay: 1.0 },
};

const DEFAULT_WEAPON_SFX = { family: 'gun_pistol', pitch: 1.0, decay: 1.0 };

/** 解析武器音色（永不落空；未知 id 回退手枪）。 */
export function resolveWeaponSfx(weaponId) {
    return WEAPON_SFX[weaponId] || DEFAULT_WEAPON_SFX;
}
