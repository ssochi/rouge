// MobileControls.js
// 移动端触摸操作层（仅在移动模式实例化，桌面零开销）。
//
// 结构：
//  - 左虚拟摇杆（屏幕左下区域任意落指浮现）→ input.moveVector 归一化移动向量
//  - 右虚拟摇杆（屏幕右下区域）→ 合成 input.mouse.worldX/worldY 瞄准 + 拉杆过死区 input.mouse.down 射击
//  - 动作按钮组（翻滚/交互/换弹/背包）→ 映射 input.keys 布尔按下/抬起
//  - 竖屏遮罩（强制横屏，CSS media query + JS 双保险）
//  - 触屏→鼠标事件桥（背包/衣装等 DOM UI 的 onmousedown/onmousemove 交互在触屏可用）
//
// 所有样式在构造时注入 <style>，DOM 全部动态创建；不修改桌面路径。

const STICK_MAX = 52;        // 摇杆最大位移半径（px）
const MOVE_DEADZONE = 0.16;  // 左摇杆移动死区（占最大半径比例）
const FIRE_DEADZONE = 0.34;  // 右摇杆开火死区（占最大半径比例）

export class MobileControls {
    constructor({ input, player, camera, canvas }) {
        this.input = input;
        this.player = player;
        this.camera = camera;
        this.canvas = canvas;

        // 左右摇杆状态（identifier 追踪多点触控）
        this.leftTouchId = null;
        this.rightTouchId = null;
        this.leftOrigin = { x: 0, y: 0 };
        this.rightOrigin = { x: 0, y: 0 };
        this.leftVec = { x: 0, y: 0 };
        this.aimAngle = 0;       // 最近一次瞄准角度（右摇杆松开后保持朝向）
        this.rightFiring = false;

        // 触屏→鼠标桥追踪的手指
        this.bridgeTouchId = null;

        this._injectStyles();
        this._buildDOM();
        this._bindJoysticks();
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
        /* 抬高快捷栏层级，保证其在摇杆区之上仍可点触 */
        .hotbar-panel { z-index: 20 !important; }

        #mobile-controls {
            position: fixed; inset: 0; z-index: 10;
            pointer-events: none;
            font-family: 'Courier New', monospace;
        }
        .mc-zone {
            position: fixed; bottom: 0; height: 56vh; width: 42vw;
            pointer-events: auto;
        }
        .mc-zone-left  { left: 0; }
        /* 右摇杆热区收窄并内缩至中右侧：让出最右侧竖条给动作按钮，
           浮动 knob（最大位移 ${STICK_MAX}px）无法触及右下角按钮，避免视觉重叠/误触。 */
        .mc-zone-right { right: 24vw; width: 32vw; }

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
        .mc-stick-right .mc-stick-knob { background: rgba(231, 76, 60, 0.55); }

