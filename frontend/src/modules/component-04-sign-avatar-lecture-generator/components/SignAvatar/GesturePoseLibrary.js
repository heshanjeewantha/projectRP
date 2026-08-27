import { getFingerspellingPoses, getSingleLetterPose } from './FingerspellingFallback';

const createPose = (side, overrides = {}) => {
  const defaultPosition = side === 'left' ? { x: 334, y: 304, z: 0 } : { x: 566, y: 304, z: 0 };
  const defaultFingerCurls = {
    thumb: 0.28,
    index: 0.2,
    middle: 0.22,
    ring: 0.24,
    pinky: 0.28,
  };

  return {
    scale: 1,
    wristAngle: side === 'left' ? -10 : 10,
    palmAngle: side === 'left' ? -6 : 6,
    fingerSpread: 1,
    thumbSpread: 26,
    ...overrides,
    position: {
      ...defaultPosition,
      ...(overrides.position || {}),
    },
    fingerCurls: {
      ...defaultFingerCurls,
      ...(overrides.fingerCurls || {}),
    },
  };
};

const createEntry = (glossWord, description, leftOverrides, rightOverrides) => ({
  glossWord,
  description,
  leftHandPose: createPose('left', leftOverrides),
  rightHandPose: createPose('right', rightOverrides),
});

const mergeHandPose = (basePose, overrides = {}) => ({
  ...basePose,
  ...overrides,
  position: {
    ...basePose.position,
    ...(overrides.position || {}),
  },
  fingerCurls: {
    ...basePose.fingerCurls,
    ...(overrides.fingerCurls || {}),
  },
});

const createMotionFrame = (progress, leftHandPose, rightHandPose, label = '') => ({
  progress,
  leftHandPose,
  rightHandPose,
  label,
});

const buildMotionKeyframes = (entry, profile = {}) => {
  const baseLeft = entry.leftHandPose;
  const baseRight = entry.rightHandPose;
  const frames = [
    createMotionFrame(
      0,
      mergeHandPose(baseLeft, profile.prepLeft),
      mergeHandPose(baseRight, profile.prepRight),
      'prep'
    ),
    createMotionFrame(
      0.38,
      mergeHandPose(baseLeft, profile.strokeLeft),
      mergeHandPose(baseRight, profile.strokeRight),
      'stroke'
    ),
    createMotionFrame(
      0.72,
      mergeHandPose(baseLeft, profile.holdLeft || profile.strokeLeft),
      mergeHandPose(baseRight, profile.holdRight || profile.strokeRight),
      'hold'
    ),
    createMotionFrame(1, mergeHandPose(baseLeft, profile.releaseLeft), mergeHandPose(baseRight, profile.releaseRight), 'release'),
  ];

  return frames;
};

const SUPPORTED_SIGN_ALIASES = {
  DEVICE: 'DEVICE',
  ELECTRONIC: 'ELECTRONIC',
  SYSTEM: 'COMPUTER',
  PC: 'COMPUTER',
  APPLICATION: 'SOFTWARE',
  APPLICATIONS: 'SOFTWARE',
  CODING: 'CODE',
  ALGORITHMS: 'ALGORITHM',
  STORES: 'STORAGE',
  SAVED: 'STORAGE',
  WEBSITES: 'WEBSITE',
};

