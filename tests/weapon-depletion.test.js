// 弹尽销毁机制单测：最后一发（弹匣+备弹全空）触发 outOfAmmo 回调；
// 无限弹/近战/仍有备弹时不触发。
import './helpers/canvasStub.js';
import { describe, it, expect } from 'vitest';
import { HandSystem } from '../src/core/HandSystem.js';

function makeHand() {
    const player = { x: 0, y: 0, facingRight: true, state: 'idle' };
    return new HandSystem(player);
}

describe('弹尽销毁（bindOutOfAmmo）', () => {
    it('弹匣 1 发且备弹 0：打出后触发回调', () => {
        const hand = makeHand();
        hand.setWeapon('default_rifle');
        const state = hand.getWeaponState();
        state.currentAmmo = 1;
        state.reserveAmmo = 0;
        let fired = 0;
        hand.bindOutOfAmmo(() => fired++);
        hand.consumeAmmo();
        expect(fired).toBe(1);
        expect(hand.getWeaponState().currentAmmo).toBe(0);
    });

    it('仍有备弹：打空弹匣不触发', () => {
        const hand = makeHand();
        hand.setWeapon('default_rifle');
        const state = hand.getWeaponState();
        state.currentAmmo = 1;
        state.reserveAmmo = 10;
        let fired = 0;
        hand.bindOutOfAmmo(() => fired++);
        hand.consumeAmmo();
        expect(fired).toBe(0);
    });

    it('无限备弹武器：即使状态归零也不触发', () => {
        const hand = makeHand();
        hand.setWeapon('default_rifle');
        hand.currentWeapon = { ...hand.currentWeapon, infiniteAmmo: true };
        const state = hand.getWeaponState();
        state.currentAmmo = 1;
        state.reserveAmmo = 0;
        let fired = 0;
        hand.bindOutOfAmmo(() => fired++);
        hand.consumeAmmo();
        expect(fired).toBe(0);
    });
});
