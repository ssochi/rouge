import { Assets } from '../../../graphics/Assets.js';

const PROGRAMS = {
    OFF: 0,
    STATIC: 1,
    NEWS: 2,
    SPORTS: 3,
    WEATHER: 4,
    TEST: 5
};

const COLORS = {
    STATIC_NOISE: ['#2c3e50', '#34495e', '#7f8c8d'],
    NEWS_BG: '#2980b9',
    NEWS_ANCHOR: '#f1c40f',
    NEWS_SUIT: '#e74c3c',
    SPORTS_BG: '#27ae60',
    SPORTS_PLAYER: '#ecf0f1',
    SPORTS_BALL: '#f39c12',
    WEATHER_BG: '#3498db',
    WEATHER_SUN: '#f1c40f',
    WEATHER_CLOUD: '#ecf0f1',
    TEST_BARS: ['#e74c3c', '#2ecc71', '#3498db', '#f1c40f', '#9b59b6', '#ecf0f1']
};

// Pre-computed light colors per program via weighted RGB average of dominant screen colors
// Formula: r = r1*w1 + r2*w2, same for g,b
function blendColors(c1, w1, c2, w2) {
    const p = (hex) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
    const [r1,g1,b1] = p(c1);
    const [r2,g2,b2] = p(c2);
    const r = Math.round(r1*w1 + r2*w2);
    const g = Math.round(g1*w1 + g2*w2);
    const b = Math.round(b1*w1 + b2*w2);
    const h = (v) => v.toString(16).padStart(2,'0');
    return `#${h(r)}${h(g)}${h(b)}`;
}

const PROGRAM_LIGHT_COLORS = {
    [PROGRAMS.STATIC]:  { color: '#4a5568', intensity: 0.45, flicker: 0.12 },
    [PROGRAMS.NEWS]:    { color: blendColors('#2980b9', 0.7, '#c0392b', 0.3), intensity: 0.7, flicker: 0.03 },
    [PROGRAMS.SPORTS]:  { color: blendColors('#27ae60', 0.75, '#f39c12', 0.25), intensity: 0.7, flicker: 0.03 },
    [PROGRAMS.TEST]:    { color: '#b8a8c0', intensity: 0.6, flicker: 0.01 }
};
const WEATHER_LIGHT = {
    sun:  { color: blendColors('#3498db', 0.65, '#f1c40f', 0.35), intensity: 0.65, flicker: 0.02 },
    rain: { color: blendColors('#3498db', 0.7, '#7f8c8d', 0.3), intensity: 0.5, flicker: 0.02 }
};