        /* 动作按钮：2×2 圆钮，钉在右下角、位于金币/钥匙 HUD 下方，且在收窄后的右摇杆热区之外。 */
        .mc-buttons {
            position: fixed; right: 12px; bottom: 14px;
            display: grid; grid-template-columns: repeat(2, 58px); gap: 10px;
            justify-items: center; align-items: center;
            pointer-events: none;
        }
        .mc-btn {
            pointer-events: auto;
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

        /* 弹药角标：挂在「换弹」按钮右上角；桌面版的右下角武器面板在移动端隐藏（与按钮组重叠）。 */
        .weapon-panel { display: none !important; }
        .mc-btn { position: relative; }
        .mc-btn-ammo {
            position: absolute; top: -6px; right: -10px;
            min-width: 34px; padding: 1px 5px;
            font-size: 11px; text-align: center;
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

        this.leftZone = document.createElement('div');
        this.leftZone.className = 'mc-zone mc-zone-left';
        this.rightZone = document.createElement('div');
        this.rightZone.className = 'mc-zone mc-zone-right';

        this.leftBase = this._makeStick('left');
        this.rightBase = this._makeStick('right');

        this.root.appendChild(this.leftZone);
        this.root.appendChild(this.rightZone);
        this.root.appendChild(this.leftBase);
        this.root.appendChild(this.rightBase);

        // 动作按钮组
        this.buttonRow = document.createElement('div');
        this.buttonRow.className = 'mc-buttons';
        const BTNS = [
            { key: 'space', glyph: '🌀', label: '翻滚' },
            { key: 'e', glyph: '✋', label: '交互' },
            { key: 'r', glyph: '🔄', label: '换弹' },
            { key: 'b', glyph: '🎒', label: '背包' },
        ];
        this.buttons = [];
        for (const def of BTNS) {
            const btn = document.createElement('div');
            btn.className = 'mc-btn';
            btn.dataset.key = def.key;
            btn.innerHTML = `<span class="mc-btn-glyph">${def.glyph}</span><span class="mc-btn-label">${def.label}</span>`;
            if (def.key === 'r') {
                this.ammoBadge = document.createElement('span');
                this.ammoBadge.className = 'mc-btn-ammo';
                this.ammoBadge.textContent = '∞';
                btn.appendChild(this.ammoBadge);
            }
            this.buttonRow.appendChild(btn);
            this.buttons.push(btn);
        }
        this.root.appendChild(this.buttonRow);

        document.body.appendChild(this.root);

        // 竖屏遮罩：直接挂 body（避免被 #mobile-controls 的 z-index:10 堆叠上下文困住），
        // 以 z-index:9999 覆盖 HUD/快捷栏/背包等一切。
        this.orientMask = document.createElement('div');
        this.orientMask.className = 'mc-orientation-mask';
        this.orientMask.innerHTML = `
            <div class="mc-phone">📱</div>
            <div class="mc-tip">请横屏游玩</div>
            <div class="mc-sub">Rotate your device</div>
        `;
        document.body.appendChild(this.orientMask);
    }

    _makeStick(side) {
        const base = document.createElement('div');
        base.className = `mc-stick-base mc-stick-${side}`;
        const knob = document.createElement('div');
        knob.className = 'mc-stick-knob';
        base.appendChild(knob);
        base._knob = knob;
        return base;
    }

    // ---------- 摇杆事件 ----------
    _bindJoysticks() {
        this.leftZone.addEventListener('touchstart', (e) => this._onStickStart('left', e), { passive: false });
        this.rightZone.addEventListener('touchstart', (e) => this._onStickStart('right', e), { passive: false });
        // touchmove/end 绑定在 window：手指移出落指区仍持续追踪
        window.addEventListener('touchmove', (e) => this._onStickMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this._onStickEnd(e), { passive: false });
        window.addEventListener('touchcancel', (e) => this._onStickEnd(e), { passive: false });
    }

    _onStickStart(side, e) {
        const idKey = side === 'left' ? 'leftTouchId' : 'rightTouchId';
        if (this[idKey] !== null) return;             // 该摇杆已有手指
        const t = e.changedTouches[0];
        this[idKey] = t.identifier;
        const origin = side === 'left' ? this.leftOrigin : this.rightOrigin;
        origin.x = t.clientX;
        origin.y = t.clientY;
        const base = side === 'left' ? this.leftBase : this.rightBase;
        base.style.left = `${t.clientX}px`;
        base.style.top = `${t.clientY}px`;
        base.style.display = 'block';
        this._updateStick(side, t.clientX, t.clientY);
        e.preventDefault();
        e.stopPropagation();
    }

    _onStickMove(e) {
        let handled = false;
        for (const t of e.changedTouches) {
            if (t.identifier === this.leftTouchId) {
                this._updateStick('left', t.clientX, t.clientY);
                handled = true;
            } else if (t.identifier === this.rightTouchId) {
                this._updateStick('right', t.clientX, t.clientY);
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
                this._resetKnob(this.leftBase);
                this.leftBase.style.display = 'none';
            } else if (t.identifier === this.rightTouchId) {
                this.rightTouchId = null;
                this.rightFiring = false;
                this._resetKnob(this.rightBase);
                this.rightBase.style.display = 'none';
            }
        }
    }

    _updateStick(side, cx, cy) {
        const origin = side === 'left' ? this.leftOrigin : this.rightOrigin;
        let dx = cx - origin.x;
        let dy = cy - origin.y;
        const dist = Math.hypot(dx, dy);
        const clamped = Math.min(dist, STICK_MAX);
        const nx = dist > 0 ? dx / dist : 0;
        const ny = dist > 0 ? dy / dist : 0;
        const mag = clamped / STICK_MAX; // 0..1

        // 视觉：knob 跟随（clamp 到最大半径）
        const base = side === 'left' ? this.leftBase : this.rightBase;
        base._knob.style.transform = `translate(${nx * clamped}px, ${ny * clamped}px)`;

        if (side === 'left') {
            if (mag < MOVE_DEADZONE) {
                this.leftVec.x = 0; this.leftVec.y = 0;
            } else {
                this.leftVec.x = nx;
                this.leftVec.y = ny;
            }
        } else {
            if (mag > 0.001) this.aimAngle = Math.atan2(ny, nx);
            this.rightFiring = mag > FIRE_DEADZONE;
        }
    }

    _resetKnob(base) {
        if (base && base._knob) base._knob.style.transform = 'translate(0,0)';
    }

    // ---------- 动作按钮 ----------
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
    // 让背包/衣装等纯 DOM UI（onmousedown/onmousemove/onmouseup）在触屏工作。
    // 跳过 canvas 与摇杆层（那些各有专属处理）。
    _installTouchMouseBridge() {
        const isBridgeTarget = (el) => {
            if (!el) return false;
            if (el === this.canvas || el.tagName === 'CANVAS') return false;
            if (this.root.contains(el)) return false; // 摇杆/按钮层
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
            e.preventDefault(); // 抑制浏览器 300ms 合成鼠标事件，避免双触发
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

    // ---------- 每帧调用（Game.update 注入 player 引用） ----------
    update(player) {
        const p = player || this.player;

        // 移动向量
        if (this.leftTouchId !== null && (this.leftVec.x !== 0 || this.leftVec.y !== 0)) {
            this.input.moveVector = { x: this.leftVec.x, y: this.leftVec.y };
        } else {
            this.input.moveVector = null;
        }

        // 瞄准：始终按最近角度合成世界坐标（右摇杆松开后保持朝向）
        const dirX = Math.cos(this.aimAngle);
        const dirY = Math.sin(this.aimAngle);
        this.input.mouse.worldX = p.x + dirX * 200;
        this.input.mouse.worldY = p.y + dirY * 200;
        this.input.mouse.down = this.rightFiring;

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
