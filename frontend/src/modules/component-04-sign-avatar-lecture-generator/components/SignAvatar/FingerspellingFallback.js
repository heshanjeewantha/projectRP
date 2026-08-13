const LETTER_POSE_GROUPS = {
  A: { thumb: 0.18, index: 0.96, middle: 0.96, ring: 0.96, pinky: 0.96, palmAngle: 2, wristAngle: 6, fingerSpread: 0.94, thumbSpread: 18, yShift: 4 },
  B: { thumb: 0.88, index: 0.1, middle: 0.1, ring: 0.12, pinky: 0.16, palmAngle: 0, wristAngle: 10, fingerSpread: 1.06, thumbSpread: 30, yShift: -4 },
  C: { thumb: 0.34, index: 0.46, middle: 0.42, ring: 0.46, pinky: 0.52, palmAngle: 0, wristAngle: 8, fingerSpread: 1, thumbSpread: 24 },
  D: { thumb: 0.4, index: 0.08, middle: 0.94, ring: 0.96, pinky: 0.96, palmAngle: -8, wristAngle: 14, fingerSpread: 0.94, thumbSpread: 22, yShift: -10 },
  E: { thumb: 0.78, index: 0.98, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: 2, wristAngle: 4, fingerSpread: 0.92, thumbSpread: 16, yShift: 6 },
  F: { thumb: 0.12, index: 0.22, middle: 0.08, ring: 0.08, pinky: 0.1, palmAngle: 8, wristAngle: 12, fingerSpread: 1, thumbSpread: 22, xShift: 6 },
  G: { thumb: 0.32, index: 0.08, middle: 0.96, ring: 0.98, pinky: 0.98, palmAngle: -20, wristAngle: 22, fingerSpread: 0.92, thumbSpread: 20, xShift: 10 },
  H: { thumb: 0.58, index: 0.08, middle: 0.08, ring: 0.96, pinky: 0.98, palmAngle: -14, wristAngle: 18, fingerSpread: 0.98, thumbSpread: 20, xShift: 12 },
  I: { thumb: 0.76, index: 0.98, middle: 0.98, ring: 0.96, pinky: 0.08, palmAngle: 8, wristAngle: 10, fingerSpread: 0.94, thumbSpread: 18, yShift: -2 },
  J: { thumb: 0.74, index: 0.98, middle: 0.98, ring: 0.96, pinky: 0.08, palmAngle: 14, wristAngle: 18, fingerSpread: 0.94, thumbSpread: 18, xShift: 14, yShift: 8 },
  K: { thumb: 0.24, index: 0.08, middle: 0.1, ring: 0.96, pinky: 0.98, palmAngle: -4, wristAngle: 14, fingerSpread: 1.08, thumbSpread: 28, yShift: -6 },
  L: { thumb: 0.08, index: 0.08, middle: 0.96, ring: 0.98, pinky: 0.98, palmAngle: -8, wristAngle: 12, fingerSpread: 0.96, thumbSpread: 32, yShift: -4 },
  M: { thumb: 0.9, index: 0.84, middle: 0.86, ring: 0.88, pinky: 0.98, palmAngle: 0, wristAngle: 4, fingerSpread: 0.92, thumbSpread: 14, yShift: 4 },
  N: { thumb: 0.84, index: 0.82, middle: 0.84, ring: 0.98, pinky: 0.98, palmAngle: 0, wristAngle: 4, fingerSpread: 0.92, thumbSpread: 15, yShift: 4 },
  O: { thumb: 0.28, index: 0.34, middle: 0.34, ring: 0.36, pinky: 0.4, palmAngle: 0, wristAngle: 8, fingerSpread: 0.98, thumbSpread: 24 },
  P: { thumb: 0.28, index: 0.08, middle: 0.1, ring: 0.96, pinky: 0.98, palmAngle: 18, wristAngle: 22, fingerSpread: 1.04, thumbSpread: 24, xShift: 10, yShift: 10 },
  Q: { thumb: 0.32, index: 0.08, middle: 0.96, ring: 0.98, pinky: 0.98, palmAngle: 18, wristAngle: 20, fingerSpread: 0.94, thumbSpread: 20, xShift: 10, yShift: 10 },
  R: { thumb: 0.82, index: 0.08, middle: 0.08, ring: 0.96, pinky: 0.98, palmAngle: -2, wristAngle: 10, fingerSpread: 0.98, thumbSpread: 18, yShift: -6 },
  S: { thumb: 0.18, index: 0.98, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: 0, wristAngle: 4, fingerSpread: 0.92, thumbSpread: 14, yShift: 6 },
  T: { thumb: 0.1, index: 0.98, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: 0, wristAngle: 4, fingerSpread: 0.92, thumbSpread: 10, yShift: 4 },
  U: { thumb: 0.58, index: 0.08, middle: 0.1, ring: 0.98, pinky: 0.98, palmAngle: -4, wristAngle: 10, fingerSpread: 0.96, thumbSpread: 18, yShift: -8 },
  V: { thumb: 0.64, index: 0.08, middle: 0.08, ring: 0.98, pinky: 0.98, palmAngle: -6, wristAngle: 10, fingerSpread: 1.08, thumbSpread: 18, yShift: -8 },
  W: { thumb: 0.68, index: 0.08, middle: 0.08, ring: 0.08, pinky: 0.98, palmAngle: 0, wristAngle: 8, fingerSpread: 1.12, thumbSpread: 18, yShift: -8 },
  X: { thumb: 0.72, index: 0.48, middle: 0.98, ring: 0.98, pinky: 0.98, palmAngle: -6, wristAngle: 12, fingerSpread: 0.94, thumbSpread: 16, yShift: -4 },
  Y: { thumb: 0.08, index: 0.98, middle: 0.98, ring: 0.98, pinky: 0.08, palmAngle: 6, wristAngle: 10, fingerSpread: 1.02, thumbSpread: 30, yShift: -2 },
  Z: { thumb: 0.42, index: 0.08, middle: 0.96, ring: 0.98, pinky: 0.98, palmAngle: -10, wristAngle: 18, fingerSpread: 0.94, thumbSpread: 20, xShift: 12, yShift: -8 },
};

