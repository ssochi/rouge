// MobileControls.js
// 移动端触摸操作层（仅在移动模式实例化，桌面零开销）。
//
// 结构（二期）：
//  - 左虚拟摇杆（屏幕左下区域任意落指浮现）→ input.moveVector 归一化移动向量
//  - 射击大按钮（右下拇指主位，按住持续开火）+ 自动辅助瞄准（每帧瞄向最近存活敌人）
//      → 合成 input.mouse.worldX/worldY = 目标敌人坐标；input.mouse.down = 按钮按住状态
//      无目标时回退为移动方向 / 上次朝向
//  - 动作按钮：翻滚（紧邻射击）+ 交互/换弹/背包（小号，小地图下方一排）→ 映射 input.keys
//  - 移动端 HUD 缩小（快捷栏 + 左上角色面板），金币/钥匙 HUD 移至左上（让出右侧给按钮）
//  - 竖屏遮罩（强制横屏，CSS media query + JS 双保险）
//  - 触屏→鼠标事件桥（背包/衣装等 DOM UI 的 onmousedown/onmousemove 交互在触屏可用）
//
// 所有样式在构造时注入 <style>，DOM 全部动态创建；不修改桌面路径。

const STICK_MAX = 52;        // 左摇杆最大位移半径（px）
const MOVE_DEADZONE = 0.16;  // 左摇杆移动死区（占最大半径比例）
const AIM_FALLBACK_RANGE = 450; // 无相机信息时的自动瞄准半径（世界像素）

export class MobileControls {
    constructor({ input, player, camera, canvas }) {
        this.input = input;
        this.player = player;
        this.camera = camera;
        this.canvas = canvas;

        // 左摇杆状态（identifier 追踪多点触控）
        this.leftTouchId = null;
        this.leftOrigin = { x: 0, y: 0 };
        this.leftVec = { x: 0, y: 0 };

        // 瞄准/射击
        this.aimAngle = 0;       // 最近一次瞄准角度（无目标时保持朝向）
        this.shootHeld = false;  // 射击按钮按住状态

        // 触屏→鼠标桥追踪的手指
        this.bridgeTouchId = null;

        this._injectStyles();
        this._buildDOM();
        this._bindLeftStick();
        this._bindShoot();
        this._bindButtons();
        this._installTouchMouseBridge();
        this._bindOrientation();
    }