const BASE_GESTURE_POSE_LIBRARY = {
  COMPUTER: createEntry(
    'COMPUTER',
    'Both hands move into a light typing posture near the chest.',
    { position: { x: 342, y: 314 }, wristAngle: -18, palmAngle: 0, fingerCurls: { index: 0.56, middle: 0.62, ring: 0.66, pinky: 0.68 } },
    { position: { x: 558, y: 314 }, wristAngle: 18, palmAngle: 0, fingerCurls: { index: 0.56, middle: 0.62, ring: 0.66, pinky: 0.68 } }
  ),
  DEVICE: createEntry(
    'DEVICE',
    'Both hands frame a compact object to represent a digital device.',
    { position: { x: 350, y: 306 }, wristAngle: -10, palmAngle: 10, fingerSpread: 0.94, fingerCurls: { thumb: 0.34, index: 0.44, middle: 0.5, ring: 0.58, pinky: 0.64 } },
    { position: { x: 550, y: 306 }, wristAngle: 10, palmAngle: -10, fingerSpread: 0.94, fingerCurls: { thumb: 0.34, index: 0.44, middle: 0.5, ring: 0.58, pinky: 0.64 } }
  ),
  ELECTRONIC: createEntry(
    'ELECTRONIC',
    'One hand presents the device while the other forms a precise technical shape.',
    { position: { x: 342, y: 308 }, wristAngle: -12, palmAngle: 8, fingerCurls: { thumb: 0.3, index: 0.36, middle: 0.44, ring: 0.54, pinky: 0.6 } },
    { position: { x: 566, y: 292 }, wristAngle: 14, palmAngle: -12, fingerSpread: 1.02, fingerCurls: { thumb: 0.12, index: 0.1, middle: 0.84, ring: 0.9, pinky: 0.92 } }
  ),
  DATA: createEntry(
    'DATA',
    'Hands cup inward as if holding grouped pieces of information.',
    { position: { x: 346, y: 300 }, palmAngle: 12, fingerCurls: { thumb: 0.42, index: 0.52, middle: 0.52, ring: 0.58, pinky: 0.64 } },
    { position: { x: 554, y: 300 }, palmAngle: -12, fingerCurls: { thumb: 0.42, index: 0.52, middle: 0.52, ring: 0.58, pinky: 0.64 } }
  ),
  INFORMATION: createEntry(
    'INFORMATION',
    'Open hands present information clearly in front of the torso.',
    { position: { x: 336, y: 286 }, wristAngle: -4, palmAngle: -10, fingerCurls: { thumb: 0.16, index: 0.1, middle: 0.1, ring: 0.16, pinky: 0.18 } },
    { position: { x: 564, y: 286 }, wristAngle: 4, palmAngle: 10, fingerCurls: { thumb: 0.16, index: 0.1, middle: 0.1, ring: 0.16, pinky: 0.18 } }
  ),
  INTERNET: createEntry(
    'INTERNET',
    'Hands open outward to suggest connected links across a network.',
    { position: { x: 326, y: 292 }, wristAngle: -12, palmAngle: -16, fingerSpread: 1.08, fingerCurls: { thumb: 0.2, index: 0.12, middle: 0.12, ring: 0.18, pinky: 0.22 } },
    { position: { x: 574, y: 292 }, wristAngle: 12, palmAngle: 16, fingerSpread: 1.08, fingerCurls: { thumb: 0.2, index: 0.12, middle: 0.12, ring: 0.18, pinky: 0.22 } }
  ),
  EMAIL: createEntry(
    'EMAIL',
    'One hand forms the message while the other points outward.',
    { position: { x: 346, y: 304 }, palmAngle: 6, fingerCurls: { thumb: 0.34, index: 0.44, middle: 0.48, ring: 0.54, pinky: 0.6 } },
    { position: { x: 560, y: 286 }, wristAngle: 8, palmAngle: -10, fingerCurls: { thumb: 0.18, index: 0.08, middle: 0.84, ring: 0.9, pinky: 0.92 } }
  ),
  DATABASE: createEntry(
    'DATABASE',
    'Hands stack around a central storage space.',
    { position: { x: 344, y: 300 }, palmAngle: 10, fingerCurls: { thumb: 0.4, index: 0.48, middle: 0.54, ring: 0.6, pinky: 0.66 } },
    { position: { x: 556, y: 300 }, palmAngle: -10, fingerCurls: { thumb: 0.4, index: 0.48, middle: 0.54, ring: 0.6, pinky: 0.66 } }
  ),
  PROGRAM: createEntry(
    'PROGRAM',
    'Fingers point and tap as if sequencing coded steps.',
    { position: { x: 340, y: 312 }, wristAngle: -16, fingerCurls: { thumb: 0.34, index: 0.12, middle: 0.44, ring: 0.72, pinky: 0.78 } },
    { position: { x: 560, y: 292 }, wristAngle: 10, fingerCurls: { thumb: 0.26, index: 0.08, middle: 0.82, ring: 0.88, pinky: 0.9 } }
  ),
  FLOWCHART: createEntry(
    'FLOWCHART',
    'Open guiding hands trace the shape of a process path.',
    { position: { x: 326, y: 292 }, wristAngle: -6, palmAngle: -18, fingerSpread: 1.06 },
    { position: { x: 574, y: 292 }, wristAngle: 6, palmAngle: 18, fingerSpread: 1.06 }
  ),
  SECURITY: createEntry(
    'SECURITY',
    'Hands close in front of the body like a protective barrier.',
    { position: { x: 354, y: 302 }, palmAngle: 16, fingerCurls: { thumb: 0.54, index: 0.68, middle: 0.72, ring: 0.76, pinky: 0.78 } },
    { position: { x: 546, y: 302 }, palmAngle: -16, fingerCurls: { thumb: 0.54, index: 0.68, middle: 0.72, ring: 0.76, pinky: 0.78 } }
  ),
  HARDWARE: createEntry(
    'HARDWARE',
    'Firm hands show solid physical computer components.',
    { position: { x: 344, y: 308 }, wristAngle: -14, fingerCurls: { thumb: 0.3, index: 0.62, middle: 0.66, ring: 0.72, pinky: 0.76 } },
    { position: { x: 556, y: 308 }, wristAngle: 14, fingerCurls: { thumb: 0.3, index: 0.62, middle: 0.66, ring: 0.72, pinky: 0.76 } }
  ),
  SOFTWARE: createEntry(
    'SOFTWARE',
    'Hands remain lighter and more open to suggest logic and instructions.',
    { position: { x: 338, y: 292 }, wristAngle: -8, palmAngle: -4, fingerCurls: { thumb: 0.24, index: 0.18, middle: 0.2, ring: 0.26, pinky: 0.3 } },
    { position: { x: 562, y: 292 }, wristAngle: 8, palmAngle: 4, fingerCurls: { thumb: 0.24, index: 0.18, middle: 0.2, ring: 0.26, pinky: 0.3 } }
  ),
  INPUT: createEntry(
    'INPUT',
    'Right hand points inward to show information entering the system.',
    { position: { x: 340, y: 304 }, palmAngle: 10, fingerCurls: { thumb: 0.36, index: 0.5, middle: 0.6, ring: 0.68, pinky: 0.72 } },
    { position: { x: 562, y: 286 }, wristAngle: 12, palmAngle: -18, fingerCurls: { thumb: 0.14, index: 0.08, middle: 0.84, ring: 0.9, pinky: 0.92 } }
  ),
  OUTPUT: createEntry(
    'OUTPUT',
    'Right hand extends outward to show information leaving the system.',
    { position: { x: 340, y: 304 }, palmAngle: 8, fingerCurls: { thumb: 0.34, index: 0.5, middle: 0.6, ring: 0.68, pinky: 0.72 } },
    { position: { x: 578, y: 274 }, wristAngle: 6, palmAngle: 8, fingerCurls: { thumb: 0.16, index: 0.08, middle: 0.12, ring: 0.22, pinky: 0.28 } }
  ),
  MEMORY: createEntry(
    'MEMORY',
    'Hands gather close to the head and chest to suggest stored recall.',
    { position: { x: 344, y: 284 }, wristAngle: -18, palmAngle: 10, fingerCurls: { thumb: 0.36, index: 0.34, middle: 0.42, ring: 0.48, pinky: 0.54 } },
    { position: { x: 556, y: 292 }, wristAngle: 12, palmAngle: -8, fingerCurls: { thumb: 0.3, index: 0.28, middle: 0.34, ring: 0.42, pinky: 0.48 } }
  ),
  NETWORK: createEntry(
    'NETWORK',
    'Both open hands frame multiple connected points.',
    { position: { x: 324, y: 292 }, wristAngle: -8, palmAngle: -18, fingerSpread: 1.1, fingerCurls: { thumb: 0.18, index: 0.1, middle: 0.12, ring: 0.18, pinky: 0.22 } },
    { position: { x: 576, y: 292 }, wristAngle: 8, palmAngle: 18, fingerSpread: 1.1, fingerCurls: { thumb: 0.18, index: 0.1, middle: 0.12, ring: 0.18, pinky: 0.22 } }
  ),
};

