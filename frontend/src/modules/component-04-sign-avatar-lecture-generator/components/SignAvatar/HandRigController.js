const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

const HAND_LABELS = {
  0: 'Wrist',
  4: 'Thumb',
  8: 'Index',
  12: 'Middle',
  16: 'Ring',
  20: 'Pinky',
};

const DEFAULT_FINGER_CURLS = {
  thumb: 0.28,
  index: 0.18,
  middle: 0.18,
  ring: 0.2,
  pinky: 0.24,
};

const DEFAULT_LEFT_HAND = {
  position: { x: 330, y: 302, z: 0 },
  scale: 1,
  wristAngle: -10,
  palmAngle: -6,
  fingerSpread: 1,
  thumbSpread: 26,
  fingerCurls: DEFAULT_FINGER_CURLS,
};

const DEFAULT_RIGHT_HAND = {
  position: { x: 570, y: 302, z: 0 },
  scale: 1,
  wristAngle: 10,
  palmAngle: 6,
  fingerSpread: 1,
  thumbSpread: 26,
  fingerCurls: DEFAULT_FINGER_CURLS,
};

const round = (value) => Number(value.toFixed(3));
const toRadians = (degrees) => (degrees * Math.PI) / 180;

const rotatePoint = (point, angle) => {
  const radians = toRadians(angle);
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
};

const mirrorPoint = (point, side) => ({
  x: side === 'left' ? -point.x : point.x,
  y: point.y,
  z: point.z || 0,
});

const scalePoint = (point, scale) => ({
  x: point.x * scale,
  y: point.y * scale,
  z: (point.z || 0) * scale,
});

const transformLocalPoint = (localPoint, pose, side) => {
  const mirrored = mirrorPoint(localPoint, side);
  const scaled = scalePoint(mirrored, pose.scale || 1);
  const rotated = rotatePoint(scaled, pose.wristAngle || 0);

  return {
    x: round((pose.position?.x || 0) + rotated.x),
    y: round((pose.position?.y || 0) + rotated.y),
    z: round((pose.position?.z || 0) + rotated.z),
  };
};

const buildFingerPoints = ({
  basePoint,
  baseAngle,
  curl,
  lengths,
}) => {
  // A human finger flexes from the MCP knuckle joint forward/down over the palm,
  // then the PIP and DIP joints curl inwards into the palm crease.
  const mcpFlex = curl * 78;
  const pipFlex = curl * 88;
  const dipFlex = curl * 74;
  const bends = [mcpFlex, pipFlex, dipFlex];
  const points = [basePoint];
  let currentPoint = basePoint;
  let currentAngle = baseAngle + mcpFlex;

  lengths.forEach((length, index) => {
    if (index > 0) {
      currentAngle += bends[index];
    }

    // Foreshortening compression when curled towards viewer
    const foreshorten = 1 - curl * 0.22;
    currentPoint = {
      x: currentPoint.x + Math.cos(toRadians(currentAngle)) * (length * foreshorten),
      y: currentPoint.y + Math.sin(toRadians(currentAngle)) * (length * foreshorten),
      z: 0,
    };
    points.push(currentPoint);
  });

  return points;
};

const buildThumbPoints = ({
  basePoint,
  spread,
  curl,
}) => {
  // When curl is low (A, L, Y), thumb extends upright/outwards.
  // When curl is high (B, M, N, S, T), thumb folds across palm.
  const baseAngle = -135 + spread * 1.4 - curl * 75;
  const mcpAngle = baseAngle + curl * 40;
  const ipAngle = mcpAngle + curl * 55;
  const thumbAngles = [baseAngle, mcpAngle, ipAngle];
  const thumbLengths = [28, 22, 20];
  const points = [basePoint];
  let currentPoint = basePoint;

  thumbLengths.forEach((length, index) => {
    const foreshorten = 1 - curl * 0.18;
    currentPoint = {
      x: currentPoint.x + Math.cos(toRadians(thumbAngles[index])) * (length * foreshorten),
      y: currentPoint.y + Math.sin(toRadians(thumbAngles[index])) * (length * foreshorten),
      z: 0,
    };
    points.push(currentPoint);
  });

  return points;
};


const mergePose = (pose, side) => {
  const base = side === 'left' ? DEFAULT_LEFT_HAND : DEFAULT_RIGHT_HAND;
  return {
    ...base,
    ...pose,
    position: {
      ...base.position,
      ...(pose?.position || {}),
    },
    fingerCurls: {
      ...DEFAULT_FINGER_CURLS,
      ...(pose?.fingerCurls || {}),
    },
  };
};