const DEFAULT_GROUP = {
  thumb: 0.34,
  index: 0.34,
  middle: 0.38,
  ring: 0.42,
  pinky: 0.46,
  palmAngle: 0,
  wristAngle: 10,
  fingerSpread: 1,
  thumbSpread: 24,
  xShift: 0,
  yShift: 0,
};

const LEFT_SUPPORT_POSE = {
  position: { x: 342, y: 308, z: 0 },
  scale: 1,
  wristAngle: -8,
  palmAngle: -4,
  fingerSpread: 1,
  thumbSpread: 26,
  fingerCurls: {
    thumb: 0.24,
    index: 0.18,
    middle: 0.2,
    ring: 0.26,
    pinky: 0.3,
  },
};

const createLetterPose = (letter, side = 'right', sequenceIndex = 0) => {
  const group = LETTER_POSE_GROUPS[letter] || DEFAULT_GROUP;
  const motionOffset = Math.min(sequenceIndex * 3, 15);

  if (side === 'left') {
    return {
      ...LEFT_SUPPORT_POSE,
      position: {
        ...LEFT_SUPPORT_POSE.position,
        x: LEFT_SUPPORT_POSE.position.x - motionOffset * 0.5,
        y: LEFT_SUPPORT_POSE.position.y + (sequenceIndex % 2 === 0 ? 0 : 2),
      },
    };
  }

  return {
    position: {
      x: 560 + (group.xShift || 0) + motionOffset,
      y: 304 + (group.yShift || 0),
      z: 0,
    },
    scale: 1,
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
        label: 'READY',
        leftHandPose: LEFT_SUPPORT_POSE,
        rightHandPose: createLetterPose('B', 'right', 0),
      },
    ];
  }

  return letters.map((letter, index) => ({
    label: `${letter}-${index + 1}`,
    leftHandPose: createLetterPose(letter, 'left', index),
    rightHandPose: createLetterPose(letter, 'right', index),
  }));
};
