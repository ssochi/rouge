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
const DRIVE_THRESHOLD = 0.35; // 驾驶态摇杆分量→WASD 置位阈值（每轴独立，支持斜推=油门+转向）
const AIM_FALLBACK_RANGE = 450; // 无相机信息时的自动瞄准半径（世界像素）
const TAP_MOVE_TOL = 10;      // 触屏桥：位移小于此值判定为 tap（补发 click）；大于则为拖拽
const LONG_PRESS_MS = 450;    // 触屏桥：长按阈值（不移动且超时→合成右键）

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
        this._bindMinimapTap();
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
        /* 快捷栏菜单在小屏可能超高：限高 + 内部竖向滚动（配合桥的滚动让位）。 */
        .shortcut-menu-window {
            max-height: 92vh; overflow-y: auto; overflow-x: hidden;
            touch-action: pan-y; -webkit-overflow-scrolling: touch;
        }
        /* 背包窗是固定多列布局（原生 ~751×502，高由 12 行背包格决定）。HUD.css 的 max-height:80vh
           会把窗压矮、使内容溢出错乱；解除限高让窗容纳全部内容，再整体缩放适配视口。
           popIn 动画会动 transform 与本缩放打架，移动端关掉。 */
        .inventory-window {
            max-height: none !important; animation: none !important;
            transform: scale(0.68); transform-origin: center center;
        }
        /* 键位说明子面板：小屏限高使整窗不溢出视口；BACK 键 sticky 常驻底部保证可触达。 */
        .keybind-list { max-height: 46vh !important; touch-action: pan-y; }
        .shortcut-menu-back-btn { position: sticky; bottom: 0; background: var(--ui-bg-color); z-index: 1; }

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

        /* pixelOS（电脑）移动端关闭钮：桌面靠 ESC，触屏补一个可点关闭钮，仅移动模式显示。 */
        .pixel-os-close-btn {
            display: flex !important; position: fixed; top: 12px; right: 12px; z-index: 100;
            width: 46px; height: 46px; border-radius: 50%;
            align-items: center; justify-content: center;
            font-size: 22px; line-height: 1; color: #fff;
            background: rgba(200, 40, 40, 0.9); border: 2px solid rgba(255,255,255,0.75);
            box-shadow: 0 2px 6px rgba(0,0,0,0.55); pointer-events: auto;
        }

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
    // 让纯 DOM UI（onmousedown/onclick/右键）在触屏工作。跳过 canvas 与摇杆层。
    // - tap（位移<10px）：touchend 补发 mousedown+mouseup+**click**（复活所有 click 监听：死亡重开/菜单等）
    // - 拖拽（位移>10px）：起点补发 mousedown，过程补发 mousemove（背包/衣装光标跟随不回归）
    // - 长按（~450ms 不动）：补发 button=2 的 mousedown/mouseup（背包右键：取半/拆分），本次不再发 click
    _installTouchMouseBridge() {
        const isBridgeTarget = (el) => {
            if (!el) return false;
            if (el === this.canvas) return false;      // 游戏主画布：射击/移动走按钮/摇杆，不桥接
            if (this.root.contains(el)) return false;  // 摇杆/按钮层
            return true; // 其余（含 pixelOS 画布等 DOM）均桥接，使其触屏可点
        };
        const dispatchAt = (type, x, y, button = 0) => {
            const el = document.elementFromPoint(x, y) || document;
            const pressed = (type === 'mousedown') ? (button === 2 ? 2 : 1) : 0;
            el.dispatchEvent(new MouseEvent(type, {
                bubbles: true, cancelable: true, view: window,
                clientX: x, clientY: y, button, buttons: pressed
            }));
        };

        document.addEventListener('touchstart', (e) => {
            const t = e.changedTouches[0];
            const el = document.elementFromPoint(t.clientX, t.clientY);
            if (!isBridgeTarget(el)) return;
            this.bridgeTouchId = t.identifier;
            this._bridgeStart = { x: t.clientX, y: t.clientY };
            this._bridgeStartEl = el;
            this._bridgeMoved = false;
            this._bridgeMousedownFired = false;
            this._bridgeLongPressed = false;
            this._bridgeScrolling = false;
            this._clearLongPress();
            this._bridgeLongPressTimer = setTimeout(() => {
                // 长按：未移动且未开始左键拖拽 → 补发右键
                if (this.bridgeTouchId === t.identifier && !this._bridgeMoved && !this._bridgeMousedownFired) {
                    this._bridgeLongPressed = true;
                    const { x, y } = this._bridgeStart;
                    dispatchAt('mousedown', x, y, 2);
                    dispatchAt('mouseup', x, y, 2);
                }
            }, LONG_PRESS_MS);
            e.preventDefault(); // 抑制浏览器原生 click/300ms 合成，改由本桥统一补发
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (this.bridgeTouchId === null) return;
            for (const t of e.changedTouches) {
                if (t.identifier !== this.bridgeTouchId) continue;
                if (this._bridgeScrolling) return; // 已判定为滚动：交给浏览器原生滚动，不 preventDefault
                const dx = t.clientX - this._bridgeStart.x;
                const dy = t.clientY - this._bridgeStart.y;
                if (!this._bridgeMoved && Math.hypot(dx, dy) > TAP_MOVE_TOL) {
                    this._bridgeMoved = true;
                    this._clearLongPress();
                    // 竖向拖拽且落在可滚动容器上 → 让位给原生滚动（背包/菜单溢出可上下滑）
                    if (Math.abs(dy) > Math.abs(dx) && this._hasScrollableAncestor(this._bridgeStartEl)) {
                        this._bridgeScrolling = true;
                        return;
                    }
                    // 否则转为拖拽：在起点补发 mousedown 开始交互（背包/衣装拾取并跟随）
                    if (!this._bridgeLongPressed && !this._bridgeMousedownFired) {
                        dispatchAt('mousedown', this._bridgeStart.x, this._bridgeStart.y, 0);
                        this._bridgeMousedownFired = true;
                    }
                }
                if (this._bridgeMousedownFired) dispatchAt('mousemove', t.clientX, t.clientY, 0);
                e.preventDefault();
            }
        }, { passive: false });

        const finishTouch = (t, cancelled) => {
            this._clearLongPress();
            const x = t.clientX, y = t.clientY;
            if (this._bridgeScrolling) {
                // 滚动手势：无任何鼠标合成
            } else if (this._bridgeLongPressed) {
                // 右键已补发，无需 click
            } else if (this._bridgeMousedownFired) {
                dispatchAt('mouseup', x, y, 0); // 拖拽收尾
            } else if (!cancelled) {
                // tap：完整左键序列 + click
                dispatchAt('mousedown', x, y, 0);
                dispatchAt('mouseup', x, y, 0);
                dispatchAt('click', x, y, 0);
            }
            this.bridgeTouchId = null;
            this._bridgeMoved = false;
            this._bridgeMousedownFired = false;
            this._bridgeLongPressed = false;
            this._bridgeScrolling = false;
        };
        document.addEventListener('touchend', (e) => {
            if (this.bridgeTouchId === null) return;
            for (const t of e.changedTouches) {
                if (t.identifier === this.bridgeTouchId) finishTouch(t, false);
            }
        }, { passive: false });
        document.addEventListener('touchcancel', (e) => {
            if (this.bridgeTouchId === null) return;
            for (const t of e.changedTouches) {
                if (t.identifier === this.bridgeTouchId) finishTouch(t, true);
            }
        }, { passive: false });
    }

    // [depth-batch:minimap] 小地图 tap → 切换全屏大地图（复用触屏桥的 tap 位移判定）。
    // 画布右上角约 190×190 客户端像素为小地图区；大地图开启时点非操作区（摇杆/按钮外）亦关闭，
    // 保证开图期间玩家仍可移动/射击（点摇杆或射击按钮不触发关闭）。
    _bindMinimapTap() {
        let start = null;
        document.addEventListener('touchstart', (e) => {
            const t = e.changedTouches[0];
            start = { id: t.identifier, x: t.clientX, y: t.clientY };
        }, { passive: true });
        document.addEventListener('touchend', (e) => {
            if (!start) return;
            const t = [...e.changedTouches].find(ct => ct.identifier === start.id);
            const s = start;
            start = null;
            if (!t) return;
            if (Math.hypot(t.clientX - s.x, t.clientY - s.y) > TAP_MOVE_TOL) return; // 非 tap
            const open = !!(this.input && this.input.bigMapOpen);
            if (this._inMinimapRegion(t.clientX, t.clientY)) {
                if (this.input) this.input.bigMapOpen = !open;
                return;
            }
            if (open) {
                const el = document.elementFromPoint(t.clientX, t.clientY);
                if (el && this.root && this.root.contains(el)) return; // 操作控件：不关闭
                this.input.bigMapOpen = false;
            }
        }, { passive: true });
    }

    // 小地图面板固定于画布右上角（约 190×190 客户端像素）
    _inMinimapRegion(clientX, clientY) {
        return clientX >= window.innerWidth - 190 && clientY <= 190;
    }

    _clearLongPress() {
        if (this._bridgeLongPressTimer) {
            clearTimeout(this._bridgeLongPressTimer);
            this._bridgeLongPressTimer = null;
        }
    }

    // 从 el 向上查找是否存在可竖向滚动的祖先（用于触屏桥让位原生滚动）
    _hasScrollableAncestor(el) {
        let node = el;
        while (node && node !== document.body && node.nodeType === 1) {
            const oy = getComputedStyle(node).overflowY;
            if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 2) return true;
            node = node.parentElement;
        }
        return false;
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

        // 移动向量（步行态由 PlayerSystem 消费；驾驶态不消费）
        if (this.leftTouchId !== null && (this.leftVec.x !== 0 || this.leftVec.y !== 0)) {
            this.input.moveVector = { x: this.leftVec.x, y: this.leftVec.y };
        } else {
            this.input.moveVector = null;
        }

        // 驾驶态：把左摇杆向量翻译成 WASD，让载具（读 input.keys：W油门/S倒车/A左转/D右转）随摇杆开动。
        // 走路态清零 WASD，避免驾驶时置位的键泄漏到步行（步行走 moveVector，keys 仅作后备）。
        if (p.state === 'driving') {
            const v = this.leftVec;
            this.input.keys.w = v.y < -DRIVE_THRESHOLD;
            this.input.keys.s = v.y > DRIVE_THRESHOLD;
            this.input.keys.a = v.x < -DRIVE_THRESHOLD;
            this.input.keys.d = v.x > DRIVE_THRESHOLD;
        } else {
            this.input.keys.w = false;
            this.input.keys.s = false;
            this.input.keys.a = false;
            this.input.keys.d = false;
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
