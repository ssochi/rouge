#!/usr/bin/env node
// 游戏截图工具（视觉自查用）：无头 Chrome 打开 Vite dev server 页面并截图。
// 用法：node tools/screenshot_game.mjs [url] [输出.png] [等待ms]
//   node tools/screenshot_game.mjs "http://localhost:5173/?map=dungeon&seed=42&gates=1" /tmp/dungeon.png 3500
// 前置：npm run dev 已在运行；系统安装 Google Chrome。

import puppeteer from 'puppeteer-core';

const url = process.argv[2] || 'http://localhost:5173/?map=dungeon&seed=42';
const out = process.argv[3] || '/tmp/game_shot.png';
const wait = parseInt(process.argv[4] || '3500', 10);

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--window-size=1280,800', '--disable-gpu-sandbox']
});

try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    page.on('console', (msg) => {
        const text = msg.text();
        if (msg.type() === 'error' || text.includes('[Dungeon]')) {
            console.log(`[page:${msg.type()}]`, text);
        }
    });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise((r) => setTimeout(r, wait));
    await page.screenshot({ path: out });
    console.log('screenshot saved:', out);
} finally {
    await browser.close();
}
