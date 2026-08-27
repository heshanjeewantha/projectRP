const LETTER_POSE_GROUPS = {
  A: { thumb: 0.05, index: 0.98, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: 2, wristAngle: 6, fingerSpread: 0.9, thumbSpread: 12, yShift: 4 },
  B: { thumb: 0.95, index: 0.02, middle: 0.02, ring: 0.02, pinky: 0.02, palmAngle: 0, wristAngle: 10, fingerSpread: 0.65, thumbSpread: 30, yShift: -4 },
  C: { thumb: 0.35, index: 0.45, middle: 0.45, ring: 0.45, pinky: 0.45, palmAngle: 0, wristAngle: 8, fingerSpread: 0.85, thumbSpread: 26 },
  D: { thumb: 0.75, index: 0.02, middle: 0.88, ring: 0.92, pinky: 0.95, palmAngle: -8, wristAngle: 14, fingerSpread: 0.8, thumbSpread: 22, yShift: -10 },
  E: { thumb: 0.90, index: 0.96, middle: 0.96, ring: 0.96, pinky: 0.96, palmAngle: 2, wristAngle: 4, fingerSpread: 0.7, thumbSpread: 16, yShift: 6 },
  F: { thumb: 0.45, index: 0.55, middle: 0.02, ring: 0.02, pinky: 0.02, palmAngle: 8, wristAngle: 12, fingerSpread: 1.15, thumbSpread: 22, xShift: 6 },
  G: { thumb: 0.15, index: 0.05, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: -30, wristAngle: 26, fingerSpread: 0.9, thumbSpread: 20, xShift: 12 },
  H: { thumb: 0.75, index: 0.05, middle: 0.05, ring: 0.98, pinky: 0.98, palmAngle: -26, wristAngle: 24, fingerSpread: 0.7, thumbSpread: 20, xShift: 12 },
  I: { thumb: 0.85, index: 0.98, middle: 0.98, ring: 0.98, pinky: 0.02, palmAngle: 8, wristAngle: 10, fingerSpread: 0.9, thumbSpread: 18, yShift: -2 },
  J: { thumb: 0.85, index: 0.98, middle: 0.98, ring: 0.98, pinky: 0.02, palmAngle: 18, wristAngle: 26, fingerSpread: 0.9, thumbSpread: 18, xShift: 14, yShift: 8 },
  K: { thumb: 0.15, index: 0.02, middle: 0.12, ring: 0.98, pinky: 0.98, palmAngle: -4, wristAngle: 14, fingerSpread: 1.25, thumbSpread: 28, yShift: -6 },
  L: { thumb: 0.02, index: 0.02, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: -8, wristAngle: 12, fingerSpread: 0.9, thumbSpread: 36, yShift: -4 },
  M: { thumb: 0.95, index: 0.88, middle: 0.88, ring: 0.88, pinky: 0.98, palmAngle: 0, wristAngle: 4, fingerSpread: 0.85, thumbSpread: 12, yShift: 4 },
  N: { thumb: 0.95, index: 0.88, middle: 0.88, ring: 0.98, pinky: 0.98, palmAngle: 0, wristAngle: 4, fingerSpread: 0.85, thumbSpread: 14, yShift: 4 },
  O: { thumb: 0.42, index: 0.45, middle: 0.45, ring: 0.45, pinky: 0.45, palmAngle: 0, wristAngle: 8, fingerSpread: 0.9, thumbSpread: 24 },
  P: { thumb: 0.22, index: 0.05, middle: 0.15, ring: 0.98, pinky: 0.98, palmAngle: 22, wristAngle: 32, fingerSpread: 1.1, thumbSpread: 24, xShift: 10, yShift: 10 },
  Q: { thumb: 0.22, index: 0.05, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: 22, wristAngle: 32, fingerSpread: 0.9, thumbSpread: 20, xShift: 10, yShift: 10 },
  R: { thumb: 0.85, index: 0.02, middle: 0.02, ring: 0.98, pinky: 0.98, palmAngle: -2, wristAngle: 10, fingerSpread: 0.45, thumbSpread: 18, yShift: -6 },
  S: { thumb: 0.85, index: 0.98, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: 0, wristAngle: 4, fingerSpread: 0.85, thumbSpread: 10, yShift: 6 },
  T: { thumb: 0.75, index: 0.95, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: 0, wristAngle: 4, fingerSpread: 0.85, thumbSpread: 10, yShift: 4 },
  U: { thumb: 0.85, index: 0.02, middle: 0.02, ring: 0.98, pinky: 0.98, palmAngle: -4, wristAngle: 10, fingerSpread: 0.55, thumbSpread: 18, yShift: -8 },
  V: { thumb: 0.85, index: 0.02, middle: 0.02, ring: 0.98, pinky: 0.98, palmAngle: -6, wristAngle: 10, fingerSpread: 1.35, thumbSpread: 18, yShift: -8 },
  W: { thumb: 0.85, index: 0.02, middle: 0.02, ring: 0.02, pinky: 0.98, palmAngle: 0, wristAngle: 8, fingerSpread: 1.35, thumbSpread: 18, yShift: -8 },
  X: { thumb: 0.85, index: 0.55, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: -6, wristAngle: 12, fingerSpread: 0.9, thumbSpread: 16, yShift: -4 },
  Y: { thumb: 0.02, index: 0.98, middle: 0.98, ring: 0.98, pinky: 0.02, palmAngle: 6, wristAngle: 10, fingerSpread: 1.02, thumbSpread: 35, yShift: -2 },
  Z: { thumb: 0.85, index: 0.05, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: -14, wristAngle: 18, fingerSpread: 0.9, thumbSpread: 20, xShift: 12, yShift: -8 },
};