// These are distinct visual ICT gestures for the avatar prototype. They are
// deliberately labelled as visual gestures, not as certified replacements for
// a regional sign language; production signs should be reviewed by Deaf sign
// language users and a qualified interpreter.
const ICT_EXTENSION_POSES = {
  CPU: createEntry('CPU', 'Both hands form a compact processing core at the centre of the chest.',
    { position: { x: 376, y: 292 }, wristAngle: -26, palmAngle: 14, fingerCurls: { thumb: 0.42, index: 0.62, middle: 0.7, ring: 0.76, pinky: 0.8 } },
    { position: { x: 524, y: 292 }, wristAngle: 26, palmAngle: -14, fingerCurls: { thumb: 0.42, index: 0.62, middle: 0.7, ring: 0.76, pinky: 0.8 } }),
  KEYBOARD: createEntry('KEYBOARD', 'Both hands alternate above an invisible keyboard with relaxed curved fingers.',
    { position: { x: 352, y: 326 }, wristAngle: -14, palmAngle: -2, fingerSpread: 1.04, fingerCurls: { thumb: 0.28, index: 0.48, middle: 0.52, ring: 0.56, pinky: 0.6 } },
    { position: { x: 548, y: 326 }, wristAngle: 14, palmAngle: 2, fingerSpread: 1.04, fingerCurls: { thumb: 0.28, index: 0.48, middle: 0.52, ring: 0.56, pinky: 0.6 } }),
  MOUSE: createEntry('MOUSE', 'One hand rests on a small mouse shape while the index finger performs a click.',
    { position: { x: 356, y: 316 }, wristAngle: -12, palmAngle: 6, fingerCurls: { thumb: 0.38, index: 0.54, middle: 0.6, ring: 0.68, pinky: 0.72 } },
    { position: { x: 550, y: 306 }, wristAngle: 10, palmAngle: -8, fingerCurls: { thumb: 0.34, index: 0.12, middle: 0.66, ring: 0.78, pinky: 0.82 } }),
  MONITOR: createEntry('MONITOR', 'Open hands outline the two sides of a screen in front of the body.',
    { position: { x: 344, y: 286 }, wristAngle: -30, palmAngle: -10, fingerSpread: 0.9, fingerCurls: { thumb: 0.2, index: 0.14, middle: 0.18, ring: 0.3, pinky: 0.4 } },
    { position: { x: 556, y: 286 }, wristAngle: 30, palmAngle: 10, fingerSpread: 0.9, fingerCurls: { thumb: 0.2, index: 0.14, middle: 0.18, ring: 0.3, pinky: 0.4 } }),
  SERVER: createEntry('SERVER', 'Flat hands mark separate stacked levels like a server rack.',
    { position: { x: 360, y: 322 }, wristAngle: -8, palmAngle: 4, fingerSpread: 0.86, fingerCurls: { thumb: 0.36, index: 0.58, middle: 0.62, ring: 0.66, pinky: 0.7 } },
    { position: { x: 540, y: 278 }, wristAngle: 8, palmAngle: -4, fingerSpread: 0.86, fingerCurls: { thumb: 0.36, index: 0.58, middle: 0.62, ring: 0.66, pinky: 0.7 } }),
  BROWSER: createEntry('BROWSER', 'One hand frames a web window while the other points to a navigation area.',
    { position: { x: 348, y: 292 }, wristAngle: -24, palmAngle: -8, fingerSpread: 0.94, fingerCurls: { thumb: 0.22, index: 0.14, middle: 0.22, ring: 0.46, pinky: 0.54 } },
    { position: { x: 558, y: 276 }, wristAngle: 14, palmAngle: -12, fingerCurls: { thumb: 0.16, index: 0.08, middle: 0.78, ring: 0.88, pinky: 0.9 } }),
  WEBSITE: createEntry('WEBSITE', 'Both hands open into a broad web-page frame.',
    { position: { x: 326, y: 286 }, wristAngle: -20, palmAngle: -14, fingerSpread: 1.1, fingerCurls: { thumb: 0.18, index: 0.12, middle: 0.14, ring: 0.2, pinky: 0.26 } },
    { position: { x: 574, y: 286 }, wristAngle: 20, palmAngle: 14, fingerSpread: 1.1, fingerCurls: { thumb: 0.18, index: 0.12, middle: 0.14, ring: 0.2, pinky: 0.26 } }),
  CLOUD: createEntry('CLOUD', 'Soft rounded hands rise and curve outward like a cloud shape.',
    { position: { x: 364, y: 270 }, wristAngle: -18, palmAngle: -18, fingerSpread: 1.08, fingerCurls: { thumb: 0.42, index: 0.42, middle: 0.4, ring: 0.44, pinky: 0.5 } },
    { position: { x: 536, y: 270 }, wristAngle: 18, palmAngle: 18, fingerSpread: 1.08, fingerCurls: { thumb: 0.42, index: 0.42, middle: 0.4, ring: 0.44, pinky: 0.5 } }),
  PASSWORD: createEntry('PASSWORD', 'One hand holds a lock shape while the other turns an invisible key.',
    { position: { x: 356, y: 298 }, wristAngle: -18, palmAngle: 12, fingerCurls: { thumb: 0.52, index: 0.72, middle: 0.76, ring: 0.8, pinky: 0.84 } },
    { position: { x: 552, y: 286 }, wristAngle: 16, palmAngle: -6, fingerCurls: { thumb: 0.18, index: 0.12, middle: 0.74, ring: 0.86, pinky: 0.9 } }),
  LOGIN: createEntry('LOGIN', 'The right index moves decisively into an open left-hand doorway.',
    { position: { x: 382, y: 294 }, wristAngle: -28, palmAngle: 8, fingerSpread: 0.9, fingerCurls: { thumb: 0.26, index: 0.16, middle: 0.3, ring: 0.52, pinky: 0.62 } },
    { position: { x: 548, y: 292 }, wristAngle: 10, palmAngle: -18, fingerCurls: { thumb: 0.16, index: 0.06, middle: 0.8, ring: 0.9, pinky: 0.92 } }),
  FILE: createEntry('FILE', 'Hands hold the top and bottom corners of a vertical document.',
    { position: { x: 364, y: 316 }, wristAngle: -18, palmAngle: 4, fingerSpread: 0.9, fingerCurls: { thumb: 0.34, index: 0.42, middle: 0.5, ring: 0.62, pinky: 0.68 } },
    { position: { x: 536, y: 266 }, wristAngle: 18, palmAngle: -4, fingerSpread: 0.9, fingerCurls: { thumb: 0.34, index: 0.42, middle: 0.5, ring: 0.62, pinky: 0.68 } }),
  FOLDER: createEntry('FOLDER', 'Both hands create an open folder shape that widens at the top.',
    { position: { x: 354, y: 306 }, wristAngle: -18, palmAngle: 10, fingerSpread: 0.98, fingerCurls: { thumb: 0.34, index: 0.42, middle: 0.48, ring: 0.58, pinky: 0.64 } },
    { position: { x: 546, y: 298 }, wristAngle: 18, palmAngle: -10, fingerSpread: 0.98, fingerCurls: { thumb: 0.34, index: 0.42, middle: 0.48, ring: 0.58, pinky: 0.64 } }),
  STORAGE: createEntry('STORAGE', 'Hands place an item onto a stable lower shelf.',
    { position: { x: 362, y: 320 }, wristAngle: -10, palmAngle: 8, fingerCurls: { thumb: 0.4, index: 0.56, middle: 0.6, ring: 0.66, pinky: 0.72 } },
    { position: { x: 538, y: 286 }, wristAngle: 10, palmAngle: -8, fingerCurls: { thumb: 0.3, index: 0.38, middle: 0.44, ring: 0.52, pinky: 0.58 } }),
  CODE: createEntry('CODE', 'Two hands alternate compact, deliberate code-entry movements.',
    { position: { x: 352, y: 314 }, wristAngle: -16, palmAngle: -4, fingerCurls: { thumb: 0.3, index: 0.26, middle: 0.42, ring: 0.72, pinky: 0.78 } },
    { position: { x: 548, y: 298 }, wristAngle: 16, palmAngle: 4, fingerCurls: { thumb: 0.26, index: 0.1, middle: 0.72, ring: 0.86, pinky: 0.9 } }),
  ALGORITHM: createEntry('ALGORITHM', 'An index hand follows a clear step-by-step path across the supporting hand.',
    { position: { x: 364, y: 312 }, wristAngle: -12, palmAngle: 8, fingerCurls: { thumb: 0.34, index: 0.52, middle: 0.6, ring: 0.7, pinky: 0.76 } },
    { position: { x: 542, y: 276 }, wristAngle: 12, palmAngle: -14, fingerCurls: { thumb: 0.18, index: 0.06, middle: 0.78, ring: 0.9, pinky: 0.92 } }),
};