export const TVStandObject = {
    configure(obj) {
        obj.hitbox = { offsetX: 0, offsetY: 16, width: 40, height: 16 };
        obj.hp = 40;
        obj.shadow = { type: 'rect', x: 0, y: 16, w: 40, h: 16 };
        
        // TV State
        obj.tv = {
            isOn: true, // Default ON
            program: PROGRAMS.STATIC,
            channelTimer: 30, // Start with short static
            frame: 0,
            
            // Program specific states
            news: {
                textX: 20,
                text: "BREAKING NEWS... ZOMBIE OUTBREAK... STAY INDOORS...",
                headBob: 0
            },
            sports: {
                p1y: 6,
                p2y: 6,
                bx: 10,
                by: 6,
                bdx: 1,
                bdy: 0.5
            },
            weather: {
                type: 0, // 0: Sun, 1: Rain
                timer: 0
            }
        };
    },

    interact(obj) {
        // Toggle TV power
        obj.tv.isOn = !obj.tv.isOn;
        
        // If turned on, start with static then random channel
        if (obj.tv.isOn) {
            obj.tv.program = PROGRAMS.STATIC;
            obj.tv.channelTimer = 30; // 0.5s static
        }
        
        return true;
    },

    update(obj) {
        if (!obj.tv.isOn) {
            obj.lightColor = null;
            obj.lightIntensity = null;
            obj.lightFlicker = null;
            return;
        }
        
        const tv = obj.tv;
        tv.frame++;
        
        // Auto channel switch or static transition
        if (tv.program === PROGRAMS.STATIC) {
            tv.channelTimer--;
            if (tv.channelTimer <= 0) {
                // Switch to random channel (excluding OFF and STATIC)
                const channels = [PROGRAMS.NEWS, PROGRAMS.SPORTS, PROGRAMS.WEATHER, PROGRAMS.TEST];
                tv.program = channels[Math.floor(Math.random() * channels.length)];
                tv.channelTimer = 300 + Math.random() * 300; // 5-10s per channel
            }
        } else {
            tv.channelTimer--;
            if (tv.channelTimer <= 0) {
                tv.program = PROGRAMS.STATIC;
                tv.channelTimer = 20; // Brief static between channels
            }
        }

        // Update specific programs
        if (tv.program === PROGRAMS.NEWS) {
            tv.news.textX -= 0.5;
            if (tv.news.textX < -100) tv.news.textX = 20;
            if (tv.frame % 10 === 0) tv.news.headBob = (tv.news.headBob + 1) % 2;
        }
        else if (tv.program === PROGRAMS.SPORTS) {
            // Pong logic
            const s = tv.sports;
            s.bx += s.bdx * 0.5;
            s.by += s.bdy * 0.5;
            
            // Ball bounds (screen 20x14)
            if (s.by <= 0 || s.by >= 12) s.bdy *= -1;
            
            // Paddles follow ball with delay
            if (s.bx < 10) s.p1y += (s.by - s.p1y) * 0.1;
            else s.p2y += (s.by - s.p2y) * 0.1;
            
            // Paddle hit
            if (s.bx <= 2 && Math.abs(s.by - s.p1y) < 3) s.bdx = Math.abs(s.bdx);
            if (s.bx >= 18 && Math.abs(s.by - s.p2y) < 3) s.bdx = -Math.abs(s.bdx);
            
            // Reset
            if (s.bx < -2 || s.bx > 22) {
                s.bx = 10; s.by = 6;
                s.bdx *= -1;
            }
        }
        else if (tv.program === PROGRAMS.WEATHER) {
            tv.weather.timer++;
            if (tv.weather.timer > 120) {
                tv.weather.type = (tv.weather.type + 1) % 2;
                tv.weather.timer = 0;
            }
        }

        // Compute dynamic light color based on current screen content
        let lightDef;
        if (tv.program === PROGRAMS.WEATHER) {
            lightDef = tv.weather.type === 0 ? WEATHER_LIGHT.sun : WEATHER_LIGHT.rain;
        } else {
            lightDef = PROGRAM_LIGHT_COLORS[tv.program];
        }
        if (lightDef) {
            obj.lightColor = lightDef.color;
            obj.lightIntensity = lightDef.intensity;
            obj.lightFlicker = lightDef.flicker;
        }
    },

    getHurtbox(obj) {
        return obj.getHitbox();
    },

    draw(obj, ctx) {
        // 1. Draw Static Cabinet
        const sprite = Assets.objects['tv_stand'];
        if (sprite) {
            ctx.drawImage(sprite, 0, 0);
        }

        if (!obj.tv.isOn) return;

        // Screen Coordinates (Relative to sprite)
        // Sprite w=40, h=32.
        // Screen area from TVStandSprite:
        // tvW=24, tvH=18, tvX=8, tvY=17 (approx)
        // Bezel margin 2.
        // scrX = 8 + 2 = 10
        // scrY = (32 - 12 - 18 + 3) + 2 + 1 = 5 + 3 = 8? 
        // Let's re-calculate from Sprite logic:
        // standH=12, standY=20.
        // tvH=18, tvY = 20 - 18 + 3 = 5.
        // scrM=2. scrY = 5 + 2 + 1 = 8.
        // tvW=24, tvX = (40-24)/2 = 8.
        // scrX = 8 + 2 = 10.
        // scrW = 24 - 4 = 20.
        // scrH = 18 - 4 - 2 = 12.
        
        const scrX = 10;
        const scrY = 8;
        const scrW = 20;
        const scrH = 12;

        ctx.save();
        ctx.beginPath();
        ctx.rect(scrX, scrY, scrW, scrH);
        ctx.clip();

        // Draw Program Content
        const p = obj.tv.program;
        
        if (p === PROGRAMS.STATIC) {
            for (let y = 0; y < scrH; y+=2) {
                for (let x = 0; x < scrW; x+=2) {
                    if (Math.random() > 0.5) {
                        ctx.fillStyle = COLORS.STATIC_NOISE[Math.floor(Math.random()*3)];
                        ctx.fillRect(scrX + x, scrY + y, 2, 2);
                    }
                }
            }
        }
        else if (p === PROGRAMS.NEWS) {
            // BG
            ctx.fillStyle = COLORS.NEWS_BG;
            ctx.fillRect(scrX, scrY, scrW, scrH);
            
            // Anchor
            const bob = obj.tv.news.headBob;
            ctx.fillStyle = COLORS.NEWS_SUIT;
            ctx.fillRect(scrX + 6, scrY + 6, 8, 6); // Body
            ctx.fillStyle = COLORS.NEWS_ANCHOR;
            ctx.fillRect(scrX + 8, scrY + 2 + bob, 4, 4); // Head
            
            // Scrolling Text Bar
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(scrX, scrY + scrH - 3, scrW, 3);
            
            // "Text" (dots)
            ctx.fillStyle = '#fff';
            const tx = Math.floor(obj.tv.news.textX);
            for (let i = 0; i < 20; i++) {
                if ((i + tx) % 8 < 4) {
                    ctx.fillRect(scrX + tx + i*2, scrY + scrH - 2, 1, 1);
                }
            }
        }
        else if (p === PROGRAMS.SPORTS) {
            ctx.fillStyle = COLORS.SPORTS_BG;
            ctx.fillRect(scrX, scrY, scrW, scrH);
            
            // Field lines
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.fillRect(scrX + scrW/2, scrY, 1, scrH);
            
            // Paddles
            ctx.fillStyle = COLORS.SPORTS_PLAYER;
            const s = obj.tv.sports;
            ctx.fillRect(scrX + 1, scrY + s.p1y - 2, 2, 4);
            ctx.fillRect(scrX + scrW - 3, scrY + s.p2y - 2, 2, 4);
            
            // Ball
            ctx.fillStyle = COLORS.SPORTS_BALL;
            ctx.fillRect(scrX + s.bx, scrY + s.by, 2, 2);
        }
        else if (p === PROGRAMS.WEATHER) {
            ctx.fillStyle = COLORS.WEATHER_BG;
            ctx.fillRect(scrX, scrY, scrW, scrH);
            
            // Map shape (green blob)
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(scrX + 2, scrY + 4, 10, 6);
            ctx.fillRect(scrX + 8, scrY + 2, 8, 4);
            
            if (obj.tv.weather.type === 0) {
                // Sun
                ctx.fillStyle = COLORS.WEATHER_SUN;
                ctx.fillRect(scrX + 14, scrY + 2, 4, 4);
            } else {
                // Rain
                ctx.fillStyle = '#7f8c8d';
                ctx.fillRect(scrX + 12, scrY + 2, 6, 3); // Cloud
                ctx.fillStyle = '#ecf0f1';
                if (obj.tv.frame % 4 < 2) {
                    ctx.fillRect(scrX + 13, scrY + 6, 1, 2);
                    ctx.fillRect(scrX + 16, scrY + 6, 1, 2);
                }
            }
        }
        else if (p === PROGRAMS.TEST) {
            const barW = scrW / 6;
            COLORS.TEST_BARS.forEach((c, i) => {
                ctx.fillStyle = c;
                ctx.fillRect(scrX + i * barW, scrY, barW + 1, scrH);
            });
        }

        // Scanlines overlay
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let y = 0; y < scrH; y += 2) {
            ctx.fillRect(scrX, scrY + y, scrW, 1);
        }

        // Screen Glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(scrX, scrY, scrW, scrH);
        
        ctx.restore();

        // Power LED (Green when on)
        // Sprite has red LED at: tvX + tvW - 3, tvY + tvH - 2
        // tvX=8, tvW=24 -> 32-3 = 29.
        // tvY=5, tvH=18 -> 23-2 = 21.
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(29, 21, 1, 1);
    }
};
