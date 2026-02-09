import { BoxObject } from './BoxObject.js';
import { BarrelObject } from './BarrelObject.js';
import { VaseObject } from './VaseObject.js';
import { ExplosiveBarrelObject } from './ExplosiveBarrelObject.js';
import { WallObject } from './WallObject.js';
import { WallHObject } from './WallHObject.js';
import { WallVObject } from './WallVObject.js';
import { DoorHObject } from './DoorHObject.js';
import { DoorVObject } from './DoorVObject.js';
import { BedObject } from './BedObject.js';
import { BedHObject } from './BedHObject.js';
import { NightstandObject } from './NightstandObject.js';
import { WardrobeObject } from './WardrobeObject.js';
import { TableObject } from './TableObject.js';
import { SofaObject } from './SofaObject.js';
import { BookshelfObject } from './BookshelfObject.js';
import { TVStandObject } from './TVStandObject.js';

const OBJECT_DEFS = new Map([
    ['box', BoxObject],
    ['barrel', BarrelObject],
    ['vase', VaseObject],
    ['explosive_barrel', ExplosiveBarrelObject],
    ['wall', WallObject],
    ['wall_h', WallHObject],
    ['wall_v', WallVObject],
    ['door_h', DoorHObject],
    ['door_v', DoorVObject],
    ['bed', BedObject],
    ['bed_h', BedHObject],
    ['nightstand', NightstandObject],
    ['wardrobe', WardrobeObject],
    ['table', TableObject],
    ['sofa', SofaObject],
    ['bookshelf', BookshelfObject],
    ['tv_stand', TVStandObject]
]);

export function getObjectDef(type) {
    return OBJECT_DEFS.get(type) || null;
}

