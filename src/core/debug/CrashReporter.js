// [mobile-fix] 崩溃取证与全局错误捕获
// 目标：手机端"变亮然后卡死"发生时不再静默死亡——
//   1. 顶部红色错误条显示错误消息+栈首行；
//   2. localStorage 保留最近若干条崩溃记录（带时间戳），?debug=1 开机回放；
//   3. 供 rAF 主循环 try/catch 复用（recordCrash / showErrorBar）。
// 本模块自身所有 DOM / localStorage 操作都吞掉异常，保证"取证代码"永不成为新的崩溃源。

const STORAGE_KEY = 'rl_crash_log';
const MAX_HISTORY = 3;
const BAR_ID = 'rl-crash-bar';

let _installed = false;
let _showBarEnabled = false; // 仅移动端 / ?debug=1 时把错误条画到屏幕上
let _barEl = null;
let _barHideTimer = null;

function nowIso() {
    try {
        return new Date().toISOString();
    } catch (_) {
        return String(Date.now());
    }
}

function firstStackLine(error) {
    const stack = error && typeof error.stack === 'string' ? error.stack : '';
    if (!stack) return '';
    const lines = stack.split('\n').map(l => l.trim()).filter(Boolean);
    // 第 0 行通常是"Error: message"，取第 1 行调用栈更有定位价值。
    return lines[1] || lines[0] || '';
}

function toMessage(error) {
    if (!error) return 'unknown error';
    if (typeof error === 'string') return error;
    if (error.message) return String(error.message);
    try {
        return String(error);
    } catch (_) {
        return 'unstringifiable error';
    }
}

export function getHistory() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
        return [];
    }
}

function persist(entry) {
    try {
        const history = getHistory();
        history.push(entry);
        while (history.length > MAX_HISTORY) history.shift();
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (_) {
        // localStorage 不可用（隐私模式/配额）时静默放弃取证，但不影响游戏。
    }
}

/**
 * 记录一次崩溃：写 console + localStorage 环形缓冲。
 * @param {string} source 崩溃来源标签（如 'loop' / 'window.onerror'）
 * @param {*} error 错误对象或字符串
 * @param {object} [extra] 附加上下文（如 {frame, map}）
 */
export function recordCrash(source, error, extra = null) {
    const entry = {
        t: nowIso(),
        src: source || 'unknown',
        msg: toMessage(error),
        at: firstStackLine(error)
    };
    if (extra && typeof extra === 'object') {
        entry.ctx = extra;
    }

    try {
        // 保留完整栈到控制台，方便桌面调试。
        console.error(`[crash:${entry.src}] ${entry.msg}`, error, extra || '');
    } catch (_) { /* ignore */ }

    persist(entry);
    return entry;
}

function ensureBar() {
    if (_barEl && document.body.contains(_barEl)) return _barEl;
    try {
        const el = document.createElement('div');
        el.id = BAR_ID;
        el.style.cssText = [
            'position:fixed',
            'top:0',
            'left:0',
            'right:0',
            'z-index:2147483647',
            'background:rgba(200,30,30,0.94)',
            'color:#fff',
            'font:11px/1.4 monospace',
            'padding:6px 10px',
            'white-space:pre-wrap',
            'word-break:break-word',
            'box-shadow:0 1px 6px rgba(0,0,0,0.5)',
            'pointer-events:auto',
            'max-height:40vh',
            'overflow:auto'
        ].join(';');
        // 点击错误条即可临时隐藏，避免遮挡操作。
        el.addEventListener('click', () => {
            try { el.style.display = 'none'; } catch (_) { /* ignore */ }
        });
        document.body.appendChild(el);
        _barEl = el;
        return el;
    } catch (_) {
        return null;
    }
}

/**
 * 在屏幕顶部显示红色错误条。仅在启用（移动端或 ?debug=1）时真正绘制。
 * @param {string} text 显示文本
 * @param {object} [opts] { fatal } fatal=true 时常驻不自动消失
 */
export function showErrorBar(text, opts = {}) {
    if (!_showBarEnabled) return;
    const el = ensureBar();
    if (!el) return;
    try {
        el.style.display = 'block';
        el.textContent = text;
        el.style.background = opts.fatal ? 'rgba(120,0,0,0.97)' : 'rgba(200,30,30,0.94)';

        if (_barHideTimer) {
            clearTimeout(_barHideTimer);
            _barHideTimer = null;
        }
        // 非致命错误 6 秒后自动淡出，致命错误常驻。
        if (!opts.fatal) {
            _barHideTimer = setTimeout(() => {
                try { el.style.display = 'none'; } catch (_) { /* ignore */ }
            }, 6000);
        }
    } catch (_) { /* ignore */ }
}

function formatEntry(entry) {
    const at = entry.at ? `\n  ${entry.at}` : '';
    return `[${entry.t}] (${entry.src}) ${entry.msg}${at}`;
}

/**
 * 安装全局错误捕获。应尽早调用（Game 构造函数内）。
 * @param {object} options { isMobile, debug }
 */
export function installGlobalHandlers({ isMobile = false, debug = false } = {}) {
    if (_installed) return;
    _installed = true;
    _showBarEnabled = !!isMobile || !!debug;

    try {
        window.addEventListener('error', (event) => {
            const err = event?.error || event?.message || 'error';
            const entry = recordCrash('window.onerror', err);
            showErrorBar(`崩溃(全局): ${entry.msg}${entry.at ? '\n' + entry.at : ''}`);
        });

        window.addEventListener('unhandledrejection', (event) => {
            const reason = event?.reason || 'unhandledrejection';
            const entry = recordCrash('unhandledrejection', reason);
            showErrorBar(`崩溃(Promise): ${entry.msg}${entry.at ? '\n' + entry.at : ''}`);
        });
    } catch (_) { /* ignore */ }

    // ?debug=1 开机回放最近崩溃历史，方便"复盘上次为什么卡死"。
    if (debug) {
        const history = getHistory();
        if (history.length > 0) {
            const text = '最近崩溃记录（点击隐藏）:\n' + history.map(formatEntry).join('\n');
            showErrorBar(text, { fatal: true });
        }
    }
}
