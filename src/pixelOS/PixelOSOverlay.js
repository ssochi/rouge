/**
 * PixelOSOverlay - DOM overlay + Canvas creation and coordinate mapping
 */
export class PixelOSOverlay {
    constructor() {
        this.OS_WIDTH = 384;
        this.OS_HEIGHT = 256;

        // Create overlay DOM
        this.overlay = document.createElement('div');
        this.overlay.id = 'pixel-os-overlay';

        const monitor = document.createElement('div');
        monitor.className = 'pixel-os-monitor';

        this.canvas = document.createElement('canvas');
        this.canvas.className = 'pixel-os-screen';
        this.canvas.width = this.OS_WIDTH;
        this.canvas.height = this.OS_HEIGHT;

        monitor.appendChild(this.canvas);
        this.overlay.appendChild(monitor);

        // 移动端专用关闭钮：桌面靠 ESC 关闭，触屏无键盘，故补一个可点关闭钮。
        // 默认隐藏（inline display:none）；MobileControls 在移动模式注入 CSS 以 !important 显示。
        this.closeBtn = document.createElement('div');
        this.closeBtn.className = 'pixel-os-close-btn';
        this.closeBtn.textContent = '✕';
        this.closeBtn.style.display = 'none';
        this.closeBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (this.onClickOutside) this.onClickOutside();
        });
        this.overlay.appendChild(this.closeBtn);

        document.body.appendChild(this.overlay);

        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;

        // Click outside monitor to close
        this.onClickOutside = null;
        this.overlay.addEventListener('mousedown', (e) => {
            if (e.target === this.overlay && this.onClickOutside) {
                this.onClickOutside();
            }
        });
    }

    show() {
        this.overlay.classList.add('active');
    }

    hide() {
        this.overlay.classList.remove('active');
    }

    get visible() {
        return this.overlay.classList.contains('active');
    }

    /** Map client coordinates to OS canvas coordinates */
    mapCoords(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (clientX - rect.left) * this.OS_WIDTH / rect.width;
        const y = (clientY - rect.top) * this.OS_HEIGHT / rect.height;
        return { x: Math.floor(x), y: Math.floor(y) };
    }
}
