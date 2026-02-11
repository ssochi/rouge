/**
 * ProfilerSystem — 性能分析系统
 * 跟踪每帧各子系统的执行时间，维护历史帧数据用于可视化。
 *
 * 使用方式：
 *   profiler.begin('MySystem');
 *   mySystem.update();
 *   profiler.end('MySystem');
 */
export class ProfilerSystem {
    constructor() {
        this.HISTORY_SIZE = 300; // ~5秒 @60fps
        this.TARGET_FRAME_MS = 16.67;
        this.WARNING_FRAME_MS = 33.33;

        // 当前帧计时器 { label: { start, elapsed } }
        this._currentFrame = {};
        this._frameStart = 0;

        // 环形缓冲区
        this._history = new Array(this.HISTORY_SIZE);
        this._historyIndex = 0;
        this._historyCount = 0;

        // FPS（滚动1秒窗口）
        this._fpsFrameCount = 0;
        this._fpsLastTime = performance.now();
        this.fps = 0;

        // 系统注册顺序 & 颜色
        this._systemOrder = [];
        this._systemColors = {};
        this._palette = [
            '#e74c3c', // red
            '#f39c12', // orange
            '#2ecc71', // green
            '#3498db', // blue
            '#9b59b6', // purple
            '#1abc9c', // teal
            '#e67e22', // dark orange
            '#f1c40f', // yellow
            '#e91e63', // pink
            '#00bcd4', // cyan
            '#8bc34a', // lime
            '#ff5722', // deep orange
        ];

        this.visible = false;
    }

    /** 帧开始 */
    beginFrame() {
        this._frameStart = performance.now();
        this._currentFrame = {};
    }

    /** 子系统计时开始（自动注册） */
    begin(label) {
        if (!this._systemColors[label]) {
            this._systemColors[label] = this._palette[this._systemOrder.length % this._palette.length];
            this._systemOrder.push(label);
        }
        this._currentFrame[label] = { start: performance.now(), elapsed: 0 };
    }

    /** 子系统计时结束 */
    end(label) {
        const entry = this._currentFrame[label];
        if (entry) {
            entry.elapsed = performance.now() - entry.start;
        }
    }

    /** 帧结束，写入环形缓冲区 */
    endFrame() {
        const totalMs = performance.now() - this._frameStart;

        const systems = {};
        for (const label in this._currentFrame) {
            systems[label] = this._currentFrame[label].elapsed;
        }

        this._history[this._historyIndex] = { total: totalMs, systems };
        this._historyIndex = (this._historyIndex + 1) % this.HISTORY_SIZE;
        if (this._historyCount < this.HISTORY_SIZE) this._historyCount++;

        // FPS
        this._fpsFrameCount++;
        const now = performance.now();
        const elapsed = now - this._fpsLastTime;
        if (elapsed >= 1000) {
            this.fps = Math.round((this._fpsFrameCount * 1000) / elapsed);
            this._fpsFrameCount = 0;
            this._fpsLastTime = now;
        }
    }

    /** 返回历史帧数组（旧→新） */
    getHistory() {
        const result = [];
        const start = this._historyCount < this.HISTORY_SIZE
            ? 0
            : this._historyIndex;
        for (let i = 0; i < this._historyCount; i++) {
            const idx = (start + i) % this.HISTORY_SIZE;
            result.push(this._history[idx]);
        }
        return result;
    }

    /** 返回最新帧 */
    getLatestFrame() {
        if (this._historyCount === 0) return null;
        const idx = (this._historyIndex - 1 + this.HISTORY_SIZE) % this.HISTORY_SIZE;
        return this._history[idx];
    }

    getSystemOrder() { return this._systemOrder; }
    getSystemColor(label) { return this._systemColors[label] || '#888'; }
}