    // ---------- 样式注入 ----------
    _injectStyles() {
        if (document.getElementById('mobile-controls-style')) return;
        const style = document.createElement('style');
        style.id = 'mobile-controls-style';
        style.textContent = `
        html, body { touch-action: none; overscroll-behavior: none; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }

        /* ---- 移动端 HUD 缩小 ---- */
        /* 底部快捷栏缩小并保持底部居中（保留原 translateX(-50%) 居中语义） */
        .hotbar-panel { transform: translateX(-50%) scale(0.7) !important; transform-origin: bottom center; z-index: 20 !important; }
        /* 左上角色面板缩小（血量/耐力） */
        .status-panel { transform: scale(0.7); transform-origin: top left; }
        /* 金币/钥匙 HUD 移到左上角（让出右侧给动作按钮），行改为左对齐 */
        #dungeon-hud { top: 92px !important; left: 10px !important; right: auto !important; }
        #dungeon-hud > div { justify-content: flex-start !important; max-width: 150px; }

        #mobile-controls {
            position: fixed; inset: 0; z-index: 10;
            pointer-events: none;
            font-family: 'Courier New', monospace;
        }

        /* 左移动摇杆热区（屏幕左下） */
        .mc-zone {
            position: fixed; bottom: 0; left: 0; height: 56vh; width: 46vw;
            pointer-events: auto;
        }
        .mc-stick-base {
            position: fixed; width: ${STICK_MAX * 2}px; height: ${STICK_MAX * 2}px;
            margin-left: -${STICK_MAX}px; margin-top: -${STICK_MAX}px;
            border-radius: 50%;
            border: 3px solid rgba(236, 240, 241, 0.55);
            background: rgba(30, 40, 50, 0.30);
            box-shadow: inset 0 0 12px rgba(0,0,0,0.45), 0 0 0 2px rgba(0,0,0,0.35);
            display: none; pointer-events: none;
        }
        .mc-stick-knob {
            position: absolute; left: 50%; top: 50%;
            width: ${STICK_MAX}px; height: ${STICK_MAX}px;
            margin-left: -${STICK_MAX / 2}px; margin-top: -${STICK_MAX / 2}px;
            border-radius: 50%;
            border: 3px solid rgba(236, 240, 241, 0.85);
            background: rgba(127, 160, 180, 0.55);
            box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        }

        /* ---- 圆形按钮基类 ---- */
        .mc-btn {
            position: relative; pointer-events: auto;
            width: 58px; height: 58px; border-radius: 50%;
            border: 3px solid rgba(236, 240, 241, 0.65);
            background: rgba(30, 40, 50, 0.55);
            color: #ecf0f1;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            box-shadow: inset 2px 2px 0 rgba(255,255,255,0.12), 0 3px 0 rgba(0,0,0,0.5);
            transition: transform 0.05s, background 0.05s;
        }
        .mc-btn .mc-btn-glyph { font-size: 20px; line-height: 1; }
        .mc-btn .mc-btn-label { font-size: 9px; margin-top: 2px; opacity: 0.85; letter-spacing: 0.5px; }
        .mc-btn.pressed { transform: translateY(2px); background: rgba(241, 196, 15, 0.55); }

        /* 射击大按钮（右下拇指主位） */
        .mc-shoot {
            position: fixed; right: 20px; bottom: 20px;
            width: 92px; height: 92px; border-radius: 50%;
            border: 4px solid rgba(231, 76, 60, 0.9);
            background: rgba(231, 76, 60, 0.34);
            color: #fff; pointer-events: auto;
            display: flex; align-items: center; justify-content: center;
            box-shadow: inset 2px 2px 0 rgba(255,255,255,0.18), 0 3px 0 rgba(0,0,0,0.5);
            transition: transform 0.05s, background 0.05s;
        }
        .mc-shoot .mc-shoot-glyph { font-size: 34px; line-height: 1; }
        .mc-shoot.pressed { transform: scale(0.93); background: rgba(231, 76, 60, 0.62); }

        /* 翻滚按钮：紧邻射击按钮左侧（战斗高频） */
        .mc-btn-roll { position: fixed; right: 122px; bottom: 40px; width: 66px; height: 66px; }
        .mc-btn-roll .mc-btn-glyph { font-size: 22px; }

        /* 次级小按钮（交互/换弹/背包）：小地图下方一排 */
        .mc-secondary { position: fixed; top: 190px; right: 14px; display: flex; gap: 10px; pointer-events: none; }
        .mc-btn-sm { width: 48px; height: 48px; }
        .mc-btn-sm .mc-btn-glyph { font-size: 16px; }
        .mc-btn-sm .mc-btn-label { font-size: 8px; margin-top: 1px; }

        /* 弹药角标：挂在「换弹」按钮右上角；桌面版右下角武器面板在移动端隐藏 */
        .weapon-panel { display: none !important; }
        .mc-btn-ammo {
            position: absolute; top: -6px; right: -10px;
            min-width: 30px; padding: 1px 4px;
            font-size: 10px; text-align: center;
            color: #f1c40f; background: rgba(10, 13, 18, 0.85);
            border: 2px solid rgba(241, 196, 15, 0.6); border-radius: 9px;
            text-shadow: 1px 1px 0 rgba(0,0,0,0.8);
            pointer-events: none;
        }

        .mc-orientation-mask {
            position: fixed; inset: 0; z-index: 9999;
            background: #0a0d12; color: #cdd6e0;
            display: none;
            flex-direction: column; align-items: center; justify-content: center;
            font-family: 'Courier New', monospace; text-align: center;
            pointer-events: auto;
        }
        @media (orientation: portrait) { .mc-orientation-mask { display: flex; } }
        .mc-orientation-mask .mc-phone {
            font-size: 68px; margin-bottom: 18px;
            animation: mc-rotate-hint 1.6s ease-in-out infinite;
        }
        .mc-orientation-mask .mc-tip { font-size: 18px; letter-spacing: 1px; }
        .mc-orientation-mask .mc-sub { font-size: 12px; opacity: 0.6; margin-top: 8px; }
        @keyframes mc-rotate-hint {
            0%, 40% { transform: rotate(0deg); }
            60%, 100% { transform: rotate(-90deg); }
        }
        `;
        document.head.appendChild(style);
    }

