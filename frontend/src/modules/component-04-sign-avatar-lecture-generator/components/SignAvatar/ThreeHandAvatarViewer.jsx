import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Compass,
  Maximize2,
  Minimize2,
  RefreshCw,
  RotateCw,
  Sparkles,
  Sliders,
  Users,
  ZoomIn,
  ZoomOut,
  Layers,
  Activity,
  Palette,
  Tag,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
} from 'lucide-react';

// ============================================================================
// 1. PLAIN-ENGLISH ASL LEARNER GUIDE (ALL 26 LETTERS)
// Designed for ANY beginner to immediately understand handshape & palm direction
// ============================================================================
export const ASL_LEARNER_GUIDE = {
  A: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Make a firm fist with all 4 fingers curled down against your palm.',
      'Keep your thumb straight up, resting flat against the outer side of your index finger.',
      'Face your palm forward towards the viewer with wrist upright.',
    ],
    learnerTip: 'Keep thumb on the SIDE. If you wrap the thumb over the front of the fingers, it becomes "S"!',
    fingerStates: {
      thumb: 'Upright along index side',
      index: 'Curled in tight fist',
      middle: 'Curled in tight fist',
      ring: 'Curled in tight fist',
      pinky: 'Curled in tight fist',
    },
  },
  B: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Hold 4 fingers straight up, pressed tightly side-by-side.',
      'Tuck your thumb flat across the front of your palm.',
      'Keep your knuckles straight and hand vertical.',
    ],
    learnerTip: 'All 4 fingers must touch each other. Do not spread them apart!',
    fingerStates: {
      thumb: 'Folded flat across palm',
      index: 'Extended straight up',
      middle: 'Extended straight up',
      ring: 'Extended straight up',
      pinky: 'Extended straight up',
    },
  },
  C: {
    palmDirection: 'Facing Sideways / Inward',
    directionIcon: '➡️',
    difficulty: 'Beginner',
    steps: [
      'Curve all 4 fingers and your thumb into a smooth crescent arc.',
      'Make your hand look like the uppercase letter "C" (or like holding a cup).',
      'Turn your hand sideways so the curved opening is clearly visible.',
    ],
    learnerTip: 'The gap between your thumb and fingertips should stay open and rounded.',
    fingerStates: {
      thumb: 'Curved forming bottom of C',
      index: 'Curved forming top of C',
      middle: 'Curved forming top of C',
      ring: 'Curved forming top of C',
      pinky: 'Curved forming top of C',
    },
  },
  D: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Intermediate',
    steps: [
      'Point only your index finger straight up toward the ceiling.',
      'Touch the tip of your thumb to your middle, ring, and pinky fingertips.',
      'Form an "O" shape with your thumb and curled fingers beneath the upright index.',
    ],
    learnerTip: 'Only ONE finger points up. If both index and middle are up, that is "K" or "V"!',
    fingerStates: {
      thumb: 'Touches middle/ring/pinky tips',
      index: 'Points straight up',
      middle: 'Curled touching thumb',
      ring: 'Curled touching thumb',
      pinky: 'Curled touching thumb',
    },
  },
  E: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Intermediate',
    steps: [
      'Curl all 4 fingers tightly down at the middle knuckle.',
      'Tuck your thumb underneath your curved fingertips.',
      'Rest your fingernails right on top of the side edge of your thumb.',
    ],
    learnerTip: 'Fingertips form a "shelf" resting directly against the thumb.',
    fingerStates: {
      thumb: 'Tucked horizontally under fingers',
      index: 'Curled resting on thumb',
      middle: 'Curled resting on thumb',
      ring: 'Curled resting on thumb',
      pinky: 'Curled resting on thumb',
    },
  },
  F: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Touch the tip of your index finger to the tip of your thumb, forming an "O" ring.',
      'Extend your other 3 fingers (middle, ring, pinky) straight up, slightly spread.',
      'Face your palm forward like the classic "OK" hand sign.',
    ],
    learnerTip: 'Opposite of "D": in "F", 3 fingers are up while index and thumb touch!',
    fingerStates: {
      thumb: 'Touches index tip in a circle',
      index: 'Touches thumb tip in a circle',
      middle: 'Extended straight up',
      ring: 'Extended straight up',
      pinky: 'Extended straight up',
    },
  },
  G: {
    palmDirection: 'Facing Sideways / Inward',
    directionIcon: '➡️',
    difficulty: 'Intermediate',
    steps: [
      'Make a fist, then point your index finger horizontally to the side.',
      'Extend your thumb parallel to your index finger with a 1-inch gap.',
      'Keep your other 3 fingers curled tightly into your palm.',
    ],
    learnerTip: 'Think of pinching an inch. View from the side profile for maximum clarity.',
    fingerStates: {
      thumb: 'Horizontal parallel to index',
      index: 'Horizontal pointing sideways',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  H: {
    palmDirection: 'Facing Sideways / Inward',
    directionIcon: '➡️',
    difficulty: 'Intermediate',
    steps: [
      'Like "G", but extend BOTH your index and middle fingers horizontally side-by-side.',
      'Tuck your thumb parallel behind or under your middle finger.',
      'Keep ring and pinky curled into your palm.',
    ],
    learnerTip: 'Index and middle stay tightly together like a double-barrel pointing sideways.',
    fingerStates: {
      thumb: 'Tucked parallel under fingers',
      index: 'Horizontal touching middle',
      middle: 'Horizontal touching index',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  I: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Make a fist with your thumb wrapped across your index, middle, and ring fingers.',
      'Point only your pinky finger straight up into the air.',
      'Hold your hand steady facing the viewer.',
    ],
    learnerTip: 'Only the pinky stands tall. Keep the other 3 fingers locked down with thumb.',
    fingerStates: {
      thumb: 'Locked across curled fingers',
      index: 'Curled in fist',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Points straight up',
    },
  },
  J: {
    palmDirection: 'Forward, then sweeping inward',
    directionIcon: '🔄',
    difficulty: 'Dynamic Motion',
    steps: [
      'Start with the "I" handshape (pinky pointing straight up).',
      'Trace the letter "J" in the air by curving your pinky down and hooking inward.',
      'End with your palm facing towards yourself.',
    ],
    learnerTip: '"J" is one of only two moving letters in the ASL alphabet! Smooth dynamic swoop.',
    fingerStates: {
      thumb: 'Locked across curled fingers',
      index: 'Curled in fist',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Traces J curve in the air',
    },
  },
  K: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Intermediate',
    steps: [
      'Hold your index finger pointing straight up.',
      'Angle your middle finger forward at about 45 degrees.',
      'Place the tip of your thumb right between index and middle, resting on the middle knuckle.',
    ],
    learnerTip: 'Thumb props up the middle finger like the slanted diagonal leg of a "K"!',
    fingerStates: {
      thumb: 'Between index and middle',
      index: 'Points straight up',
      middle: 'Angled forward at 45°',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  L: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Extend your index finger straight up.',
      'Extend your thumb out horizontally at a 90-degree right angle.',
      'Curl middle, ring, and pinky into your palm forming a clear letter "L".',
    ],
    learnerTip: 'The hand directly spells out an uppercase "L". Very easy to remember!',
    fingerStates: {
      thumb: 'Horizontal at 90° right angle',
      index: 'Points straight up',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  M: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬇️',
    difficulty: 'Intermediate',
    steps: [
      'Tuck your thumb across your palm under your first three fingers.',
      'Drape your index, middle, and ring fingers down over your thumb.',
      'Thumb tip peeks out between ring and pinky fingers.',
    ],
    learnerTip: '"M" has THREE fingers resting on the thumb (Index, Middle, Ring). Count the 3 humps of M!',
    fingerStates: {
      thumb: 'Tucked under 3 fingers',
      index: 'Draped over thumb',
      middle: 'Draped over thumb',
      ring: 'Draped over thumb',
      pinky: 'Curled in fist',
    },
  },
  N: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬇️',
    difficulty: 'Intermediate',
    steps: [
      'Tuck your thumb across your palm under your first TWO fingers.',
      'Drape your index and middle fingers down over your thumb.',
      'Thumb tip peeks out between middle and ring fingers.',
    ],
    learnerTip: '"N" has TWO fingers resting on thumb (Index, Middle). Contrast with "M" (3 fingers)!',
    fingerStates: {
      thumb: 'Tucked under 2 fingers',
      index: 'Draped over thumb',
      middle: 'Draped over thumb',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  O: {
    palmDirection: 'Facing Viewer / Angled',
    directionIcon: '↗️',
    difficulty: 'Beginner',
    steps: [
      'Curve all 4 fingers forward and down.',
      'Touch all four fingertips to the tip of your thumb.',
      'Form a smooth hollow circle "O" shape.',
    ],
    learnerTip: 'Unlike "C" (which is open), in "O" the fingertips firmly touch the thumb tip!',
    fingerStates: {
      thumb: 'Touches all 4 fingertips',
      index: 'Curved touching thumb',
      middle: 'Curved touching thumb',
      ring: 'Curved touching thumb',
      pinky: 'Curved touching thumb',
    },
  },
  P: {
    palmDirection: 'Facing Downward toward floor',
    directionIcon: '⬇️',
    difficulty: 'Intermediate',
    steps: [
      'Form the "K" handshape (index up, middle angled, thumb between).',
      'Tilt your entire wrist down 90 degrees so index points forward/downward.',
      'Middle finger drops down pointing straight at the floor.',
    ],
    learnerTip: '"P" is simply the letter "K" pointing down at the ground!',
    fingerStates: {
      thumb: 'Props middle finger downward',
      index: 'Points forward/downward',
      middle: 'Points straight downward',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  Q: {
    palmDirection: 'Facing Downward toward floor',
    directionIcon: '⬇️',
    difficulty: 'Intermediate',
    steps: [
      'Form the "G" handshape (thumb and index parallel profile).',
      'Point your wrist and fingers directly downward toward the floor.',
      'Keep thumb and index separated with a 1-inch pinch gap.',
    ],
    learnerTip: '"Q" is simply the letter "G" pointing downwards!',
    fingerStates: {
      thumb: 'Points downward parallel to index',
      index: 'Points downward parallel to thumb',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  R: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Extend index and middle fingers vertically.',
      'Cross your middle finger over in front of your index finger (the "good luck / crossed fingers" sign).',
      'Curl ring and pinky fingers down and hold them with your thumb.',
    ],
    learnerTip: 'Think "R" for "cRossed fingers" (Good luck sign)!',
    fingerStates: {
      thumb: 'Holds ring and pinky',
      index: 'Straight up behind middle',
      middle: 'Crossed over index in front',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  S: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Make a firm, tight fist with all 4 fingers curled down.',
      'Wrap your thumb directly across the front of your curled fingers.',
      'Keep knuckles upright facing forward.',
    ],
    learnerTip: 'Crucial distinction: "S" wraps thumb ACROSS the fingers; "A" leaves thumb on the side!',
    fingerStates: {
      thumb: 'Wrapped across front of fingers',
      index: 'Curled in tight fist',
      middle: 'Curled in tight fist',
      ring: 'Curled in tight fist',
      pinky: 'Curled in tight fist',
    },
  },
  T: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Intermediate',
    steps: [
      'Tuck your thumb between your index and middle fingers.',
      'Curl all 4 fingers into a fist over your thumb.',
      'The tip of your thumb pops out between your index and middle knuckles.',
    ],
    learnerTip: '"T" has ONE finger (index) draped over the thumb. Remember: M=3, N=2, T=1!',
    fingerStates: {
      thumb: 'Peeks between index & middle',
      index: 'Draped over thumb',
      middle: 'Curled beside thumb',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  U: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Extend index and middle fingers straight up.',
      'Press index and middle fingers tightly together side-by-side.',
      'Curl ring and pinky fingers down and tuck them with your thumb.',
    ],
    learnerTip: 'Keep index and middle tightly pressed together. If they spread apart, it becomes "V"!',
    fingerStates: {
      thumb: 'Holds ring and pinky down',
      index: 'Extended touching middle',
      middle: 'Extended touching index',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  V: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Extend index and middle fingers straight up.',
      'Spread them apart in a wide "V" shape (classic Peace Sign).',
      'Curl ring and pinky fingers down and hold them with your thumb.',
    ],
    learnerTip: 'Hand forms the letter "V" or Peace sign. Very recognizable!',
    fingerStates: {
      thumb: 'Holds ring and pinky down',
      index: 'Extended angled left',
      middle: 'Extended angled right',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  W: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Extend index, middle, and ring fingers straight up, spread apart.',
      'Touch the tip of your thumb to your pinky fingernail across your palm.',
      'Face your palm forward towards the viewer.',
    ],
    learnerTip: 'Three upright spread fingers form the three peaks of the letter "W".',
    fingerStates: {
      thumb: 'Pinches pinky tip down',
      index: 'Extended upright',
      middle: 'Extended upright',
      ring: 'Extended upright',
      pinky: 'Held down by thumb',
    },
  },
  X: {
    palmDirection: 'Facing Viewer / Angled',
    directionIcon: '↗️',
    difficulty: 'Intermediate',
    steps: [
      'Make a fist with middle, ring, and pinky curled down and thumb tucked.',
      'Extend your index finger and bend it at the second knuckle into a sharp hook.',
      'Like Captain Hook\'s pirate hook.',
    ],
    learnerTip: 'Think "X marks the spot" with a hooked pirate index finger!',
    fingerStates: {
      thumb: 'Tucked across fist',
      index: 'Bent at middle knuckle in a hook',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
  Y: {
    palmDirection: 'Facing Viewer (Forward)',
    directionIcon: '⬆️',
    difficulty: 'Beginner',
    steps: [
      'Extend your thumb out to one side and your pinky finger out to the other side.',
      'Curl your middle 3 fingers (index, middle, ring) tightly into your palm.',
      'Forms the Hawaiian "Shaka / Hang Loose" or telephone sign.',
    ],
    learnerTip: 'Thumb and pinky point outwards forming the two top arms of the letter "Y".',
    fingerStates: {
      thumb: 'Extended out sideways',
      index: 'Curled in fist',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Extended out sideways',
    },
  },
  Z: {
    palmDirection: 'Facing Viewer, tracing in air',
    directionIcon: '⚡',
    difficulty: 'Dynamic Motion',
    steps: [
      'Point your index finger forward.',
      'Curl middle, ring, pinky into your palm and tuck them with your thumb.',
      'Trace the letter "Z" in the air: horizontal line right, diagonal down-left, horizontal right.',
    ],
    learnerTip: '"Z" is dynamic! Draw the zigzag stroke in the air with your index finger.',
    fingerStates: {
      thumb: 'Holds curled fingers',
      index: 'Points out tracing Z stroke',
      middle: 'Curled in fist',
      ring: 'Curled in fist',
      pinky: 'Curled in fist',
    },
  },
};

// ============================================================================
// 2. KINEMATIC POSE DEFINITIONS FOR ALL 26 LETTERS
// Centered at (0, 0, 0) for HERO HAND FOCUS
// ============================================================================
const ASL_3D_POSE_MAP = {
  A: {
    thumb: { mcpCurl: 0.1, pipCurl: 0.05, dipCurl: 0.05, spread: 0.15, oppose: 0.0 },
    index: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  B: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.3, oppose: 0.5 },
    index: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: -0.04 },
    middle: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: -0.01 },
    ring: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.02 },
    pinky: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.04 },
    wrist: { x: 0.02, y: 0.0, z: -0.02 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  C: {
    thumb: { mcpCurl: 0.45, pipCurl: 0.5, dipCurl: 0.45, spread: 0.35, oppose: 0.4 },
    index: { mcpCurl: 0.7, pipCurl: 0.85, dipCurl: 0.65, spread: -0.03 },
    middle: { mcpCurl: 0.7, pipCurl: 0.85, dipCurl: 0.65, spread: 0.0 },
    ring: { mcpCurl: 0.7, pipCurl: 0.85, dipCurl: 0.65, spread: 0.03 },
    pinky: { mcpCurl: 0.7, pipCurl: 0.85, dipCurl: 0.65, spread: 0.06 },
    wrist: { x: 0.0, y: -0.45, z: 0.0 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  D: {
    thumb: { mcpCurl: 0.7, pipCurl: 0.75, dipCurl: 0.7, spread: 0.1, oppose: 0.4 },
    index: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.0 },
    middle: { mcpCurl: 1.35, pipCurl: 1.5, dipCurl: 1.2, spread: 0.0 },
    ring: { mcpCurl: 1.45, pipCurl: 1.6, dipCurl: 1.3, spread: 0.02 },
    pinky: { mcpCurl: 1.55, pipCurl: 1.7, dipCurl: 1.4, spread: 0.04 },
    wrist: { x: 0.05, y: -0.05, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  E: {
    thumb: { mcpCurl: 0.95, pipCurl: 1.0, dipCurl: 0.85, spread: -0.2, oppose: 0.6 },
    index: { mcpCurl: 1.45, pipCurl: 1.6, dipCurl: 1.4, spread: -0.02 },
    middle: { mcpCurl: 1.45, pipCurl: 1.6, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.45, pipCurl: 1.6, dipCurl: 1.4, spread: 0.02 },
    pinky: { mcpCurl: 1.45, pipCurl: 1.6, dipCurl: 1.4, spread: 0.04 },
    wrist: { x: 0.08, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  F: {
    thumb: { mcpCurl: 0.65, pipCurl: 0.7, dipCurl: 0.6, spread: 0.15, oppose: 0.45 },
    index: { mcpCurl: 1.05, pipCurl: 1.3, dipCurl: 1.1, spread: -0.02 },
    middle: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.02 },
    ring: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.08 },
    pinky: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.15 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  G: {
    thumb: { mcpCurl: 0.1, pipCurl: 0.1, dipCurl: 0.1, spread: 0.25, oppose: 0.0 },
    index: { mcpCurl: 0.05, pipCurl: 0.05, dipCurl: 0.05, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.0, y: -0.65, z: 0.65 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  H: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.1, oppose: 0.3 },
    index: { mcpCurl: 0.05, pipCurl: 0.05, dipCurl: 0.05, spread: -0.03 },
    middle: { mcpCurl: 0.05, pipCurl: 0.05, dipCurl: 0.05, spread: -0.02 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.0, y: -0.6, z: 0.6 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  I: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.15, oppose: 0.3 },
    index: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.05 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  J: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.15, oppose: 0.3 },
    index: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.05 },
    wrist: { x: 0.25, y: -0.35, z: 0.25 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  K: {
    thumb: { mcpCurl: 0.15, pipCurl: 0.15, dipCurl: 0.15, spread: 0.35, oppose: 0.1 },
    index: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: -0.08 },
    middle: { mcpCurl: 0.3, pipCurl: 0.2, dipCurl: 0.1, spread: 0.12 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  L: {
    thumb: { mcpCurl: 0.02, pipCurl: 0.02, dipCurl: 0.02, spread: 0.65, oppose: 0.0 },
    index: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  M: {
    thumb: { mcpCurl: 0.85, pipCurl: 0.9, dipCurl: 0.7, spread: -0.2, oppose: 0.5 },
    index: { mcpCurl: 1.5, pipCurl: 1.6, dipCurl: 1.3, spread: -0.02 },
    middle: { mcpCurl: 1.5, pipCurl: 1.6, dipCurl: 1.3, spread: 0.0 },
    ring: { mcpCurl: 1.5, pipCurl: 1.6, dipCurl: 1.3, spread: 0.02 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.04 },
    wrist: { x: 0.1, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  N: {
    thumb: { mcpCurl: 0.85, pipCurl: 0.9, dipCurl: 0.7, spread: -0.15, oppose: 0.4 },
    index: { mcpCurl: 1.5, pipCurl: 1.6, dipCurl: 1.3, spread: -0.02 },
    middle: { mcpCurl: 1.5, pipCurl: 1.6, dipCurl: 1.3, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.02 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.04 },
    wrist: { x: 0.1, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  O: {
    thumb: { mcpCurl: 0.6, pipCurl: 0.65, dipCurl: 0.6, spread: 0.25, oppose: 0.45 },
    index: { mcpCurl: 0.85, pipCurl: 1.05, dipCurl: 0.8, spread: -0.02 },
    middle: { mcpCurl: 0.85, pipCurl: 1.05, dipCurl: 0.8, spread: 0.0 },
    ring: { mcpCurl: 0.85, pipCurl: 1.05, dipCurl: 0.8, spread: 0.02 },
    pinky: { mcpCurl: 0.85, pipCurl: 1.05, dipCurl: 0.8, spread: 0.04 },
    wrist: { x: 0.05, y: -0.25, z: 0.0 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  P: {
    thumb: { mcpCurl: 0.2, pipCurl: 0.2, dipCurl: 0.2, spread: 0.35, oppose: 0.1 },
    index: { mcpCurl: 0.05, pipCurl: 0.05, dipCurl: 0.05, spread: -0.06 },
    middle: { mcpCurl: 0.3, pipCurl: 0.2, dipCurl: 0.1, spread: 0.1 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.75, y: -0.3, z: 0.45 },
    handOffset: { x: 0.0, y: 0.1, z: 0.0 },
  },
  Q: {
    thumb: { mcpCurl: 0.15, pipCurl: 0.15, dipCurl: 0.15, spread: 0.25, oppose: 0.0 },
    index: { mcpCurl: 0.1, pipCurl: 0.1, dipCurl: 0.1, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.85, y: -0.4, z: 0.5 },
    handOffset: { x: 0.0, y: 0.1, z: 0.0 },
  },
  R: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.15, oppose: 0.3 },
    index: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.08 },
    middle: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: -0.08 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  S: {
    thumb: { mcpCurl: 0.2, pipCurl: 0.3, dipCurl: 0.2, spread: -0.2, oppose: 0.4 },
    index: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.08, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  T: {
    thumb: { mcpCurl: 0.1, pipCurl: 0.1, dipCurl: 0.1, spread: -0.05, oppose: 0.2 },
    index: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.08, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  U: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.15, oppose: 0.3 },
    index: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: -0.02 },
    middle: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: -0.01 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  V: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.15, oppose: 0.3 },
    index: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: -0.16 },
    middle: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.16 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  W: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.15, oppose: 0.3 },
    index: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: -0.18 },
    middle: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.0 },
    ring: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.18 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  X: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.15, oppose: 0.3 },
    index: { mcpCurl: 0.8, pipCurl: 1.2, dipCurl: 0.9, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.08, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  Y: {
    thumb: { mcpCurl: 0.02, pipCurl: 0.02, dipCurl: 0.02, spread: 0.65, oppose: 0.0 },
    index: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 0.02, pipCurl: 0.05, dipCurl: 0.02, spread: 0.2 },
    wrist: { x: 0.05, y: 0.0, z: -0.05 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
  Z: {
    thumb: { mcpCurl: 0.8, pipCurl: 0.9, dipCurl: 0.8, spread: -0.15, oppose: 0.3 },
    index: { mcpCurl: 0.05, pipCurl: 0.05, dipCurl: 0.05, spread: 0.0 },
    middle: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    ring: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    pinky: { mcpCurl: 1.57, pipCurl: 1.8, dipCurl: 1.4, spread: 0.0 },
    wrist: { x: 0.15, y: -0.15, z: 0.15 },
    handOffset: { x: 0.0, y: 0.0, z: 0.0 },
  },
};

// ============================================================================
// 3. COLOR DEFINITIONS FOR BEGINNER COLOR-ASSIST MODE
// Each finger gets a distinct high-contrast educational color
// ============================================================================
const FINGER_PALETTE = {
  thumb: { hex: '#f59e0b', threeColor: 0xf59e0b, label: 'Thumb', icon: '👍' },
  index: { hex: '#06b6d4', threeColor: 0x06b6d4, label: 'Index', icon: '☝️' },
  middle: { hex: '#10b981', threeColor: 0x10b981, label: 'Middle', icon: '🖕' },
  ring: { hex: '#8b5cf6', threeColor: 0x8b5cf6, label: 'Ring', icon: '💍' },
  pinky: { hex: '#f43f5e', threeColor: 0xf43f5e, label: 'Pinky', icon: '🤙' },
};

// Helper: Create a bone segment with knuckle joint & subtle skin fold ring
const createBoneSegment = (length, radius, boneMat, knuckleMat, ringMat, isKnuckle = true) => {
  const group = new THREE.Group();

  // Cylinder phalanx bone
  const boneGeom = new THREE.CylinderGeometry(radius * 0.9, radius * 1.05, length, 16);
  boneGeom.translate(0, length / 2, 0);
  const boneMesh = new THREE.Mesh(boneGeom, boneMat);
  boneMesh.castShadow = true;
  boneMesh.receiveShadow = true;
  group.add(boneMesh);

  // Knuckle sphere at base
  if (isKnuckle) {
    const knuckleGeom = new THREE.SphereGeometry(radius * 1.25, 16, 16);
    const knuckleMesh = new THREE.Mesh(knuckleGeom, knuckleMat);
    knuckleMesh.castShadow = true;
    group.add(knuckleMesh);

    // Subtle joint crease ring
    const ringGeom = new THREE.TorusGeometry(radius * 1.28, radius * 0.12, 8, 16);
    ringGeom.rotateX(Math.PI / 2);
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    group.add(ringMesh);
  }

  return { group, boneMesh, length };
};

// Helper: Build articulated 3D Finger with 3 hierarchical joints + tracking tip anchor
const createArticulatedFinger = (fingerKey, lengths, radii, mats) => {
  const mcpGroup = new THREE.Group();
  const pipGroup = new THREE.Group();
  const dipGroup = new THREE.Group();

  // 1. Proximal Phalanx
  const proximal = createBoneSegment(lengths.proximal, radii.proximal, mats.bone, mats.knuckle, mats.ring, true);
  mcpGroup.add(proximal.group);

  // 2. Intermediate Phalanx
  pipGroup.position.y = lengths.proximal;
  mcpGroup.add(pipGroup);
  const intermediate = createBoneSegment(lengths.intermediate, radii.intermediate, mats.bone, mats.knuckle, mats.ring, true);
  pipGroup.add(intermediate.group);

  // 3. Distal Phalanx
  dipGroup.position.y = lengths.intermediate;
  pipGroup.add(dipGroup);
  const distal = createBoneSegment(lengths.distal, radii.distal, mats.bone, mats.knuckle, mats.ring, true);
  dipGroup.add(distal.group);

  // Fingertip Dome (Pulp / Pad on +Z front side)
  const tipGeom = new THREE.SphereGeometry(radii.distal * 0.96, 16, 16);
  tipGeom.translate(0, lengths.distal, 0);
  const tipMesh = new THREE.Mesh(tipGeom, mats.bone);
  dipGroup.add(tipMesh);

  // Fingernail plate on posterior/back side (-Z)
  const nailGeom = new THREE.BoxGeometry(radii.distal * 1.2, lengths.distal * 0.45, radii.distal * 0.22);
  nailGeom.translate(0, lengths.distal * 0.72, -radii.distal * 0.85);
  const nailMesh = new THREE.Mesh(nailGeom, mats.nail);
  dipGroup.add(nailMesh);

  // Tip anchor for real-time 3D tracking labels
  const tipAnchor = new THREE.Object3D();
  tipAnchor.position.set(0, lengths.distal * 1.1, 0);
  dipGroup.add(tipAnchor);

  // Current & target pose for smooth organic lerp interpolation
  const current = { mcpCurl: 0, pipCurl: 0, dipCurl: 0, spread: 0, oppose: 0 };
  const target = { mcpCurl: 0, pipCurl: 0, dipCurl: 0, spread: 0, oppose: 0 };

  return {
    fingerKey,
    mcpGroup,
    pipGroup,
    dipGroup,
    tipAnchor,
    setTargetPose: (data) => {
      target.mcpCurl = data.mcpCurl ?? 0;
      target.pipCurl = data.pipCurl ?? 0;
      target.dipCurl = data.dipCurl ?? 0;
      target.spread = data.spread ?? 0;
      target.oppose = data.oppose ?? 0;
    },
    updateLerp: (factor) => {
      current.mcpCurl = THREE.MathUtils.lerp(current.mcpCurl, target.mcpCurl, factor);
      current.pipCurl = THREE.MathUtils.lerp(current.pipCurl, target.pipCurl, factor);
      current.dipCurl = THREE.MathUtils.lerp(current.dipCurl, target.dipCurl, factor);
      current.spread = THREE.MathUtils.lerp(current.spread, target.spread, factor);
      current.oppose = THREE.MathUtils.lerp(current.oppose, target.oppose, factor);

      mcpGroup.rotation.x = current.mcpCurl;
      pipGroup.rotation.x = current.pipCurl;
      dipGroup.rotation.x = current.dipCurl;
      mcpGroup.rotation.z = current.spread;
      mcpGroup.rotation.y = current.oppose;
    },
  };
};

// Build complete 3D Anatomical Hand with Hero Framing
const create3DHand = (side = 'right', viewMode = 'realistic', colorAssisted = true) => {
  const isLeft = side === 'left';
  const handRoot = new THREE.Group();
  handRoot.name = `hand_${side}`;

  const isSkeleton = viewMode === 'skeleton';

  // Base materials: warm natural skin
  const naturalSkinMat = new THREE.MeshStandardMaterial({
    color: 0xdfa785,
    roughness: 0.45,
    metalness: 0.05,
  });
  const naturalKnuckleMat = new THREE.MeshStandardMaterial({
    color: 0xc47b59,
    roughness: 0.4,
    metalness: 0.08,
  });
  const naturalRingMat = new THREE.MeshStandardMaterial({
    color: 0x9b5436,
    roughness: 0.35,
    metalness: 0.15,
  });
  const naturalNailMat = new THREE.MeshStandardMaterial({
    color: 0xfbe4d8,
    roughness: 0.25,
    metalness: 0.08,
  });

  const skeletonBoneMat = new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.25,
    metalness: 0.7,
    emissive: 0x047857,
    emissiveIntensity: 0.35,
  });
  const skeletonKnuckleMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.15,
    metalness: 0.8,
    emissive: 0x10b981,
    emissiveIntensity: 0.6,
  });
  const skeletonRingMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    roughness: 0.2,
    metalness: 0.5,
  });

  // Finger specific material resolver
  const getFingerMats = (key) => {
    if (isSkeleton) {
      return {
        bone: skeletonBoneMat,
        knuckle: skeletonKnuckleMat,
        ring: skeletonRingMat,
        nail: skeletonRingMat,
      };
    }
    if (colorAssisted) {
      const p = FINGER_PALETTE[key];
      return {
        bone: new THREE.MeshStandardMaterial({
          color: p.threeColor,
          roughness: 0.35,
          metalness: 0.1,
          emissive: p.threeColor,
          emissiveIntensity: 0.18,
        }),
        knuckle: new THREE.MeshStandardMaterial({
          color: p.threeColor,
          roughness: 0.25,
          metalness: 0.2,
          emissive: p.threeColor,
          emissiveIntensity: 0.35,
        }),
        ring: new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.2,
          metalness: 0.3,
        }),
        nail: new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.1,
          metalness: 0.2,
        }),
      };
    }
    return {
      bone: naturalSkinMat,
      knuckle: naturalKnuckleMat,
      ring: naturalRingMat,
      nail: naturalNailMat,
    };
  };

  // Palm material: Warm natural skin in both modes so hand is appealing and realistic
  const palmMat = isSkeleton
    ? new THREE.MeshStandardMaterial({
        color: 0x064e3b,
        roughness: 0.3,
        metalness: 0.6,
        emissive: 0x064e3b,
        emissiveIntensity: 0.25,
      })
    : new THREE.MeshStandardMaterial({
        color: 0xdfa785,
        roughness: 0.45,
        metalness: 0.05,
      });

  // Sleeve Cuff
  const cuffMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.6,
    metalness: 0.2,
  });
  const cuffStripeMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    roughness: 0.2,
    emissive: 0x10b981,
    emissiveIntensity: 0.6,
  });

  // 1. Forearm Sleeve Cuff & Wrist
  const wristGroup = new THREE.Group();
  wristGroup.position.set(0, -0.4, 0);

  const cuffGeom = new THREE.CylinderGeometry(0.3, 0.36, 0.45, 20);
  cuffGeom.translate(0, -0.22, 0);
  const cuffMesh = new THREE.Mesh(cuffGeom, cuffMat);
  wristGroup.add(cuffMesh);

  const stripeGeom = new THREE.TorusGeometry(0.32, 0.025, 8, 24);
  stripeGeom.rotateX(Math.PI / 2);
  stripeGeom.translate(0, -0.08, 0);
  wristGroup.add(new THREE.Mesh(stripeGeom, cuffStripeMat));

  const wristBall = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), naturalSkinMat);
  wristGroup.add(wristBall);
  handRoot.add(wristGroup);

  // 2. Sculpted Anatomical Palm Mesh
  const palmGeom = new THREE.BoxGeometry(0.72, 0.72, 0.24, 4, 4, 3);
  palmGeom.translate(0, 0.22, 0);
  const palmMesh = new THREE.Mesh(palmGeom, palmMat);
  palmMesh.castShadow = true;
  palmMesh.receiveShadow = true;
  handRoot.add(palmMesh);

  // Thenar (Thumb muscle pad on +Z anterior palm side)
  const thenarGeom = new THREE.SphereGeometry(0.24, 16, 16);
  thenarGeom.scale(1.1, 1.3, 0.85);
  thenarGeom.translate(isLeft ? 0.24 : -0.24, 0.1, 0.08);
  handRoot.add(new THREE.Mesh(thenarGeom, palmMat));

  // 3. Articulated 5 Fingers
  const thumb = createArticulatedFinger(
    'thumb',
    { proximal: 0.24, intermediate: 0.22, distal: 0.2 },
    { proximal: 0.095, intermediate: 0.085, distal: 0.075 },
    getFingerMats('thumb')
  );
  thumb.mcpGroup.position.set(isLeft ? 0.32 : -0.32, 0.05, 0.06);
  thumb.mcpGroup.rotation.z = isLeft ? -0.55 : 0.55;
  thumb.mcpGroup.rotation.y = isLeft ? 0.35 : -0.35;
  handRoot.add(thumb.mcpGroup);

  const index = createArticulatedFinger(
    'index',
    { proximal: 0.34, intermediate: 0.25, distal: 0.2 },
    { proximal: 0.085, intermediate: 0.075, distal: 0.065 },
    getFingerMats('index')
  );
  index.mcpGroup.position.set(isLeft ? 0.21 : -0.21, 0.58, 0.02);
  handRoot.add(index.mcpGroup);

  const middle = createArticulatedFinger(
    'middle',
    { proximal: 0.37, intermediate: 0.28, distal: 0.21 },
    { proximal: 0.088, intermediate: 0.078, distal: 0.068 },
    getFingerMats('middle')
  );
  middle.mcpGroup.position.set(isLeft ? 0.07 : -0.07, 0.6, 0.0);
  handRoot.add(middle.mcpGroup);

  const ring = createArticulatedFinger(
    'ring',
    { proximal: 0.33, intermediate: 0.24, distal: 0.19 },
    { proximal: 0.082, intermediate: 0.072, distal: 0.062 },
    getFingerMats('ring')
  );
  ring.mcpGroup.position.set(isLeft ? -0.08 : 0.08, 0.57, -0.02);
  handRoot.add(ring.mcpGroup);

  const pinky = createArticulatedFinger(
    'pinky',
    { proximal: 0.26, intermediate: 0.19, distal: 0.16 },
    { proximal: 0.072, intermediate: 0.062, distal: 0.055 },
    getFingerMats('pinky')
  );
  pinky.mcpGroup.position.set(isLeft ? -0.22 : 0.22, 0.5, -0.04);
  handRoot.add(pinky.mcpGroup);

  if (isLeft) {
    handRoot.scale.x = -1;
  }

  // Wrist smooth target
  const currentWrist = { x: 0, y: 0, z: 0 };
  const targetWrist = { x: 0, y: 0, z: 0 };

  return {
    handRoot,
    fingers: { thumb, index, middle, ring, pinky },
    setPose: (poseData) => {
      if (!poseData) return;
      const getSidePose = (fingerPose) => (
        isLeft
          ? {
              ...fingerPose,
              spread: -(fingerPose.spread ?? 0),
              oppose: -(fingerPose.oppose ?? 0),
            }
          : fingerPose
      );

      thumb.setTargetPose(getSidePose(poseData.thumb));
      index.setTargetPose(getSidePose(poseData.index));
      middle.setTargetPose(getSidePose(poseData.middle));
      ring.setTargetPose(getSidePose(poseData.ring));
      pinky.setTargetPose(getSidePose(poseData.pinky));

      if (poseData.wrist) {
        targetWrist.x = poseData.wrist.x;
        targetWrist.y = (isLeft ? -1 : 1) * poseData.wrist.y;
        targetWrist.z = (isLeft ? -1 : 1) * poseData.wrist.z;
      }
    },
    updateLerp: (factor) => {
      thumb.updateLerp(factor);
      index.updateLerp(factor);
      middle.updateLerp(factor);
      ring.updateLerp(factor);
      pinky.updateLerp(factor);

      currentWrist.x = THREE.MathUtils.lerp(currentWrist.x, targetWrist.x, factor);
      currentWrist.y = THREE.MathUtils.lerp(currentWrist.y, targetWrist.y, factor);
      currentWrist.z = THREE.MathUtils.lerp(currentWrist.z, targetWrist.z, factor);

      handRoot.rotation.x = currentWrist.x;
      handRoot.rotation.y = currentWrist.y;
      handRoot.rotation.z = currentWrist.z;
    },
  };
};

