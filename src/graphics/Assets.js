import { spriteGenerator } from '../graphics/SpriteGenerator.js';
import { PALETTE } from '../assets/Palette.js';
import { PLAYER_IDLE_FRAMES } from '../assets/characters/player/PlayerIdle.js';
import { PLAYER_RUN_FRAMES } from '../assets/characters/player/PlayerRun.js';
import { PLAYER_ROLL_FRAMES } from '../assets/characters/player/PlayerRoll.js';
import { ENEMY_TEMPLATE } from '../assets/characters/EnemySprite.js';
import { RIFLE_TEMPLATE } from '../assets/weapons/RifleSprite.js';

// Generate Assets
export const Assets = {
    player: {
        idle: PLAYER_IDLE_FRAMES.map(t => spriteGenerator.generate(t, PALETTE)),
        run: PLAYER_RUN_FRAMES.map(t => spriteGenerator.generate(t, PALETTE)),
        roll: PLAYER_ROLL_FRAMES.map(t => spriteGenerator.generate(t, PALETTE))
    },
    enemy: spriteGenerator.generate(ENEMY_TEMPLATE, PALETTE),
    gun: spriteGenerator.generate(RIFLE_TEMPLATE, PALETTE)
};