    // ---------- DOM 构建 ----------
    _buildDOM() {
        this.root = document.createElement('div');
        this.root.id = 'mobile-controls';

        // 左移动摇杆
        this.leftZone = document.createElement('div');
        this.leftZone.className = 'mc-zone mc-zone-left';
        this.leftBase = this._makeStick();
        this.root.appendChild(this.leftZone);
        this.root.appendChild(this.leftBase);

        // 射击大按钮
        this.shootBtn = document.createElement('div');
        this.shootBtn.className = 'mc-shoot';
        this.shootBtn.innerHTML = `<span class="mc-shoot-glyph">🔫</span>`;
        this.root.appendChild(this.shootBtn);

        // 翻滚按钮（紧邻射击）
        this.buttons = [];
        const rollBtn = this._makeButton('space', '🌀', '翻滚', 'mc-btn-roll');
        this.root.appendChild(rollBtn);

        // 次级小按钮：交互 / 换弹 / 背包
        this.secondary = document.createElement('div');
        this.secondary.className = 'mc-secondary';
        const SMALL = [
            { key: 'e', glyph: '✋', label: '交互' },
            { key: 'r', glyph: '🔄', label: '换弹' },
            { key: 'b', glyph: '🎒', label: '背包' },
        ];
        for (const def of SMALL) {
            const btn = this._makeButton(def.key, def.glyph, def.label, 'mc-btn-sm');
            if (def.key === 'r') {
                this.ammoBadge = document.createElement('span');
                this.ammoBadge.className = 'mc-btn-ammo';
                this.ammoBadge.textContent = '∞';
                btn.appendChild(this.ammoBadge);
            }
            this.secondary.appendChild(btn);
        }
        this.root.appendChild(this.secondary);

        document.body.appendChild(this.root);

        // 竖屏遮罩：直接挂 body（避免被 #mobile-controls 的 z-index:10 堆叠上下文困住）
        this.orientMask = document.createElement('div');
        this.orientMask.className = 'mc-orientation-mask';
        this.orientMask.innerHTML = `
            <div class="mc-phone">📱</div>
            <div class="mc-tip">请横屏游玩</div>
            <div class="mc-sub">Rotate your device</div>
        `;
        document.body.appendChild(this.orientMask);
    }

    _makeStick() {
        const base = document.createElement('div');
        base.className = 'mc-stick-base';
        const knob = document.createElement('div');
        knob.className = 'mc-stick-knob';
        base.appendChild(knob);
        base._knob = knob;
        return base;
    }

    _makeButton(key, glyph, label, extraClass) {
        const btn = document.createElement('div');
        btn.className = `mc-btn ${extraClass || ''}`.trim();
        btn.dataset.key = key;
        btn.innerHTML = `<span class="mc-btn-glyph">${glyph}</span><span class="mc-btn-label">${label}</span>`;
        this.buttons.push(btn);
        return btn;
    }

    // ---------- 左摇杆事件 ----------
    _bindLeftStick() {
        this.leftZone.addEventListener('touchstart', (e) => this._onStickStart(e), { passive: false });
        // touchmove/end 绑定在 window：手指移出落指区仍持续追踪
        window.addEventListener('touchmove', (e) => this._onStickMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this._onStickEnd(e), { passive: false });
        window.addEventListener('touchcancel', (e) => this._onStickEnd(e), { passive: false });
    }

