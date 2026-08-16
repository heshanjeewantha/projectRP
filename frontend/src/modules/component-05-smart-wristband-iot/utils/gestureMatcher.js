/**
 * ICT Sign Language Gesture Evaluator & Landmark Analyzer
 * Calculates hand geometry, finger extension status, orientation, and matches against keyword rules.
 */

// Landmark Indices according to MediaPipe Hands standard:
// 0: Wrist
// 1-4: Thumb (CMC, MCP, IP, Tip)
// 5-8: Index (MCP, PIP, DIP, Tip)
// 9-12: Middle (MCP, PIP, DIP, Tip)
// 13-16: Ring (MCP, PIP, DIP, Tip)
// 17-20: Pinky (MCP, PIP, DIP, Tip)

export const isFingerExtended = (landmarks, tipIdx, pipIdx) => {
  if (!landmarks || landmarks.length < 21) return false;
  const wrist = landmarks[0];
  const tip = landmarks[tipIdx];
  const pip = landmarks[pipIdx];

  const distTip = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
  const distPip = Math.hypot(pip.x - wrist.x, pip.y - wrist.y);
  return distTip > distPip * 1.12;
};

export const getFingerExtensions = (landmarks) => {
  if (!landmarks || landmarks.length < 21) {
    return { thumb: false, index: false, middle: false, ring: false, pinky: false, count: 0 };
  }

  const thumb = isFingerExtended(landmarks, 4, 2);
  const index = isFingerExtended(landmarks, 8, 6);
  const middle = isFingerExtended(landmarks, 12, 10);
  const ring = isFingerExtended(landmarks, 16, 14);
  const pinky = isFingerExtended(landmarks, 20, 18);

  const count = [thumb, index, middle, ring, pinky].filter(Boolean).length;
  return { thumb, index, middle, ring, pinky, count };
};

export const evaluateGestureMatch = (keyword, landmarks) => {
  if (!landmarks || landmarks.length < 21) {
    return {
      isMatch: false,
      confidence: 0,
      accuracy: 0,
      feedback: 'Position your hand clearly inside the camera frame.',
      sinhalaFeedback: 'ඔබේ අත කැමරාව ඉදිරියේ පැහැදිලිව තබන්න.',
      errors: ['No hand detected'],
    };
  }

  const ext = getFingerExtensions(landmarks);
  const normalizedKw = String(keyword || '').toLowerCase().trim();

  let targetFingerCount = 5;
  let expectedRules = {};
  let errors = [];

  switch (normalizedKw) {
    case 'computer':
    case 'output':
    case 'internet':
      // Open hand, all 5 fingers spread
      targetFingerCount = 5;
      expectedRules = { thumb: true, index: true, middle: true, ring: true, pinky: true };
      if (!ext.index) errors.push('Extend index finger');
      if (!ext.middle) errors.push('Extend middle finger');
      if (!ext.thumb) errors.push('Open thumb');
      break;

    case 'hardware':
    case 'cloud':
    case 'password':
      // Fist / closed hand
      targetFingerCount = 0;
      expectedRules = { index: false, middle: false, ring: false, pinky: false };
      if (ext.index) errors.push('Close index into fist');
      if (ext.middle) errors.push('Close middle finger');
      if (ext.ring) errors.push('Close ring finger');
      if (ext.pinky) errors.push('Close pinky finger');
      break;

    case 'software':
    case 'email':
    case 'program':
      // Index + Middle extended (V/two fingers)
      targetFingerCount = 2;
      expectedRules = { index: true, middle: true, ring: false, pinky: false };
      if (!ext.index) errors.push('Extend index finger');
      if (!ext.middle) errors.push('Extend middle finger');
      if (ext.ring) errors.push('Fold ring finger');
      if (ext.pinky) errors.push('Fold pinky finger');
      break;

    case 'input':
    case 'algorithm':
      // Pointing index finger
      targetFingerCount = 1;
      expectedRules = { index: true, middle: false, ring: false, pinky: false };
      if (!ext.index) errors.push('Point index finger forward');
      if (ext.middle) errors.push('Fold middle finger down');
      if (ext.ring) errors.push('Fold ring finger down');
      break;

    case 'cpu':
    case 'data':
      // Thumb + Index (C/pinched shape)
      targetFingerCount = 2;
      expectedRules = { thumb: true, index: true, ring: false, pinky: false };
      if (!ext.index) errors.push('Form C-shape with index and thumb');
      if (ext.pinky) errors.push('Keep pinky folded');
      break;

    case 'security':
    case 'memory':
      // 2 or 3 fingers extended
      targetFingerCount = 2;
      expectedRules = { index: true, middle: true, ring: false, pinky: false };
      if (!ext.index || !ext.middle) errors.push('Extend index and middle straight');
      break;

    case 'server':
    case 'network':
      // 3 fingers (thumb, index, pinky / middle)
      targetFingerCount = 3;
      expectedRules = { thumb: true, index: true, pinky: true };
      if (!ext.index) errors.push('Extend index finger');
      break;

    default:
      targetFingerCount = 4;
      expectedRules = { index: true, middle: true };
      break;
  }

  // Calculate matching score
  let matchedCriteria = 0;
  let totalCriteria = Object.keys(expectedRules).length;

  Object.entries(expectedRules).forEach(([finger, expectedState]) => {
    if (ext[finger] === expectedState) {
      matchedCriteria += 1;
    }
  });

  const accuracy = Math.round((matchedCriteria / Math.max(1, totalCriteria)) * 100);
  const confidence = accuracy / 100;
  const isMatch = accuracy >= 75;

  let feedback = isMatch
    ? `Excellent! Hand pose accurately matches '${normalizedKw.toUpperCase()}'.`
    : `Pose mismatch: ${errors.join(', ') || 'Adjust finger positions'}.`;

  let secondaryHint = isMatch
    ? `Gesture '${normalizedKw.toUpperCase()}' held successfully.`
    : `Correction: ${errors.length > 0 ? errors[0] : 'Adjust finger positions'}`;

  return {
    isMatch,
    confidence,
    accuracy,
    feedback,
    secondaryHint,
    errors,
    fingerStats: ext,
  };
};

/**
 * Helper to generate synthetic realistic hand landmarks for visual preview or mock evaluation.
 */
export const generateDemoLandmarks = (keyword, accuracyTarget = 90) => {
  const isHighAccuracy = accuracyTarget >= 75;
  const normalizedKw = String(keyword || '').toLowerCase();

  const baseWrist = { x: 0.5, y: 0.8, z: 0 };
  const landmarks = [baseWrist];

  // 21 standard nodes with realistic coordinate offsets
  for (let i = 1; i <= 20; i++) {
    const fingerIdx = Math.floor((i - 1) / 4);
    const jointIdx = ((i - 1) % 4) + 1;
    const xSpread = (fingerIdx - 2) * 0.08;
    const yHeight = 0.8 - jointIdx * (isHighAccuracy ? 0.12 : 0.06);

    landmarks.push({
      x: Math.min(0.9, Math.max(0.1, 0.5 + xSpread + (Math.random() - 0.5) * 0.02)),
      y: Math.min(0.9, Math.max(0.1, yHeight + (Math.random() - 0.5) * 0.02)),
      z: (Math.random() - 0.5) * 0.05,
    });
  }

  return landmarks;
};
