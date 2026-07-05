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
import { DeskObject } from './DeskObject.js';
import { ChairObject } from './ChairObject.js';
import { DresserObject } from './DresserObject.js';
import { WashingMachineObject } from './WashingMachineObject.js';
import { GrandfatherClockObject } from './GrandfatherClockObject.js';
import { PianoObject } from './PianoObject.js';
import { WineRackObject } from './WineRackObject.js';
import { CoatRackObject } from './CoatRackObject.js';
import { FishTankObject } from './FishTankObject.js';
import { WorkbenchObject } from './WorkbenchObject.js';
import { ComputerDeskObject } from './ComputerDeskObject.js';
import { DungeonRubbleObject } from './DungeonRubbleObject.js';
import { DungeonIronCageObject } from './DungeonIronCageObject.js';
import { DungeonBonePileObject } from './DungeonBonePileObject.js';
import { DungeonTorchObject } from './DungeonTorchObject.js';
import { DungeonBrazierObject } from './DungeonBrazierObject.js';
import {
    DungeonPillarObject,
    DungeonPillarBrokenObject,
    DungeonStatueObject,
    DungeonAltarObject,
    DungeonBannerObject,
    DungeonBarsObject,
    DungeonRackObject,
    DungeonMushroomsObject
} from './DungeonDecorObjects.js';
// ── F1 监狱层物件 ──
import {
    PrisonCellDoorObject,
    PrisonFileCabinetObject,
    PrisonLockerObject,
    PrisonDirtMoundObject,
    PrisonVisitBoothObject,
    PrisonWatchtowerObject,
    PrisonBunkObject
} from './F1PrisonObjects.js';
// ── F3 深渊实验室层物件 ──
import {
    F3CultureTankObject,
    F3CultureTankBrokenObject,
    F3SurgeryTableObject,
    F3ReactorCoreObject,
    F3GolemTorsoObject,
    F3CryoPodObject,
    F3TargetDummyObject,
    F3PipeObject
} from './F3LabObjects.js';
// ── F2 圣殿层叙事物件 ──
import {
    TemplePewObject,
    TemplePulpitObject,
    AlchemyCauldronObject,
    PotionShelfObject,
    TempleCandelabraObject,
    BrokenOrganObject,
    ReliquaryCaseObject,
    SacrificeSlabObject
} from './F2TempleObjects.js';
// ── [depth-batch:rooms] 房间机关物件 ──
import {
    SpikeTrapObject,
    RewardCageObject,
    CageLeverObject,
    DecoyStatueObject
} from './DungeonTrapObjects.js';

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
    ['floor_lamp_warm', FloorLampObject],
    ['floor_lamp_cool', FloorLampObject],
    ['floor_lamp_mint', FloorLampObject],
    ['floor_lamp_rose', FloorLampObject],
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
    ['grass_flower', GrassFlowerObject],
    ['desk', DeskObject],
    ['chair', ChairObject],
    ['dresser', DresserObject],
    ['washing_machine', WashingMachineObject],
    ['grandfather_clock', GrandfatherClockObject],
    ['piano', PianoObject],
    ['wine_rack', WineRackObject],
    ['coat_rack', CoatRackObject],
    ['fish_tank', FishTankObject],
    ['workbench', WorkbenchObject],
    ['computer_desk', ComputerDeskObject],
    ['dungeon_rubble', DungeonRubbleObject],
    ['dungeon_iron_cage', DungeonIronCageObject],
    ['dungeon_bone_pile', DungeonBonePileObject],
    ['dungeon_torch', DungeonTorchObject],
    ['dungeon_brazier', DungeonBrazierObject],
    ['dungeon_pillar', DungeonPillarObject],
    ['dungeon_pillar_broken', DungeonPillarBrokenObject],
    ['dungeon_statue', DungeonStatueObject],
    ['dungeon_altar', DungeonAltarObject],
    ['dungeon_banner', DungeonBannerObject],
    ['dungeon_bars', DungeonBarsObject],
    ['dungeon_rack', DungeonRackObject],
    ['dungeon_mushrooms', DungeonMushroomsObject],
    // ── F1 监狱层物件 ──
    ['prison_cell_door', PrisonCellDoorObject],
    ['prison_file_cabinet', PrisonFileCabinetObject],
    ['prison_locker', PrisonLockerObject],
    ['prison_dirt_mound', PrisonDirtMoundObject],
    ['prison_visit_booth', PrisonVisitBoothObject],
    ['prison_watchtower', PrisonWatchtowerObject],
    ['prison_bunk', PrisonBunkObject],
    // ── F3 深渊实验室层物件 ──
    ['f3_culture_tank', F3CultureTankObject],
    ['f3_culture_tank_broken', F3CultureTankBrokenObject],
    ['f3_surgery_table', F3SurgeryTableObject],
    ['f3_reactor_core', F3ReactorCoreObject],
    ['f3_golem_torso', F3GolemTorsoObject],
    ['f3_cryo_pod', F3CryoPodObject],
    ['f3_target_dummy', F3TargetDummyObject],
    ['f3_pipe', F3PipeObject]
]);

// ── F2 圣殿层叙事物件（.set 追加，避免并行编辑 Map 字面量冲突）──
OBJECT_DEFS.set('temple_pew', TemplePewObject);
OBJECT_DEFS.set('temple_pulpit', TemplePulpitObject);
OBJECT_DEFS.set('alchemy_cauldron', AlchemyCauldronObject);
OBJECT_DEFS.set('potion_shelf', PotionShelfObject);
OBJECT_DEFS.set('temple_candelabra', TempleCandelabraObject);
OBJECT_DEFS.set('broken_organ', BrokenOrganObject);
OBJECT_DEFS.set('reliquary_case', ReliquaryCaseObject);
OBJECT_DEFS.set('sacrifice_slab', SacrificeSlabObject);

// ── [depth-batch:rooms] 房间机关（尖刺陷阱 / 奖励笼 / 拉杆 / 诱饵雕像）──
OBJECT_DEFS.set('spike_trap', SpikeTrapObject);
OBJECT_DEFS.set('reward_cage', RewardCageObject);
OBJECT_DEFS.set('cage_lever', CageLeverObject);
OBJECT_DEFS.set('decoy_statue', DecoyStatueObject);

export function getObjectDef(type) {
    return OBJECT_DEFS.get(type) || null;
}