// ============================================================================
// 4. MAIN THREE.JS 3D HAND AVATAR COMPONENT
// ============================================================================
const ThreeHandAvatarViewer = forwardRef((
  {
    activeLetter = 'A',
    speed = 'normal',
    isPlaying = false,
    useBothHands = false,
    viewMode = 'realistic', // 'realistic' | 'skeleton' | 'hud'
    onAngleChange = null,
    isAutoRotate = null,
    onAutoRotateChange = null,
  },
  ref
) => {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  // Three.js instances
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const rightHandRef = useRef(null);
  const leftHandRef = useRef(null);
  const animFrameId = useRef(null);

  // Floating HTML tracking labels direct DOM refs (0-overhead 60 FPS tracking)
  const labelRefs = {
    thumb: useRef(null),
    index: useRef(null),
    middle: useRef(null),
    ring: useRef(null),
    pinky: useRef(null),
  };

  // Viewport & Learner Controls State
  const [azimuthDeg, setAzimuthDeg] = useState(0);
  const [elevationDeg, setElevationDeg] = useState(0);
  const [internalTurntable, setInternalTurntable] = useState(false);
  const isAutoTurntable = isAutoRotate !== null ? isAutoRotate : internalTurntable;
  const isAutoTurntableRef = useRef(isAutoTurntable);

  const handleToggleTurntable = () => {
    const nextVal = !isAutoTurntable;
    setInternalTurntable(nextVal);
    if (onAutoRotateChange) onAutoRotateChange(nextVal);
  };

  const handleStopTurntable = () => {
    setInternalTurntable(false);
    if (onAutoRotateChange) onAutoRotateChange(false);
  };

  useEffect(() => {
    isAutoTurntableRef.current = isAutoTurntable;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoTurntable;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [isAutoTurntable]);

  const [cameraPreset, setCameraPreset] = useState('front');
  const [colorAssisted, setColorAssisted] = useState(true); // DEFAULT TRUE FOR BEGINNER CLARITY!
  const [showFingerLabels, setShowFingerLabels] = useState(true); // DEFAULT TRUE FOR BEGINNER CLARITY!
  const [isGuideOpen, setIsGuideOpen] = useState(false); // Collapsed by default so hand has 100% unobstructed view!

  const showFingerLabelsRef = useRef(showFingerLabels);
  useEffect(() => {
    showFingerLabelsRef.current = showFingerLabels;
  }, [showFingerLabels]);

  // Active letter metadata
  const activeChar = (activeLetter || 'A').toUpperCase();
  const currentGuide = ASL_LEARNER_GUIDE[activeChar] || ASL_LEARNER_GUIDE['A'];
  const currentPose = ASL_3D_POSE_MAP[activeChar] || ASL_3D_POSE_MAP['A'];

  // Expose API to parent for video recording & rotation control
  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    captureFrameDataUrl: () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return canvasRef.current?.toDataURL('image/png');
      }
      return null;
    },
    resetCamera: () => handleCameraPreset('front'),
    stopRotation: handleStopTurntable,
    startRotation: () => {
      setInternalTurntable(true);
      if (onAutoRotateChange) onAutoRotateChange(true);
    },
    toggleRotation: handleToggleTurntable,
    isRotating: () => isAutoTurntable,
  }));

  // Camera presets optimized for hand clarity
  const handleCameraPreset = (preset) => {
    setCameraPreset(preset);
    handleStopTurntable();
    if (!controlsRef.current || !cameraRef.current) return;

    const controls = controlsRef.current;
    const camera = cameraRef.current;

    switch (preset) {
      case 'front':
        camera.position.set(0, 0.4, 3.15);
        controls.target.set(0, 0.4, 0);
        break;
      case 'angle45':
        camera.position.set(2.0, 0.6, 2.35);
        controls.target.set(0, 0.4, 0);
        break;
      case 'side90':
        camera.position.set(3.1, 0.4, 0.0);
        controls.target.set(0, 0.4, 0);
        break;
      case 'firstperson':
        // Learner Mirror View: as seen looking down at your own right hand from the back!
        camera.position.set(-0.15, 1.45, -2.3);
        controls.target.set(0, 0.35, 0);
        break;
      case 'closeup':
        camera.position.set(0.0, 0.48, 1.95);
        controls.target.set(0, 0.48, 0);
        break;
      default:
        break;
    }
    controls.update();
  };

  // Zoom controls
  const handleZoom = (delta) => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
    const newLen = Math.max(1.3, Math.min(5.5, dir.length() + delta));
    dir.setLength(newLen);
    camera.position.addVectors(controls.target, dir);
    controls.update();
  };

  // 1. Scene & WebGL Initialization
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 560;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera framed squarely on hand at (0, 0.4, 0) with distance 3.15
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 3.15);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 1.3;
    controls.maxDistance = 5.5;
    controls.target.set(0, 0.4, 0);
    controlsRef.current = controls;

    controls.addEventListener('change', () => {
      const spherical = new THREE.Spherical().setFromVector3(
        camera.position.clone().sub(controls.target)
      );
      const azDeg = Math.round(THREE.MathUtils.radToDeg(spherical.theta));
      const elDeg = Math.round(THREE.MathUtils.radToDeg(Math.PI / 2 - spherical.phi));
      setAzimuthDeg(azDeg);
      setElevationDeg(elDeg);
      if (onAngleChange) onAngleChange(azDeg, elDeg);
    });

    // ── Lighting calibrated for crystal clear hand reading ──
    const ambientLight = new THREE.AmbientLight(0x18241e, 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff6ed, 2.6);
    keyLight.position.set(2.2, 3.2, 2.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.3);
    fillLight.position.set(-2.6, 2.0, 2.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 2.8);
    rimLight.position.set(0, 2.2, -3.2);
    scene.add(rimLight);

    const palmLight = new THREE.PointLight(0xa7f3d0, 1.6, 4.2);
    palmLight.position.set(0.0, 0.5, 1.3);
    scene.add(palmLight);

    // Pedestal Floor
    const floorGeom = new THREE.CircleGeometry(2.2, 32);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050e09,
      roughness: 0.85,
      metalness: 0.15,
    });
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.position.y = -1.1;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    const ringGeom = new THREE.RingGeometry(2.1, 2.16, 48);
    ringGeom.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ringMesh = new THREE.Mesh(ringGeom, ringMat);
    ringMesh.position.y = -1.09;
    scene.add(ringMesh);

    // ── Dominant Right Hand Rig (100% HERO CENTERED AT 0, 0, 0) ──
    const rightHand = create3DHand('right', viewMode, colorAssisted);
    rightHand.handRoot.position.set(useBothHands ? 0.78 : 0.0, 0.0, 0.0);
    rightHand.handRoot.scale.set(1.0, 1.0, 1.0);
    scene.add(rightHand.handRoot);
    rightHandRef.current = rightHand;

    // ── Left Hand Rig (Support / Dual Mode) ──
    const leftHand = create3DHand('left', viewMode, colorAssisted);
    leftHand.handRoot.position.set(-0.78, 0.0, 0.0);
    leftHand.handRoot.scale.set(1.0, 1.0, 1.0);
    leftHand.handRoot.visible = useBothHands;
    scene.add(leftHand.handRoot);
    leftHandRef.current = leftHand;

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w && h && renderer && camera) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // ── 60 FPS Render Loop with Smooth Organic Lerp & 3D Tracking Badges ──
    const clock = new THREE.Clock();
    const tempVec = new THREE.Vector3();

    const animate = () => {
      const delta = clock.getDelta();
      const lerpSpeed = Math.min(1.0, delta * (speed === 'slow' ? 7.0 : speed === 'fast' ? 18.0 : 12.0));

      // Auto turntable
      if (controlsRef.current && isAutoTurntableRef.current) {
        controlsRef.current.autoRotate = true;
        controlsRef.current.autoRotateSpeed = 2.0;
      } else if (controlsRef.current) {
        controlsRef.current.autoRotate = false;
      }

      // Smooth kinematic interpolation
      rightHandRef.current?.updateLerp(lerpSpeed);
      leftHandRef.current?.updateLerp(lerpSpeed);

      controlsRef.current?.update();
      renderer.render(scene, camera);

      // ── Real-Time 3D-to-2D Fingertip Tracking Badges (Direct DOM, 0 overhead) ──
      if (
        showFingerLabelsRef.current &&
        rightHandRef.current &&
        cameraRef.current &&
        containerRef.current
      ) {
        const cw = containerRef.current.clientWidth;
        const ch = containerRef.current.clientHeight;

        ['thumb', 'index', 'middle', 'ring', 'pinky'].forEach((fKey) => {
          const el = labelRefs[fKey].current;
          const finger = rightHandRef.current.fingers[fKey];
          if (el && finger?.tipAnchor) {
            finger.tipAnchor.getWorldPosition(tempVec);
            tempVec.project(cameraRef.current);
            const isBehind = tempVec.z > 1.0;
            if (isBehind) {
              el.style.display = 'none';
            } else {
              el.style.display = 'flex';
              const px = (tempVec.x * 0.5 + 0.5) * cw;
              const py = (-tempVec.y * 0.5 + 0.5) * ch;
              el.style.transform = `translate3d(${px}px, ${py}px, 0px) translate(-50%, -125%)`;
            }
          }
        });
      }

      animFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameId.current);
      resizeObserver.disconnect();
      controls.dispose();
      renderer.dispose();
    };
  }, [viewMode, colorAssisted]);

  // Handle Dual Hands mode & positioning
  useEffect(() => {
    if (rightHandRef.current) {
      rightHandRef.current.handRoot.position.set(useBothHands ? 0.78 : 0.0, 0.0, 0.0);
    }
    if (leftHandRef.current) {
      leftHandRef.current.handRoot.visible = useBothHands;
    }
  }, [useBothHands]);

  // Update hand pose when activeLetter changes
  useEffect(() => {
    const char = (activeLetter || 'A').toUpperCase();
    const pose = ASL_3D_POSE_MAP[char] || ASL_3D_POSE_MAP['A'];

    rightHandRef.current?.setPose(pose);
    leftHandRef.current?.setPose(pose);
  }, [activeLetter]);

  // Finger flex telemetry data
  const fingerTelemetry = [
    {
      name: 'Thumb',
      curlPct: Math.round(((currentPose.thumb.mcpCurl + currentPose.thumb.pipCurl) / 2.0) * 100),
      status: currentPose.thumb.mcpCurl > 0.5 ? 'Curled' : 'Extended',
      icon: '👍',
      color: FINGER_PALETTE.thumb.hex,
    },
    {
      name: 'Index',
      curlPct: Math.round((currentPose.index.mcpCurl / 1.57) * 100),
      status: currentPose.index.mcpCurl > 0.8 ? 'Curled' : 'Extended',
      icon: '☝️',
      color: FINGER_PALETTE.index.hex,
    },
    {
      name: 'Middle',
      curlPct: Math.round((currentPose.middle.mcpCurl / 1.57) * 100),
      status: currentPose.middle.mcpCurl > 0.8 ? 'Curled' : 'Extended',
      icon: '🖕',
      color: FINGER_PALETTE.middle.hex,
    },
    {
      name: 'Ring',
      curlPct: Math.round((currentPose.ring.mcpCurl / 1.57) * 100),
      status: currentPose.ring.mcpCurl > 0.8 ? 'Curled' : 'Extended',
      icon: '💍',
      color: FINGER_PALETTE.ring.hex,
    },
    {
      name: 'Pinky',
      curlPct: Math.round((currentPose.pinky.mcpCurl / 1.57) * 100),
      status: currentPose.pinky.mcpCurl > 0.8 ? 'Curled' : 'Extended',
      icon: '🤙',
      color: FINGER_PALETTE.pinky.hex,
    },
  ];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[500px] flex items-center justify-center select-none overflow-hidden"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
      />

      {/* ── Real-Time 3D Floating Fingertip Tracking Badges (Direct DOM) ── */}
      {showFingerLabels && (
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          {Object.entries(FINGER_PALETTE).map(([key, data]) => (
            <div
              key={key}
              ref={labelRefs[key]}
              className="absolute top-0 left-0 hidden items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black font-mono shadow-xl transition-opacity duration-150 backdrop-blur-md border border-white/20 select-none whitespace-nowrap"
              style={{
                backgroundColor: `${data.hex}E6`,
                color: '#090d16',
                boxShadow: `0 0 12px ${data.hex}80`,
              }}
            >
              <span>{data.icon}</span>
              <span>{data.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Floating One-Click Stop 360° Rotation Banner Button ── */}
      {isAutoTurntable && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={handleStopTurntable}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-2xl shadow-rose-950/80 backdrop-blur-md border border-rose-400/60 cursor-pointer animate-pulse hover:animate-none transition-transform active:scale-95"
            title="Click to Stop 360° Turntable Rotation"
          >
            <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
            <span>🛑 Stop 360° Rotation</span>
          </button>
        </div>
      )}

      {/* ── Top Unified Header Bar (Clean, Zero Collision) ── */}
      <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-2 z-20 pointer-events-none">
        {/* Left: Palm Direction Pill */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-emerald-500/30 text-[11px] font-bold text-emerald-400 shadow-xl">
          <Compass size={13} className="text-emerald-400" />
          <span>Palm: {currentGuide.directionIcon} {currentGuide.palmDirection.split('/')[0]}</span>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="pointer-events-auto flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 shadow-xl">
          {/* Preset Angles Dropdown */}
          <select
            value={cameraPreset}
            onChange={(e) => handleCameraPreset(e.target.value)}
            className="bg-white/10 text-white rounded-lg px-2 py-1 text-[10px] font-bold outline-none cursor-pointer border border-white/10"
          >
            <option value="front" className="bg-slate-900 text-white">0° Front View</option>
            <option value="angle45" className="bg-slate-900 text-white">45° Depth View</option>
            <option value="side90" className="bg-slate-900 text-white">90° Side Profile</option>
            <option value="firstperson" className="bg-slate-900 text-white">👁️ My Hand (Mirror)</option>
            <option value="closeup" className="bg-slate-900 text-white">🔍 Knuckle Zoom</option>
          </select>

          {/* 360 Spin Toggle */}
          <button
            type="button"
            onClick={handleToggleTurntable}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              isAutoTurntable
                ? 'bg-rose-600 text-white animate-pulse'
                : 'text-text-muted hover:text-cyan-400 hover:bg-white/10'
            }`}
            title={isAutoTurntable ? 'Stop 360° Rotation' : '360° Continuous Turntable Rotation'}
          >
            <RotateCw size={14} className={isAutoTurntable ? 'animate-spin' : ''} />
            {isAutoTurntable ? <span>Stop Spin</span> : <span>360°</span>}
          </button>

          {/* Color Assist Toggle */}
          <button
            type="button"
            onClick={() => setColorAssisted((prev) => !prev)}
            className={`p-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              colorAssisted
                ? 'bg-amber-500 text-slate-950'
                : 'text-text-muted hover:text-amber-400 hover:bg-white/10'
            }`}
            title="Toggle Color-Coded Fingers (Thumb=Amber, Index=Cyan, Middle=Green, Ring=Purple, Pinky=Pink)"
          >
            <Palette size={14} />
          </button>

          {/* Finger Labels Toggle */}
          <button
            type="button"
            onClick={() => setShowFingerLabels((prev) => !prev)}
            className={`p-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
              showFingerLabels
                ? 'bg-emerald-500 text-slate-950'
                : 'text-text-muted hover:text-emerald-400 hover:bg-white/10'
            }`}
            title="Toggle 3D Fingertip Badges"
          >
            <Tag size={14} />
          </button>
        </div>
      </div>

      {/* ── Bottom-Left Zoom & Orbit Controls ── */}
      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-xl border border-white/10 z-20 shadow-lg">
        <button
          type="button"
          onClick={() => handleZoom(-0.35)}
          className="p-1.5 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn size={15} />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(0.35)}
          className="p-1.5 text-text-muted hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          onClick={() => handleCameraPreset('front')}
          className="p-1.5 text-text-muted hover:text-emerald-400 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
          title="Reset Camera Orientation"
        >
          <RefreshCw size={14} />
        </button>
        <div className="px-1.5 text-[10px] font-mono text-text-muted border-l border-white/10">
          {azimuthDeg}°
        </div>
      </div>

      {/* ── Bottom-Right Expandable Beginner "How to Sign" Instructions Drawer (Collapsed by default) ── */}
      <div className="absolute bottom-2.5 right-2.5 max-w-[280px] sm:max-w-xs z-20">
        <div className="bg-black/85 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl transition-all">
          {/* Drawer Header Toggle */}
          <button
            type="button"
            onClick={() => setIsGuideOpen((prev) => !prev)}
            className="w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs">💡</span>
              <span className="text-[11px] font-bold text-white">
                How to Sign "{activeChar}"
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                {currentGuide.difficulty}
              </span>
            </div>
            {isGuideOpen ? <ChevronDown size={13} className="text-text-muted" /> : <ChevronUp size={13} className="text-text-muted" />}
          </button>

          {/* Expanded Drawer Content */}
          {isGuideOpen && (
            <div className="p-3 space-y-2 text-xs border-t border-white/10 max-h-56 overflow-y-auto">
              {/* Step-by-step Formation */}
              <div className="space-y-1">
                {currentGuide.steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-200">
                    <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {/* Learner Pro-Tip */}
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 leading-snug flex items-start gap-1">
                <Sparkles size={11} className="text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip:</strong> {currentGuide.learnerTip}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Realtime Finger Flex Telemetry HUD Overlay (When ViewMode is 'hud') ── */}
      {viewMode === 'hud' && (
        <div className="absolute top-12 right-2.5 w-52 bg-black/85 backdrop-blur-md rounded-xl border border-emerald-500/30 p-2.5 text-xs space-y-1.5 z-20 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-1">
            <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1 text-[10px]">
              <Activity size={12} /> Finger Flex Gauge
            </span>
            <span className="font-mono text-[9px] text-text-muted">Pose {activeChar}</span>
          </div>

          <div className="space-y-1">
            {fingerTelemetry.map((item) => (
              <div key={item.name} className="space-y-0.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="flex items-center gap-1">
                    <span>{item.icon}</span>
                    <span style={{ color: item.color }} className="font-bold">{item.name}</span>
                  </span>
                  <span
                    className={
                      item.status === 'Extended' ? 'text-emerald-400 font-bold' : 'text-amber-400'
                    }
                  >
                    {item.status} ({item.curlPct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, item.curlPct)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default ThreeHandAvatarViewer;