export const createHandLandmarks = (poseInput, side = 'right') => {
  const pose = mergePose(poseInput, side);
  const fingerSpread = pose.fingerSpread || 1;
  const palmAngle = pose.palmAngle || 0;
  const spread = pose.thumbSpread || 24;

  const localWrist = { x: 0, y: 0, z: 0 };
  const thumbBase = { x: -38, y: -12, z: 0 };
  const indexBase = { x: -18 * fingerSpread, y: -64, z: 0 };
  const middleBase = { x: 0, y: -76, z: 0 };
  const ringBase = { x: 18 * fingerSpread, y: -68, z: 0 };
  const pinkyBase = { x: 34 * fingerSpread, y: -54, z: 0 };

  const thumbPoints = buildThumbPoints({
    basePoint: thumbBase,
    spread,
    curl: pose.fingerCurls.thumb,
  });

  const indexPoints = buildFingerPoints({
    basePoint: indexBase,
    baseAngle: -92 + palmAngle - 10 * fingerSpread,
    curl: pose.fingerCurls.index,
    lengths: [34, 26, 20],
  });

  const middlePoints = buildFingerPoints({
    basePoint: middleBase,
    baseAngle: -90 + palmAngle,
    curl: pose.fingerCurls.middle,
    lengths: [38, 28, 22],
  });

  const ringPoints = buildFingerPoints({
    basePoint: ringBase,
    baseAngle: -84 + palmAngle + 8 * fingerSpread,
    curl: pose.fingerCurls.ring,
    lengths: [34, 25, 19],
  });

  const pinkyPoints = buildFingerPoints({
    basePoint: pinkyBase,
    baseAngle: -72 + palmAngle + 12 * fingerSpread,
    curl: pose.fingerCurls.pinky,
    lengths: [28, 21, 17],
  });

  const localLandmarks = [
    localWrist,
    ...thumbPoints,
    ...indexPoints,
    ...middlePoints,
    ...ringPoints,
    ...pinkyPoints,
  ];

  return localLandmarks.map((point, index) => ({
    ...transformLocalPoint(point, pose, side),
    id: index,
  }));
};

export const createAvatarHands = (leftPose, rightPose) => ({
  left: createHandLandmarks(leftPose, 'left'),
  right: createHandLandmarks(rightPose, 'right'),
});

export const interpolateLandmarks = (start, end, t) => {
  const safeStart = start?.length ? start : end || [];
  const safeEnd = end?.length ? end : start || [];

  return safeEnd.map((targetPoint, index) => {
    const sourcePoint = safeStart[index] || targetPoint;
    return {
      x: round(sourcePoint.x + (targetPoint.x - sourcePoint.x) * t),
      y: round(sourcePoint.y + (targetPoint.y - sourcePoint.y) * t),
      z: round((sourcePoint.z || 0) + ((targetPoint.z || 0) - (sourcePoint.z || 0)) * t),
      id: targetPoint.id ?? index,
    };
  });
};

export const interpolateAvatarHands = (startPose, endPose, t) => ({
  left: interpolateLandmarks(startPose?.left, endPose?.left, t),
  right: interpolateLandmarks(startPose?.right, endPose?.right, t),
});

export const getPalmPolygon = (landmarks = []) => {
  if (!landmarks.length) return '';

  const palmIndexes = [0, 1, 5, 9, 13, 17];
  return palmIndexes
    .map((index) => {
      const point = landmarks[index];
      return `${point.x},${point.y}`;
    })
    .join(' ');
};

export const getPalmPath = (landmarks = []) => {
  if (landmarks.length < 18) return '';

  const wrist = landmarks[0];
  const thumb = landmarks[1];
  const index = landmarks[5];
  const middle = landmarks[9];
  const ring = landmarks[13];
  const pinky = landmarks[17];

  return [
    `M ${wrist.x} ${wrist.y}`,
    `C ${wrist.x - 24} ${wrist.y - 18}, ${thumb.x - 14} ${thumb.y + 18}, ${thumb.x} ${thumb.y}`,
    `C ${index.x - 18} ${index.y + 18}, ${index.x - 8} ${index.y + 4}, ${index.x} ${index.y}`,
    `C ${middle.x - 8} ${middle.y + 6}, ${middle.x + 8} ${middle.y + 6}, ${middle.x} ${middle.y}`,
    `C ${ring.x - 7} ${ring.y + 5}, ${ring.x + 11} ${ring.y + 9}, ${ring.x} ${ring.y}`,
    `C ${pinky.x - 4} ${pinky.y + 6}, ${pinky.x + 12} ${pinky.y + 16}, ${pinky.x} ${pinky.y}`,
    `C ${pinky.x + 8} ${pinky.y + 34}, ${wrist.x + 24} ${wrist.y - 8}, ${wrist.x} ${wrist.y}`,
    'Z',
  ].join(' ');
};

export const getElbowPoint = (shoulder, wrist, side = 'right') => {
  const offset = side === 'left' ? -54 : 54;
  return {
    x: round((shoulder.x + wrist.x) / 2 + offset),
    y: round((shoulder.y + wrist.y) / 2 - 28),
  };
};

export const HAND_JOINT_LABELS = HAND_LABELS;
export { HAND_CONNECTIONS };