const DEFAULT_GROUP = {
  thumb: 0.05,
  index: 0.98,
  middle: 0.98,
  ring: 0.98,
  pinky: 0.98,
  palmAngle: 0,
  wristAngle: 8,
  fingerSpread: 1,
  thumbSpread: 18,
  xShift: 0,
  yShift: 0,
};

const LEFT_SUPPORT_POSE = {
  position: { x: 320, y: 440, z: 0 },
  scale: 0.85,
  wristAngle: -15,
  palmAngle: -8,
  fingerSpread: 0.8,
  thumbSpread: 18,
  fingerCurls: {
    thumb: 0.7,
    index: 0.75,
    middle: 0.78,
    ring: 0.8,
    pinky: 0.82,
  },
};

export const createLetterPose = (letter, side = 'right', sequenceIndex = 0) => {
  const char = (letter || 'A').toUpperCase();
  const group = LETTER_POSE_GROUPS[char] || DEFAULT_GROUP;
  const motionOffset = Math.min(sequenceIndex * 2, 10);

  if (side === 'left') {
    return {
      ...LEFT_SUPPORT_POSE,
      position: {
        ...LEFT_SUPPORT_POSE.position,
        y: LEFT_SUPPORT_POSE.position.y + (sequenceIndex % 2 === 0 ? 0 : 2),
      },
    };
  }

  return {
    position: {
      x: 530 + (group.xShift || 0) + motionOffset,
      y: 270 + (group.yShift || 0),
      z: 0,
    },
    scale: 1.15,
    wristAngle: group.wristAngle ?? 10,
    palmAngle: group.palmAngle ?? 0,
    fingerSpread: group.fingerSpread ?? 1,
    thumbSpread: group.thumbSpread ?? 24,
    fingerCurls: {
      thumb: group.thumb,
      index: group.index,
      middle: group.middle,
      ring: group.ring,
      pinky: group.pinky,
    },
  };
};

export const getFingerspellingPoses = (word = '') => {
  const letters = word.toUpperCase().replace(/[^A-Z]/g, '').split('');
  if (!letters.length) {
    return [
      {
        label: 'A',
        letter: 'A',
        leftHandPose: LEFT_SUPPORT_POSE,
        rightHandPose: createLetterPose('A', 'right', 0),
      },
    ];
  }

  return letters.map((letter, index) => ({
    label: `${letter}`,
    letter: letter,
    leftHandPose: createLetterPose(letter, 'left', index),
    rightHandPose: createLetterPose(letter, 'right', index),
  }));
};

export const getSingleLetterPose = (letter = 'A') => {
  const char = (letter || 'A').toUpperCase().charAt(0);
  return {
    glossWord: char,
    description: `ASL Manual Alphabet Letter ${char}`,
    leftHandPose: createLetterPose(char, 'left', 0),
    rightHandPose: createLetterPose(char, 'right', 0),
  };
};
