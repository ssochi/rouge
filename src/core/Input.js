export class InputHandler {
    constructor(canvas) {
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            q: false, // Weapon Switch (Quick)
            e: false, // Interact / Pickup
            r: false, // Reload
            i: false, // Profiler Toggle
            o: false, // Spawn Nearby Vehicle
            b: false, // Backpack
            l: false, // Test Panel
            m: false, // Shortcut Menu
            p: false, // Debug Toggle
            escape: false, // Close overlay
            space: false,
            '1': false, '2': false, '3': false, '4': false, '5': false,
            '6': false, '7': false, '8': false, '9': false
        };
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            down: false
        };
        // 滚轮累积量（Game.update 每帧消费后清零；用于快捷栏滚轮切换）
        this.wheelDelta = 0;
        this.canvas = canvas;

        this._initListeners();
    }

    _initListeners() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key) || key === ' ') {
                if (key === ' ') this.keys.space = true;
                else this.keys[key] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keys.hasOwnProperty(key) || key === ' ') {
                if (key === ' ') this.keys.space = false;
                else this.keys[key] = false;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        this.canvas.addEventListener('mousedown', () => this.mouse.down = true);
        this.canvas.addEventListener('mouseup', () => this.mouse.down = false);

        // 滚轮：快捷栏切换（阻止页面滚动）
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.wheelDelta += Math.sign(e.deltaY);
        }, { passive: false });
    }

    updateWorldMouse(cameraX, cameraY) {
        this.mouse.worldX = this.mouse.x + cameraX;
        this.mouse.worldY = this.mouse.y + cameraY;
    }
}