const GESTURE_MOTION_PROFILES = {
  COMPUTER: {
    prepLeft: { position: { x: 334, y: 300 }, wristAngle: -12, fingerCurls: { index: 0.32, middle: 0.38, ring: 0.44, pinky: 0.48 } },
    prepRight: { position: { x: 566, y: 300 }, wristAngle: 12, fingerCurls: { index: 0.32, middle: 0.38, ring: 0.44, pinky: 0.48 } },
    strokeLeft: { position: { x: 350, y: 320 }, wristAngle: -22, fingerCurls: { index: 0.7, middle: 0.74, ring: 0.76, pinky: 0.78 } },
    strokeRight: { position: { x: 550, y: 320 }, wristAngle: 22, fingerCurls: { index: 0.7, middle: 0.74, ring: 0.76, pinky: 0.78 } },
    releaseLeft: { position: { x: 340, y: 308 }, wristAngle: -16 },
    releaseRight: { position: { x: 560, y: 308 }, wristAngle: 16 },
  },
  DEVICE: {
    prepLeft: { position: { x: 324, y: 298 }, palmAngle: 0, fingerSpread: 1.02 },
    prepRight: { position: { x: 576, y: 298 }, palmAngle: 0, fingerSpread: 1.02 },
    strokeLeft: { position: { x: 356, y: 308 }, palmAngle: 14, fingerSpread: 0.88 },
    strokeRight: { position: { x: 544, y: 308 }, palmAngle: -14, fingerSpread: 0.88 },
    releaseLeft: { position: { x: 344, y: 304 }, palmAngle: 8 },
    releaseRight: { position: { x: 556, y: 304 }, palmAngle: -8 },
  },
  ELECTRONIC: {
    prepLeft: { position: { x: 334, y: 314 }, wristAngle: -8, fingerCurls: { index: 0.28, middle: 0.34 } },
    prepRight: { position: { x: 582, y: 298 }, wristAngle: 18, palmAngle: -20 },
    strokeLeft: { position: { x: 350, y: 304 }, wristAngle: -16, palmAngle: 12 },
    strokeRight: { position: { x: 556, y: 284 }, wristAngle: 10, palmAngle: -8, fingerCurls: { index: 0.06, middle: 0.76, ring: 0.86, pinky: 0.9 } },
    releaseLeft: { position: { x: 342, y: 308 } },
    releaseRight: { position: { x: 566, y: 292 } },
  },
  DATA: {
    prepLeft: { position: { x: 332, y: 288 }, palmAngle: 0, fingerCurls: { thumb: 0.26, index: 0.28, middle: 0.28 } },
    prepRight: { position: { x: 568, y: 288 }, palmAngle: 0, fingerCurls: { thumb: 0.26, index: 0.28, middle: 0.28 } },
    strokeLeft: { position: { x: 354, y: 306 }, palmAngle: 16, fingerCurls: { thumb: 0.5, index: 0.62, middle: 0.62, ring: 0.68, pinky: 0.72 } },
    strokeRight: { position: { x: 546, y: 306 }, palmAngle: -16, fingerCurls: { thumb: 0.5, index: 0.62, middle: 0.62, ring: 0.68, pinky: 0.72 } },
  },
  DATABASE: {
    prepLeft: { position: { x: 338, y: 286 }, palmAngle: 2 },
    prepRight: { position: { x: 562, y: 286 }, palmAngle: -2 },
    strokeLeft: { position: { x: 350, y: 314 }, palmAngle: 14, fingerCurls: { thumb: 0.44, index: 0.56, middle: 0.62 } },
    strokeRight: { position: { x: 550, y: 314 }, palmAngle: -14, fingerCurls: { thumb: 0.44, index: 0.56, middle: 0.62 } },
    releaseLeft: { position: { x: 344, y: 300 } },
    releaseRight: { position: { x: 556, y: 300 } },
  },
  INPUT: {
    prepLeft: { position: { x: 338, y: 312 }, palmAngle: 2 },
    prepRight: { position: { x: 594, y: 286 }, wristAngle: 2, palmAngle: 6 },
    strokeLeft: { position: { x: 344, y: 304 }, palmAngle: 12 },
    strokeRight: { position: { x: 548, y: 292 }, wristAngle: 18, palmAngle: -24, fingerCurls: { index: 0.06, middle: 0.8, ring: 0.9, pinky: 0.92 } },
    releaseLeft: { position: { x: 340, y: 304 } },
    releaseRight: { position: { x: 562, y: 286 } },
  },
  OUTPUT: {
    prepLeft: { position: { x: 338, y: 312 }, palmAngle: 2 },
    prepRight: { position: { x: 548, y: 292 }, wristAngle: 18, palmAngle: -14 },
    strokeLeft: { position: { x: 342, y: 304 }, palmAngle: 10 },
    strokeRight: { position: { x: 602, y: 266 }, wristAngle: 2, palmAngle: 14, fingerSpread: 1.12, fingerCurls: { index: 0.04, middle: 0.08, ring: 0.18, pinky: 0.24 } },
    releaseLeft: { position: { x: 340, y: 304 } },
    releaseRight: { position: { x: 578, y: 274 } },
  },
  NETWORK: {
    prepLeft: { position: { x: 352, y: 304 }, fingerSpread: 0.96 },
    prepRight: { position: { x: 548, y: 304 }, fingerSpread: 0.96 },
    strokeLeft: { position: { x: 314, y: 286 }, wristAngle: -14, palmAngle: -20, fingerSpread: 1.18 },
    strokeRight: { position: { x: 586, y: 286 }, wristAngle: 14, palmAngle: 20, fingerSpread: 1.18 },
    releaseLeft: { position: { x: 328, y: 294 }, fingerSpread: 1.08 },
    releaseRight: { position: { x: 572, y: 294 }, fingerSpread: 1.08 },
  },
  INTERNET: {
    prepLeft: { position: { x: 350, y: 304 }, fingerSpread: 0.98 },
    prepRight: { position: { x: 550, y: 304 }, fingerSpread: 0.98 },
    strokeLeft: { position: { x: 312, y: 286 }, palmAngle: -20, fingerSpread: 1.16 },
    strokeRight: { position: { x: 588, y: 286 }, palmAngle: 20, fingerSpread: 1.16 },
  },
  PROGRAM: {
    prepLeft: { position: { x: 330, y: 320 }, wristAngle: -10 },
    prepRight: { position: { x: 574, y: 300 }, wristAngle: 16 },
    strokeLeft: { position: { x: 348, y: 304 }, wristAngle: -20, fingerCurls: { index: 0.08, middle: 0.38, ring: 0.7, pinky: 0.76 } },
    strokeRight: { position: { x: 550, y: 286 }, wristAngle: 8, fingerCurls: { index: 0.04, middle: 0.78, ring: 0.88, pinky: 0.9 } },
  },
  FLOWCHART: {
    prepLeft: { position: { x: 332, y: 304 }, palmAngle: -10 },
    prepRight: { position: { x: 568, y: 304 }, palmAngle: 10 },
    strokeLeft: { position: { x: 318, y: 282 }, palmAngle: -24, wristAngle: -10, fingerSpread: 1.1 },
    strokeRight: { position: { x: 586, y: 300 }, palmAngle: 24, wristAngle: 10, fingerSpread: 1.1 },
    releaseLeft: { position: { x: 330, y: 296 } },
    releaseRight: { position: { x: 574, y: 290 } },
  },
  SECURITY: {
    prepLeft: { position: { x: 320, y: 296 }, palmAngle: 6, fingerCurls: { index: 0.4, middle: 0.44 } },
    prepRight: { position: { x: 580, y: 296 }, palmAngle: -6, fingerCurls: { index: 0.4, middle: 0.44 } },
    strokeLeft: { position: { x: 360, y: 306 }, palmAngle: 20, fingerCurls: { thumb: 0.58, index: 0.78, middle: 0.8, ring: 0.82, pinky: 0.84 } },
    strokeRight: { position: { x: 540, y: 306 }, palmAngle: -20, fingerCurls: { thumb: 0.58, index: 0.78, middle: 0.8, ring: 0.82, pinky: 0.84 } },
  },
  HARDWARE: {
    prepLeft: { position: { x: 340, y: 294 }, fingerCurls: { index: 0.48, middle: 0.5 } },
    prepRight: { position: { x: 560, y: 294 }, fingerCurls: { index: 0.48, middle: 0.5 } },
    strokeLeft: { position: { x: 348, y: 316 }, wristAngle: -18, fingerCurls: { index: 0.74, middle: 0.78, ring: 0.8, pinky: 0.82 } },
    strokeRight: { position: { x: 552, y: 316 }, wristAngle: 18, fingerCurls: { index: 0.74, middle: 0.78, ring: 0.8, pinky: 0.82 } },
  },
  SOFTWARE: {
    prepLeft: { position: { x: 346, y: 304 }, palmAngle: 0 },
    prepRight: { position: { x: 554, y: 304 }, palmAngle: 0 },
    strokeLeft: { position: { x: 328, y: 286 }, palmAngle: -10, fingerSpread: 1.08 },
    strokeRight: { position: { x: 572, y: 286 }, palmAngle: 10, fingerSpread: 1.08 },
  },
  MEMORY: {
    prepLeft: { position: { x: 330, y: 302 }, wristAngle: -8 },
    prepRight: { position: { x: 570, y: 302 }, wristAngle: 8 },
    strokeLeft: { position: { x: 356, y: 270 }, wristAngle: -24, palmAngle: 14 },
    strokeRight: { position: { x: 544, y: 282 }, wristAngle: 16, palmAngle: -10 },
    releaseLeft: { position: { x: 346, y: 286 } },
    releaseRight: { position: { x: 554, y: 292 } },
  },
  EMAIL: {
    prepLeft: { position: { x: 334, y: 312 }, palmAngle: 0 },
    prepRight: { position: { x: 546, y: 300 }, wristAngle: 14, palmAngle: -4 },
    strokeLeft: { position: { x: 348, y: 300 }, palmAngle: 8, fingerCurls: { thumb: 0.38, index: 0.5, middle: 0.54 } },
    strokeRight: { position: { x: 584, y: 278 }, wristAngle: 2, palmAngle: 12, fingerCurls: { index: 0.06, middle: 0.74, ring: 0.84, pinky: 0.88 } },
    releaseRight: { position: { x: 564, y: 286 } },
  },
  INFORMATION: {
    prepLeft: { position: { x: 350, y: 302 }, fingerSpread: 0.96 },
    prepRight: { position: { x: 550, y: 302 }, fingerSpread: 0.96 },
    strokeLeft: { position: { x: 328, y: 284 }, palmAngle: -14, fingerSpread: 1.08 },
    strokeRight: { position: { x: 572, y: 284 }, palmAngle: 14, fingerSpread: 1.08 },
  },
};

