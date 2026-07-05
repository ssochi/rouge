import { Game } from './core/Game.js';

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);
game.start();

// 调试/自动化自查入口（截图与音频实测工具经此访问实例；不影响正常运行）
window.game = game;
