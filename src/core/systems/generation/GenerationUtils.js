export function tileKey(x, y) {
    return `${x},${y}`;
}

export function parseTileKey(key) {
    const [x, y] = key.split(',').map(v => parseInt(v, 10));
    return { x, y };
}

export function randomInt(rng, min, max) {
    if (max < min) return min;
    return Math.floor(rng() * (max - min + 1)) + min;
}

export function chooseRandom(rng, list) {
    if (!list || list.length === 0) return null;
    return list[randomInt(rng, 0, list.length - 1)];
}

export function shuffle(rng, list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = randomInt(rng, 0, i);
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

export function rectsOverlapWithGap(a, b, gap = 0) {
    return (
        a.x - gap < b.x + b.w &&
        a.x + a.w + gap > b.x &&
        a.y - gap < b.y + b.h &&
        a.y + a.h + gap > b.y
    );
}

export function touchesWall(room, x, y, w, h) {
    return (
        x === room.x ||
        y === room.y ||
        x + w === room.x + room.w ||
        y + h === room.y + room.h
    );
}

export function roomArea(room) {
    return room.w * room.h;
}

export function rectCenter(rect) {
    return {
        x: rect.x + rect.w / 2,
        y: rect.y + rect.h / 2
    };
}

export function manhattan(ax, ay, bx, by) {
    return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function collectRoomTileKeys(room) {
    const out = [];
    for (let y = room.y; y < room.y + room.h; y++) {
        for (let x = room.x; x < room.x + room.w; x++) {
            out.push(tileKey(x, y));
        }
    }
    return out;
}

export function buildRoomLookup(rooms) {
    const lookup = new Map();
    for (const room of rooms) {
        for (let y = room.y; y < room.y + room.h; y++) {
            for (let x = room.x; x < room.x + room.w; x++) {
                lookup.set(tileKey(x, y), room.id);
            }
        }
    }
    return lookup;
}

export function forEachSegmentTile(segment, cb) {
    if (segment.orientation === 'v') {
        for (let y = segment.from; y <= segment.to; y++) {
            cb(segment.x, y);
        }
        return;
    }

    for (let x = segment.from; x <= segment.to; x++) {
        cb(x, segment.y);
    }
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function isRectInside(outer, inner) {
    return (
        inner.x >= outer.x &&
        inner.y >= outer.y &&
        inner.x + inner.w <= outer.x + outer.w &&
        inner.y + inner.h <= outer.y + outer.h
    );
}

export function tilesOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