const ICT_EXTENSION_MOTION_PROFILES = {
  CPU: { prepLeft: { position: { x: 346, y: 300 }, fingerCurls: { index: 0.36, middle: 0.42 } }, prepRight: { position: { x: 554, y: 300 }, fingerCurls: { index: 0.36, middle: 0.42 } }, strokeLeft: { position: { x: 386, y: 292 }, wristAngle: -30 }, strokeRight: { position: { x: 514, y: 292 }, wristAngle: 30 } },
  KEYBOARD: { prepLeft: { position: { x: 338, y: 308 }, fingerCurls: { index: 0.22, middle: 0.28 } }, prepRight: { position: { x: 562, y: 320 }, fingerCurls: { index: 0.5, middle: 0.54 } }, strokeLeft: { position: { x: 358, y: 330 }, fingerCurls: { index: 0.64, middle: 0.7, ring: 0.74, pinky: 0.78 } }, strokeRight: { position: { x: 542, y: 318 }, fingerCurls: { index: 0.28, middle: 0.34, ring: 0.42, pinky: 0.48 } } },
  MOUSE: { prepRight: { position: { x: 564, y: 296 }, fingerCurls: { index: 0.28 } }, strokeRight: { position: { x: 548, y: 314 }, fingerCurls: { index: 0.76, middle: 0.7, ring: 0.8, pinky: 0.84 } } },
  MONITOR: { prepLeft: { position: { x: 374, y: 300 }, fingerSpread: 0.78 }, prepRight: { position: { x: 526, y: 300 }, fingerSpread: 0.78 }, strokeLeft: { position: { x: 334, y: 278 }, wristAngle: -34, fingerSpread: 0.98 }, strokeRight: { position: { x: 566, y: 278 }, wristAngle: 34, fingerSpread: 0.98 } },
  SERVER: { prepLeft: { position: { x: 350, y: 300 } }, prepRight: { position: { x: 550, y: 300 } }, strokeLeft: { position: { x: 366, y: 330 } }, strokeRight: { position: { x: 534, y: 266 } } },
  BROWSER: { prepLeft: { position: { x: 366, y: 306 } }, prepRight: { position: { x: 576, y: 292 } }, strokeLeft: { position: { x: 338, y: 286 }, wristAngle: -28 }, strokeRight: { position: { x: 542, y: 270 }, wristAngle: 8 } },
  WEBSITE: { prepLeft: { position: { x: 356, y: 300 }, fingerSpread: 0.92 }, prepRight: { position: { x: 544, y: 300 }, fingerSpread: 0.92 }, strokeLeft: { position: { x: 306, y: 278 }, fingerSpread: 1.18 }, strokeRight: { position: { x: 594, y: 278 }, fingerSpread: 1.18 } },
  CLOUD: { prepLeft: { position: { x: 380, y: 286 }, fingerCurls: { index: 0.24, middle: 0.22 } }, prepRight: { position: { x: 520, y: 286 }, fingerCurls: { index: 0.24, middle: 0.22 } }, strokeLeft: { position: { x: 350, y: 258 }, palmAngle: -24, fingerCurls: { index: 0.56, middle: 0.54, ring: 0.58 } }, strokeRight: { position: { x: 550, y: 258 }, palmAngle: 24, fingerCurls: { index: 0.56, middle: 0.54, ring: 0.58 } } },
  PASSWORD: { prepRight: { position: { x: 570, y: 292 }, wristAngle: 6 }, strokeRight: { position: { x: 540, y: 282 }, wristAngle: 28, fingerCurls: { index: 0.14, middle: 0.82, ring: 0.9, pinky: 0.92 } } },
  LOGIN: { prepRight: { position: { x: 596, y: 292 } }, strokeRight: { position: { x: 504, y: 292 }, wristAngle: 22, palmAngle: -24 } },
  FILE: { prepLeft: { position: { x: 346, y: 332 } }, prepRight: { position: { x: 554, y: 250 } }, strokeLeft: { position: { x: 376, y: 308 } }, strokeRight: { position: { x: 524, y: 274 } } },
  FOLDER: { prepLeft: { position: { x: 372, y: 314 }, fingerSpread: 0.82 }, prepRight: { position: { x: 528, y: 304 }, fingerSpread: 0.82 }, strokeLeft: { position: { x: 342, y: 304 }, fingerSpread: 1.04 }, strokeRight: { position: { x: 558, y: 294 }, fingerSpread: 1.04 } },
  STORAGE: { prepRight: { position: { x: 548, y: 258 } }, strokeRight: { position: { x: 540, y: 298 }, fingerCurls: { index: 0.7, middle: 0.74, ring: 0.78, pinky: 0.82 } } },
  CODE: { prepLeft: { position: { x: 338, y: 304 } }, prepRight: { position: { x: 562, y: 316 } }, strokeLeft: { position: { x: 366, y: 322 }, fingerCurls: { index: 0.64, middle: 0.7 } }, strokeRight: { position: { x: 534, y: 288 }, fingerCurls: { index: 0.04, middle: 0.82, ring: 0.9, pinky: 0.92 } } },
  ALGORITHM: { prepRight: { position: { x: 582, y: 300 } }, strokeRight: { position: { x: 526, y: 270 }, wristAngle: 2, palmAngle: -20 } },
};