    _onStickStart(e) {
        if (this.leftTouchId !== null) return; // 已有手指
        const t = e.changedTouches[0];
        this.leftTouchId = t.identifier;
        this.leftOrigin.x = t.clientX;
        this.leftOrigin.y = t.clientY;
        this.leftBase.style.left = `${t.clientX}px`;
        this.leftBase.style.top = `${t.clientY}px`;
        this.leftBase.style.display = 'block';
        this._updateStick(t.clientX, t.clientY);
        e.preventDefault();
        e.stopPropagation();
    }

    _onStickMove(e) {
        let handled = false;
        for (const t of e.changedTouches) {
            if (t.identifier === this.leftTouchId) {
                this._updateStick(t.clientX, t.clientY);
                handled = true;
            }
        }
        if (handled) e.preventDefault();
    }

    _onStickEnd(e) {
        for (const t of e.changedTouches) {
            if (t.identifier === this.leftTouchId) {
                this.leftTouchId = null;
                this.leftVec.x = 0; this.leftVec.y = 0;
                if (this.leftBase._knob) this.leftBase._knob.style.transform = 'translate(0,0)';
                this.leftBase.style.display = 'none';
            }
        }
    }

    _updateStick(cx, cy) {
        const dx = cx - this.leftOrigin.x;
        const dy = cy - this.leftOrigin.y;
        const dist = Math.hypot(dx, dy);
        const clamped = Math.min(dist, STICK_MAX);
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;
        const mag = clamped / STICK_MAX;

        this.leftBase._knob.style.transform = `translate(${nx * clamped}px, ${ny * clamped}px)`;

        if (mag < MOVE_DEADZONE) {
            this.leftVec.x = 0; this.leftVec.y = 0;
        } else {
            this.leftVec.x = nx;
            this.leftVec.y = ny;
        }
    }

