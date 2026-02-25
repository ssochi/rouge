import { PixelDraw } from '../../utils/PixelDraw.js';

/**
 * Procedural Truck Launcher Generator
 * A comically oversized launcher that fires trucks
 * Dimensions: 38x16
 */
export function generateTruckLauncher() {
    const width = 38;
    const height = 16;
    const drawer = new PixelDraw(width, height);

    // Colors
    const cBody = '#37474f';       // Dark blue grey - main body
    const cBodyLight = '#546e7a';  // Lighter body
    const cBodyDark = '#263238';   // Darkest body
    const cBarrel = '#455a64';     // Barrel
    const cBarrelInner = '#1a1a2e';// Dark barrel opening
    const cAccent = '#e53935';     // Red accent (truck theme)
    const cAccentDark = '#b71c1c'; // Dark red
    const cGrip = '#212121';       // Grip color
    const cChrome = '#eceff1';     // Chrome/metal highlights
    const cChromeDark = '#90a4ae'; // Dark chrome
    const cWarning = '#ff8f00';    // Warning orange stripes

    // -- Main Body / Housing --
    // Large rectangular housing (this holds a compressed truck)
    drawer.rect(4, 3, 26, 10, cBody);
    drawer.rect(4, 3, 26, 1, cBodyLight);  // Top highlight
    drawer.rect(4, 12, 26, 1, cBodyDark);  // Bottom shadow

    // Side panel details
    drawer.rect(6, 5, 22, 6, cBodyLight);
    drawer.rect(6, 5, 22, 1, cChromeDark);
    drawer.rect(6, 10, 22, 1, cBodyDark);

    // Warning stripes on body
    for (let x = 7; x < 26; x += 4) {
        drawer.rect(x, 6, 2, 4, cWarning);
        drawer.pixel(x, 6, '#ffb300');
    }

    // -- Oversized Barrel (front) --
    // Wide barrel for truck deployment
    drawer.rect(30, 2, 6, 12, cBarrel);
    drawer.rect(30, 2, 6, 1, cBodyLight);
    drawer.rect(30, 13, 6, 1, cBodyDark);
    // Barrel opening
    drawer.rect(34, 3, 4, 10, cBarrelInner);
    drawer.rect(34, 3, 1, 10, cChromeDark);  // Ring
    // Muzzle brake / deployment rails
    drawer.hLine(35, 5, 3, cChromeDark);
    drawer.hLine(35, 7, 3, cChromeDark);
    drawer.hLine(35, 9, 3, cChromeDark);
    drawer.hLine(35, 11, 3, cChromeDark);

    // -- Rear Section --
    // Exhaust / Back end
    drawer.rect(0, 4, 4, 8, cBodyDark);
    drawer.rect(0, 5, 2, 6, cBarrelInner);
    drawer.vLine(2, 5, 6, cChromeDark);

    // -- Red accent stripe --
    drawer.rect(4, 7, 26, 2, cAccent);
    drawer.hLine(4, 7, 26, cAccentDark);

    // -- Truck icon on side (tiny truck silhouette) --
    // Cab
    drawer.rect(16, 5, 3, 2, cChrome);
    // Cargo
    drawer.rect(12, 5, 4, 2, cChromeDark);

    // -- Grips --
    // Rear Grip (Trigger)
    drawer.fillPath([
        { x: 10, y: 13 },
        { x: 12, y: 13 },
        { x: 11, y: 16 },
        { x: 9, y: 16 }
    ], cGrip);
    // Trigger
    drawer.pixel(11, 14, '#000000');

    // Front Grip
    drawer.fillPath([
        { x: 22, y: 13 },
        { x: 24, y: 13 },
        { x: 23, y: 16 },
        { x: 21, y: 16 }
    ], cGrip);

    // -- Top Rail --
    drawer.rect(8, 2, 18, 1, cChrome);
    drawer.hLine(8, 2, 18, '#ffffff');

    // -- Small sight --
    drawer.rect(26, 1, 2, 2, cChromeDark);
    drawer.pixel(27, 1, cChrome);

    return drawer.getCanvas();
}

export const TRUCK_LAUNCHER_SPRITE = generateTruckLauncher();