const GESTURE_POSE_LIBRARY = Object.fromEntries(
  Object.entries({ ...BASE_GESTURE_POSE_LIBRARY, ...ICT_EXTENSION_POSES }).map(([glossWord, entry]) => [
    glossWord,
    {
      ...entry,
      motionKeyframes: buildMotionKeyframes(entry, GESTURE_MOTION_PROFILES[glossWord] || ICT_EXTENSION_MOTION_PROFILES[glossWord]),
    },
  ])
);

const DEFAULT_MISSING_POSE = createEntry(
  'UNKNOWN',
  'Gesture is not available yet. The system keeps both hands visible and ready for replacement with a real sign clip later.',
  { position: { x: 340, y: 304 }, fingerCurls: { thumb: 0.22, index: 0.18, middle: 0.18, ring: 0.2, pinky: 0.24 } },
  { position: { x: 560, y: 304 }, fingerCurls: { thumb: 0.22, index: 0.18, middle: 0.18, ring: 0.2, pinky: 0.24 } }
);

export const getGesturePoseData = (gesture, word) => {
  const lookupWord = (gesture?.glossWord || word || '').toUpperCase().trim();
  const resolvedWord = SUPPORTED_SIGN_ALIASES[lookupWord] || lookupWord;

  // 1. Direct hand pose object passed
  if (gesture?.leftHandPose && gesture?.rightHandPose) {
    return {
      glossWord: gesture.glossWord || word || 'READY',
      description: gesture.description || '',
      leftHandPose: gesture.leftHandPose,
      rightHandPose: gesture.rightHandPose,
      boneRotationValues: gesture.boneRotationValues || null,
      fingerspellingPoses: gesture.fingerspellingPoses || null,
      warning: '',
    };
  }

  // 2. Exact match in standard vocabulary
  if (resolvedWord && GESTURE_POSE_LIBRARY[resolvedWord]) {
    return {
      ...GESTURE_POSE_LIBRARY[resolvedWord],
      glossWord: resolvedWord,
      warning:
        resolvedWord !== lookupWord
          ? `Using the closest supported sign for ${lookupWord}: ${resolvedWord}.`
          : '',
    };
  }

  // 3. Single ASL Letter (A to Z)
  if (/^[A-Z]$/.test(lookupWord)) {
    return getSingleLetterPose(lookupWord);
  }

  // 4. Fingerspelling sequence fallback
  if (gesture?.fallbackType === 'fingerspelling' || (lookupWord && lookupWord.length <= 6)) {
    const fingerspellingPoses = getFingerspellingPoses(lookupWord);
    return {
      ...DEFAULT_MISSING_POSE,
      glossWord: lookupWord || 'SPELL',
      description: `Playing a letter-by-letter fingerspelling fallback for ${lookupWord || 'the current word'}.`,
      fingerspellingPoses,
      warning: `Mapped sign not found for ${lookupWord}. Using fingerspelling fallback.`,
    };
  }

  return {
    ...DEFAULT_MISSING_POSE,
    glossWord: lookupWord || 'READY',
    description: DEFAULT_MISSING_POSE.description,
    warning:
      gesture?.fallbackType === 'gesture_not_available'
        ? `Gesture data is not available for ${lookupWord || 'this gloss word'}.`
        : '',
  };
};


export const getKnownGesturePoseLibrary = () =>
  Object.values(GESTURE_POSE_LIBRARY).map((entry) => ({
    glossWord: entry.glossWord,
    description: entry.description,
    leftHandPose: entry.leftHandPose,
    rightHandPose: entry.rightHandPose,
  }));