    // ---------- 射击按钮 ----------
    _bindShoot() {
        const press = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.shootHeld = true;
            this.shootBtn.classList.add('pressed');
        };
        const release = (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.shootHeld = false;
            this.shootBtn.classList.remove('pressed');
        };
        this.shootBtn.addEventListener('touchstart', press, { passive: false });
        this.shootBtn.addEventListener('touchend', release, { passive: false });
        this.shootBtn.addEventListener('touchcancel', release, { passive: false });
    }

    // ---------- 动作按钮（翻滚/交互/换弹/背包 → input.keys） ----------
    _bindButtons() {
        for (const btn of this.buttons) {
            const key = btn.dataset.key;
            const press = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.input.keys[key] = true;
                btn.classList.add('pressed');
            };
            const release = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.input.keys[key] = false;
                btn.classList.remove('pressed');
            };
            btn.addEventListener('touchstart', press, { passive: false });
            btn.addEventListener('touchend', release, { passive: false });
            btn.addEventListener('touchcancel', release, { passive: false });
        }
    }

    // ---------- 触屏→鼠标事件桥 ----------
    _installTouchMouseBridge() {
        const isBridgeTarget = (el) => {
            if (!el) return false;
            if (el === this.canvas || el.tagName === 'CANVAS') return false;
            if (this.root.contains(el)) return false;
            return true;
        };
        const dispatch = (type, touch) => {
            const el = document.elementFromPoint(touch.clientX, touch.clientY) || document;
            const ev = new MouseEvent(type, {
                bubbles: true, cancelable: true, view: window,
                clientX: touch.clientX, clientY: touch.clientY,
                button: 0, buttons: type === 'mouseup' ? 0 : 1
            });
            el.dispatchEvent(ev);
        };

        document.addEventListener('touchstart', (e) => {
            const t = e.changedTouches[0];
            const el = document.elementFromPoint(t.clientX, t.clientY);
            if (!isBridgeTarget(el)) return;
            this.bridgeTouchId = t.identifier;
            dispatch('mousedown', t);
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (this.bridgeTouchId === null) return;
            for (const t of e.changedTouches) {
                if (t.identifier === this.bridgeTouchId) {
                    dispatch('mousemove', t);
                    e.preventDefault();
                }
            }
        }, { passive: false });

        const end = (e) => {
            if (this.bridgeTouchId === null) return;
            for (const t of e.changedTouches) {
                if (t.identifier === this.bridgeTouchId) {
                    dispatch('mouseup', t);
                    this.bridgeTouchId = null;
                }
            }
        };
        document.addEventListener('touchend', end, { passive: false });
        document.addEventListener('touchcancel', end, { passive: false });
    }

    // ---------- 横屏检测（JS 双保险） ----------
    _bindOrientation() {
        this._checkOrientation();
        window.addEventListener('resize', () => this._checkOrientation());
        window.addEventListener('orientationchange', () => this._checkOrientation());
    }

    _checkOrientation() {
        const portrait = window.innerHeight > window.innerWidth;
        this.orientMask.style.display = portrait ? 'flex' : 'none';
    }

    // ---------- 自动瞄准：最近存活敌人 ----------
    _aimRange() {
        const c = this.camera;
        if (c && c.width && c.height) return Math.hypot(c.width / 2, c.height / 2) + 48;
        return AIM_FALLBACK_RANGE;
    }

    _findNearestEnemy(px, py, enemies) {
        if (!enemies || enemies.length === 0) return null;
        const range = this._aimRange();
        let best = null;
        let bestSq = range * range;
        for (const e of enemies) {
            if (!e || e.isDead || !(e.hp > 0)) continue;
            const dx = e.x - px;
            const dy = e.y - py;
            const dSq = dx * dx + dy * dy;
            if (dSq < bestSq) {
                bestSq = dSq;
                best = e;
            }
        }
        return best;
    }

    // ---------- 每帧调用（Game.update 注入 player 与存活敌人数组） ----------
    update(player, enemies) {
        const p = player || this.player;

        // 移动向量
        if (this.leftTouchId !== null && (this.leftVec.x !== 0 || this.leftVec.y !== 0)) {
            this.input.moveVector = { x: this.leftVec.x, y: this.leftVec.y };
        } else {
            this.input.moveVector = null;
        }

        // 自动辅助瞄准：每帧瞄向最近存活敌人（贴身跟踪，不预判）
        const target = this._findNearestEnemy(p.x, p.y, enemies);
        if (target) {
            this.input.mouse.worldX = target.x;
            this.input.mouse.worldY = target.y;
            this.aimAngle = Math.atan2(target.y - p.y, target.x - p.x);
        } else {
            // 无目标：回退到移动方向（在移动）或保持上次朝向
            if (this.leftVec.x !== 0 || this.leftVec.y !== 0) {
                this.aimAngle = Math.atan2(this.leftVec.y, this.leftVec.x);
            }
            this.input.mouse.worldX = p.x + Math.cos(this.aimAngle) * 200;
            this.input.mouse.worldY = p.y + Math.sin(this.aimAngle) * 200;
        }
        // 射击：按住射击按钮即持续开火（照常朝当前瞄准方向）
        this.input.mouse.down = this.shootHeld;

        // 弹药角标：镜像隐藏的 #ammo-text（HUD 已负责刷新内容），10 帧一次足够
        if (this.ammoBadge && (this._ammoTick = ((this._ammoTick || 0) + 1) % 10) === 0) {
            const src = document.getElementById('ammo-text');
            if (src && this.ammoBadge.textContent !== src.textContent) {
                this.ammoBadge.textContent = src.textContent;
            }
        }
    }
}

/**
 * 移动模式检测：真实触摸设备或 URL 调试参数 ?mobile=1。
 */
export function isMobileMode() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('mobile') === '1') return true;
    } catch (_) { /* ignore */ }
    return ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0;
}
