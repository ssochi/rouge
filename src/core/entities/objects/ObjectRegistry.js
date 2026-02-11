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
import { ToiletObject } from './ToiletObject.js';
import { BathtubObject } from './BathtubObject.js';
import { SinkObject } from './SinkObject.js';
import { ArmchairObject } from './ArmchairObject.js';
import { FloorLampObject } from './FloorLampObject.js';
import { PottedPlantObject } from './PottedPlantObject.js';
import { CabinetObject } from './CabinetObject.js';
import { FridgeObject } from './FridgeObject.js';
import { StoveObject } from './StoveObject.js';
import { KitchenCounterObject } from './KitchenCounterObject.js';
import { KitchenSinkObject } from './KitchenSinkObject.js';
import { TreeObject } from './TreeObject.js';
import { TreeSmallObject } from './TreeSmallObject.js';
import { BushObject } from './BushObject.js';
import { GrassTuftObject, GrassTallObject, GrassFlowerObject } from './GrassTuftObject.js';

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
    ['tv_stand', TVStandObject],
    ['toilet', ToiletObject],
    ['bathtub', BathtubObject],
    ['sink', SinkObject],
    ['armchair', ArmchairObject],
    ['floor_lamp', FloorLampObject],
    ['potted_plant', PottedPlantObject],
    ['cabinet', CabinetObject],
    ['fridge', FridgeObject],
    ['stove', StoveObject],
    ['kitchen_counter', KitchenCounterObject],
    ['kitchen_sink', KitchenSinkObject],
    ['tree', TreeObject],
    ['tree_small', TreeSmallObject],
    ['bush', BushObject],
    ['grass_tuft', GrassTuftObject],
    ['grass_tall', GrassTallObject],
    ['grass_flower', GrassFlowerObject]
]);

export function getObjectDef(type) {
    return OBJECT_DEFS.get(type) || null;
}

