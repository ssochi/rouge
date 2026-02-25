/**
 * AnimationSystem - Tween animation engine for PixelOS
 * Supports boot sequence, window open/close, minimize animations
 */
export class AnimationSystem {
    constructor() {
        this.tweens = [];
    }

    /**
     * Add a tween animation
     * @param {Object} opts - { target, prop, from, to, duration, easing, onComplete }
     */
    add(opts) {
        const tween = {
            target: opts.target,
            prop: opts.prop,
            from: opts.from,
            to: opts.to,
            duration: opts.duration || 30,
            elapsed: 0,
            easing: opts.easing || 'easeOutCubic',
            onComplete: opts.onComplete || null,
            onUpdate: opts.onUpdate || null
        };
        if (tween.target && tween.prop !== undefined) {
            tween.target[tween.prop] = tween.from;
        }
        this.tweens.push(tween);
        return tween;
    }

    update() {
        for (let i = this.tweens.length - 1; i >= 0; i--) {
            const t = this.tweens[i];
            t.elapsed++;
            const progress = Math.min(t.elapsed / t.duration, 1);
            const easedProgress = this._ease(progress, t.easing);
            const value = t.from + (t.to - t.from) * easedProgress;

            if (t.target && t.prop !== undefined) {
                t.target[t.prop] = value;
            }
            if (t.onUpdate) {
                t.onUpdate(value, easedProgress);
            }

            if (progress >= 1) {
                if (t.onComplete) t.onComplete();
                this.tweens.splice(i, 1);
            }
        }
    }

    _ease(t, type) {
        switch (type) {
            case 'easeOutCubic': return 1 - Math.pow(1 - t, 3);
            case 'easeInCubic': return t * t * t;
            case 'easeInOutCubic': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
            case 'linear': return t;
            default: return t;
        }
    }

    get active() {
        return this.tweens.length > 0;
    }

    clear() {
        this.tweens.length = 0;
    }
}
