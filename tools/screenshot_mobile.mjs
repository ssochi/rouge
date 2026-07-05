#!/usr/bin/env node
// 移动端截图工具（视觉自查用）：无头 Chrome 以移动视口 + 触摸仿真打开页面并截图。
// 用法：node tools/screenshot_mobile.mjs [url] [输出.png] [等待ms] [宽] [高]
//   横屏：node tools/screenshot_mobile.mjs "http://localhost:5176/?map=dungeon&seed=7&mobile=1" out.png 3500 844 390
//   竖屏：node tools/screenshot_mobile.mjs "http://localhost:5176/?map=dungeon&seed=7&mobile=1" out.png 3500 390 844
// 前置：npm run dev 已在运行；系统安装 Google Chrome。

import puppeteer from 'puppeteer-core';

const url = process.argv[2] || 'http://localhost:5176/?map=dungeon&seed=7&mobile=1';
const out = process.argv[3] || '/tmp/mobile_shot.png';
const wait = parseInt(process.argv[4] || '3500', 10);
const width = parseInt(process.argv[5] || '844', 10);
const height = parseInt(process.argv[6] || '390', 10);

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: [`--window-size=${width},${height}`, '--disable-gpu-sandbox']
});

try {
    const page = await browser.newPage();
    await page.setViewport({
        width,
        height,
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2
    });
    page.on('console', (msg) => {
        const text = msg.text();
        if (msg.type() === 'error' || text.includes('[Dungeon]')) {
            console.log(`[page:${msg.type()}]`, text);
        }
    });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, wait));

    // 横屏截图前注入按住的触摸：左摇杆显形浮动 + 按住射击大按钮（触发自动瞄准开火）。
    if (width > height) {
        await page.evaluate((w, h) => {
            const root = document.getElementById('mobile-controls');
            if (!root) return;
            const fire = (el, type, id, x, y) => {
                const touch = new Touch({ identifier: id, target: el, clientX: x, clientY: y, pageX: x, pageY: y });
                const ev = new TouchEvent(type, {
                    bubbles: true, cancelable: true,
                    touches: [touch], targetTouches: [touch], changedTouches: [touch]
                });
                el.dispatchEvent(ev);
            };
            const leftZone = root.querySelector('.mc-zone-left');
            const shootBtn = root.querySelector('.mc-shoot');
            // 左摇杆：落指 + 向右上推
            fire(leftZone, 'touchstart', 1, w * 0.18, h * 0.62);
            fire(window, 'touchmove', 1, w * 0.18 + 34, h * 0.62 - 30);
            // 按住射击大按钮（中心约在 right:20+46, bottom:20+46）→ 持续开火 + 自动瞄准
            fire(shootBtn, 'touchstart', 2, w - 66, h - 66);
        }, width, height);
        // 多按几帧让自动瞄准锁定并打出子弹
        await new Promise((r) => setTimeout(r, 500));
    }

    await page.screenshot({ path: out });
    console.log('screenshot saved:', out, `(${width}x${height})`);
} finally {
    await browser.close();
}
