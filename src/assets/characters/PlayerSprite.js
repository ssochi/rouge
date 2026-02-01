// 32x32 Player Template - Enhanced Detail
// Centered in 32x32 canvas. 
// Character is approx 14px wide, 24px tall

const BASE_BODY = [
    "................................",
    "................................",
    "................................",
    "...........RRRRRRRRRR...........", // 3
    "..........RRrrrrrrrrRR..........",
    ".........RRrrrrrrrrrrRR.........",
    ".........RRrrrrrrrrrrRR...RR....",
    ".........RRrrrrrrrrrrRR..RRR....",
    ".........ssSSSSSSssssss.RR......",
    ".........sskksssskkssss.........",
    ".........sswwsssswwssss.........", // 10
    ".........ssssssssssssss.........",
    ".........ssssssssssssss.........",
    "..........ssssssssssss..........",
    "..........VVVVVVVVVVVV..........",
    ".........VVVVVVVVVVVVVV.........", // 15
    ".........vvvvVVVVvvvvVV.........",
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvllllvvvvcc........", // 19
    "........ccvvvvVVVVvvvvcc........",
    "........CCvvvvVVVVvvvvCC........", // 21
    "..........bbbbllllbbbb..........", // 22 (Belt)
];

// Legs start at line 23 (relative to array, 0-indexed) -> Line 28 in original file
// Original Legs:
// "..........cccc....cccc..........",
// "..........cccc....cccc..........",
// "..........cccc....cccc..........",
// "..........CCCC....CCCC..........",
// "..........bbbb....bbbb..........",
// "..........bbbb....bbbb..........",
// "..........BBBB....BBBB..........",

const LEGS_IDLE = [
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........CCCC....CCCC..........",
    "..........bbbb....bbbb..........",
    "..........bbbb....bbbb..........",
    "..........BBBB....BBBB..........",
    "................................",
    "................................"
];

// Run 1: Left leg forward (longer visual), Right leg back (shorter/higher)
const LEGS_RUN_1 = [
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........CCCC....bbbb..........",
    "..........bbbb....bbbb..........",
    "..........bbbb....BBBB..........",
    "..........BBBB..................",
    "................................",
    "................................"
];

// Run 2: Passing (similar to idle but narrower base maybe?)
const LEGS_RUN_2 = [
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........CCCC....CCCC..........",
    "..........bbbb....bbbb..........",
    "..........bbbb....bbbb..........",
    "..........BBBB....BBBB..........",
    "................................",
    "................................"
];

// Run 3: Right leg forward, Left leg back
const LEGS_RUN_3 = [
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........bbbb....CCCC..........",
    "..........bbbb....bbbb..........",
    "..........BBBB....bbbb..........",
    "..................BBBB..........",
    "................................",
    "................................"
];

// Helper to concat body and legs
const combine = (body, legs) => [...body, ...legs];

// Idle 1: Base
const IDLE_1 = combine(BASE_BODY, LEGS_IDLE);

// Idle 2: Breathe (Body shift down 1px)
// To shift down, we insert a blank line at top and remove one from belt area?
// Or just modify the body array.
const BASE_BODY_BREATHE = [
    "................................",
    "................................",
    "................................",
    "................................", // Shift down
    "...........RRRRRRRRRR...........",
    "..........RRrrrrrrrrRR..........",
    ".........RRrrrrrrrrrrRR.........",
    ".........RRrrrrrrrrrrRR...RR....",
    ".........RRrrrrrrrrrrRR..RRR....",
    ".........ssSSSSSSssssss.RR......",
    ".........sskksssskkssss.........",
    ".........sswwsssswwssss.........",
    ".........ssssssssssssss.........",
    ".........ssssssssssssss.........",
    "..........ssssssssssss..........",
    "..........VVVVVVVVVVVV..........",
    ".........VVVVVVVVVVVVVV.........",
    ".........vvvvVVVVvvvvVV.........", // Shoulders cover top of vest
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvllllvvvvcc........",
    "........ccvvvvVVVVvvvvcc........",
    "........CCvvvvVVVVvvvvCC........",
    "..........bbbbllllbbbb..........", 
];
// Note: BASE_BODY_BREATHE is 24 lines. BASE_BODY is 23 lines.
// We need to match total height 32.
// BASE_BODY (23) + LEGS_IDLE (9) = 32.
// BASE_BODY_BREATHE (24) + LEGS_IDLE (9) = 33. Too long.
// We need to trim the bottom of BASE_BODY_BREATHE or top of LEGS.
// The breathe effect basically compresses the torso.
// Let's remove one line from the vest in BREATHE.
const BASE_BODY_BREATHE_FIXED = [
    "................................",
    "................................",
    "................................",
    "................................", // Shift down
    "...........RRRRRRRRRR...........",
    "..........RRrrrrrrrrRR..........",
    ".........RRrrrrrrrrrrRR.........",
    ".........RRrrrrrrrrrrRR...RR....",
    ".........RRrrrrrrrrrrRR..RRR....",
    ".........ssSSSSSSssssss.RR......",
    ".........sskksssskkssss.........",
    ".........sswwsssswwssss.........",
    ".........ssssssssssssss.........",
    ".........ssssssssssssss.........",
    "..........ssssssssssss..........",
    "..........VVVVVVVVVVVV..........",
    ".........VVVVVVVVVVVVVV.........",
    // ".........vvvvVVVVvvvvVV.........", // SKIP THIS LINE (Compressed)
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvllllvvvvcc........",
    "........ccvvvvVVVVvvvvcc........",
    "........CCvvvvVVVVvvvvCC........",
    "..........bbbbllllbbbb..........", 
];
// 23 lines. Perfect.

const IDLE_2 = combine(BASE_BODY_BREATHE_FIXED, LEGS_IDLE);

export const PLAYER_IDLE_FRAMES = [IDLE_1, IDLE_2];

export const PLAYER_RUN_FRAMES = [
    combine(BASE_BODY, LEGS_RUN_1),
    combine(BASE_BODY, LEGS_RUN_2),
    combine(BASE_BODY, LEGS_RUN_3),
    combine(BASE_BODY, LEGS_RUN_2) // Cycle back to neutral
];

// Legacy export for compatibility if needed (though we will update Assets.js)
export const PLAYER_TEMPLATE = IDLE_1;
