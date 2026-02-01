// Player Run Animation - 8 Frames
// Details: Leg cycling, Body bobbing, Arm swinging, Bandana trailing

// Note: Character defaults to facing LEFT.
// So "Behind" is RIGHT.
// Bandana should trail to the RIGHT.

const BASE_BODY_UP = [
    "................................",
    "................................",
    "................................",
    "...........RRRRRRRRRR...........",
    "..........RRrrrrrrrrRR..........",
    ".........RRrrrrrrrrrrRR.........",
    ".........RRrrrrrrrrrrRR.........", 
    ".........RRrrrrrrrrrrRR...RR....", // Trail to RIGHT
    ".........ssSSSSSSssssss..RRR....",
    ".........sskksssskkssss..RR.....",
    ".........sswwsssswwssss.........",
    ".........ssssssssssssss.........",
    ".........ssssssssssssss.........",
    "..........ssssssssssss..........",
    "..........VVVVVVVVVVVV..........",
    ".........VVVVVVVVVVVVVV.........",
    ".........vvvvVVVVvvvvVV.........",
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvllllvvvvcc........",
    "........ccvvvvVVVVvvvvcc........",
    "........CCvvvvVVVVvvvvCC........",
    "..........bbbbllllbbbb..........",
];

const BASE_BODY_DOWN = [
    "................................",
    "................................",
    "................................",
    "................................", // Shift down
    "...........RRRRRRRRRR...........",
    "..........RRrrrrrrrrRR..........",
    ".........RRrrrrrrrrrrRR.........",
    ".........RRrrrrrrrrrrRR.........",
    ".........RRrrrrrrrrrrRR...RR....", // Trail to RIGHT
    ".........ssSSSSSSssssss..RRR....",
    ".........sskksssskkssss..RR.....",
    ".........sswwsssswwssss.........",
    ".........ssssssssssssss.........",
    ".........ssssssssssssss.........",
    "..........ssssssssssss..........",
    "..........VVVVVVVVVVVV..........",
    ".........VVVVVVVVVVVVVV.........",
    ".........vvvvVVVVvvvvVV.........",
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvVVVVvvvvcc........",
    "........ccvvvvllllvvvvcc........",
    "........ccvvvvVVVVvvvvcc........",
    "........CCvvvvVVVVvvvvCC........",
    "..........bbbbllllbbbb..........",
];

// Frame 0: Left leg contact (Down)
const LEGS_0 = [
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

// Frame 1: Left leg support, Right leg lift (Down)
const LEGS_1 = [
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........CCCC....bbbb..........",
    "..........bbbb....bbbb..........",
    "..........bbbb..................",
    "..........BBBB..................",
    "................................",
    "................................"
];

// Frame 2: Right leg swing forward (Up)
const LEGS_2 = [
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

// Frame 3: Flight (Up)
const LEGS_3 = [
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

// Frame 4: Right leg contact (Down)
const LEGS_4 = [
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

// Frame 5: Right leg support, Left leg lift (Down)
const LEGS_5 = [
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........cccc....cccc..........",
    "..........bbbb....CCCC..........",
    "..........bbbb....bbbb..........",
    "..................bbbb..........",
    "..................BBBB..........",
    "................................",
    "................................"
];

// Frame 6: Left leg swing forward (Up)
const LEGS_6 = [
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

// Frame 7: Flight (Up)
const LEGS_7 = [
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

const combine = (body, legs) => {
    // Trim body to fit if needed, but here our bodies are correct length (23 and 24)
    // Actually BASE_BODY_UP is 23 lines. BASE_BODY_DOWN is 24 lines.
    // Legs are 9 lines.
    // Up: 23 + 9 = 32.
    // Down: 24 + 9 = 33. We need to trim 1 line from Down or legs.
    // Let's trim the last line of legs for Down frames.
    if (body.length === 24) {
        return [...body, ...legs.slice(0, 8)];
    }
    return [...body, ...legs];
};

export const PLAYER_RUN_FRAMES = [
    combine(BASE_BODY_DOWN, LEGS_0),
    combine(BASE_BODY_DOWN, LEGS_1),
    combine(BASE_BODY_UP, LEGS_2),
    combine(BASE_BODY_UP, LEGS_3),
    combine(BASE_BODY_DOWN, LEGS_4),
    combine(BASE_BODY_DOWN, LEGS_5),
    combine(BASE_BODY_UP, LEGS_6),
    combine(BASE_BODY_UP, LEGS_7)
];
