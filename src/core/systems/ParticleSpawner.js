export class ParticleSpawner {
    constructor({ particles }) {
        this.particles = particles;
    }

    spawnDebris(x, y, type) {
        const count = 5 + Math.random() * 5;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;

            let color = '#8d6e63';
            let size = Math.random() * 4 + 2;
            let width = size;

            if (type === 'vase') {
                color = '#d35400';
                if (Math.random() > 0.5) {
                    width = size * 0.5;
                }
            } else if (type === 'box') {
                if (Math.random() > 0.3) {
                    size = Math.random() * 8 + 4;
                    width = 2;
                }
            } else if (type === 'barrel') {
                if (Math.random() > 0.7) {
                    color = '#424242';
                    width = 2;
                    size = 4;
                } else {
                    if (Math.random() > 0.3) {
                        size = Math.random() * 6 + 3;
                        width = 3;
                    }
                }
            } else if (type === 'explosive_barrel') {
                color = '#c0392b';
                if (Math.random() > 0.5) {
                    color = '#2c3e50';
                }
                width = 3;
                size = Math.random() * 5 + 3;
            }

            this.particles.push({
                type: 'debris',
                x: x,
                y: y,
                z: 10 + Math.random() * 10,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                vz: Math.random() * 3 + 2,
                angle: Math.random() * Math.PI * 2,
                vAngle: (Math.random() - 0.5) * 0.5,
                life: 999999,
                color: color,
                size: size,
                width: width,
                gravity: 0.2,
                bounce: 0.4
            });
        }
    }

    spawnBloodExplosion(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 60 + Math.random() * 30,
                color: Math.random() > 0.5 ? '#922b21' : '#641e16',
                size: Math.random() * 4 + 2,
                gravity: 0.1,
                friction: 0.95
            });
        }
    }

    spawnBloodSplatter(x, y, angle) {
        for (let i = 0; i < 5; i++) {
            const spread = (Math.random() - 0.5) * 1.0;
            const speed = Math.random() * 4 + 2;
            this.particles.push({
                type: 'blood',
                x: x,
                y: y,
                vx: Math.cos(angle + spread) * speed,
                vy: Math.sin(angle + spread) * speed,
                life: 30 + Math.random() * 20,
                color: '#922b21',
                size: Math.random() * 3 + 1,
                gravity: 0.1,
                friction: 0.9
            });
        }
    }

    spawnShellCasing(x, y, angle) {
        const isFlipped = Math.abs(angle) > Math.PI / 2;

        let ejectOffset;
        if (isFlipped) {
            ejectOffset = -Math.PI / 2;
        } else {
             ejectOffset = Math.PI / 2;
        }

        const ejectAngle = angle + ejectOffset + (Math.random() - 0.5) * 0.5;
        const speed = Math.random() * 1.5 + 0.5;

        this.particles.push({
            type: 'shell',
            x: x,
            y: y,
            z: 10,
            vx: Math.cos(ejectAngle) * speed,
            vy: Math.sin(ejectAngle) * speed,
            vz: Math.random() * 2 + 1,
            angle: Math.random() * Math.PI * 2,
            vAngle: (Math.random() - 0.5) * 0.5,
            life: 300,
            color: '#f1c40f',
            size: 3,
            width: 1.5,
            gravity: 0.25,
            bounce: 0.5
        });
    }

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            if (p.type === 'shockwave') {
                p.size += (p.maxSize - p.size) * 0.2;
                p.alpha -= 0.05;
                p.life--;
            } else if (p.type === 'flash') {
                p.alpha -= 0.1;
                p.life--;
            } else if (p.type === 'fire') {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.9;
                p.vy *= 0.9;
                p.size *= 0.95;
                if (p.life < 20) p.color = '#e67e22';
                if (p.life < 10) p.color = '#c0392b';
                p.life--;
            } else if (p.type === 'smoke') {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= 0.95;
                p.vy *= 0.95;
                p.size *= 1.02;
                p.alpha -= 0.01;
                p.life--;
            } else if (p.type === 'explosion_anim') {
                p.frameTimer++;
                if (p.frameTimer >= p.frameDelay) {
                    p.frameTimer = 0;
                    p.frame++;
                    if (p.frame >= p.sprites.length) {
                        p.life = 0;
                    }
                }
            } else if (p.type === 'laser_beam') {
                p.life--;
            } else if (p.type === 'lightning_arc') {
                p.life--;
            } else if (p.type === 'black_hole_orbit') {
                const dx = p.targetX - p.x;
                const dy = p.targetY - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    p.x += (dx / dist) * 2;
                    p.y += (dy / dist) * 2;
                    // Spiral motion
                    p.x += (-dy / dist) * 1.5;
                    p.y += (dx / dist) * 1.5;
                }
                p.size *= 0.97;
                p.life--;
            } else if (p.type === 'shell' || p.type === 'debris') {
                p.x += p.vx;
                p.y += p.vy;
                p.z += p.vz;
                p.vz -= p.gravity;
                p.angle += p.vAngle;

                if (p.z <= 0) {
                    p.z = 0;
                    if (Math.abs(p.vz) > 1) {
                        p.vz *= -p.bounce;
                        p.vx *= 0.6;
                        p.vy *= 0.6;
                        p.vAngle *= 0.7;
                    } else {
                        p.vz = 0;
                        p.vx *= 0.3;
                        p.vy *= 0.3;
                        p.vAngle = 0;
                    }
                }

                if (p.type !== 'debris') {
                    p.life--;
                }
            } else {
                p.x += p.vx;
                p.y += p.vy;
                p.vx *= p.friction || 1;
                p.vy *= p.friction || 1;
                p.life--;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
}
