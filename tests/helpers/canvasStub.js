// 无头 Canvas 桩：供 vitest（node 环境）在导入 Assets/帧模块时满足 PixelDraw 的 Canvas 依赖。
// 必须在导入任何会实例化 PixelDraw 的模块之前导入本文件（ESM 按 import 顺序求值副作用）。
if (typeof globalThis.document === 'undefined') {
    const makeCtx = () => new Proxy({}, {
        get(target, prop) {
            if (prop in target) return target[prop];
            return () => {}; // 任意 ctx 方法均为 no-op
        },
        set(target, prop, value) { target[prop] = value; return true; }
    });

    const makeCanvas = () => {
        const canvas = { width: 0, height: 0 };
        canvas.getContext = () => makeCtx();
        canvas.toDataURL = () => '';
        return canvas;
    };

    globalThis.document = {
        createElement: (tag) => (tag === 'canvas' ? makeCanvas() : {})
    };
}
