import dictionary from './signDictionary.json';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignPose = {
  leftShoulderAngle: number;
  leftElbowAngle: number;
  rightShoulderAngle: number;
  rightElbowAngle: number;
};
export type SignFrame = SignPose & { time: number };
export type AnimationState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETE';

/** A 21-point MediaPipe hand landmark (normalised 0-1 coords). */
export type LandmarkPoint = { x: number; y: number; z: number };

/** One frame from the /api/signs/landmark-sequence response. */
export type LandmarkFrame = SignPose & {
  time: number;
  leftHand: LandmarkPoint[];
  rightHand: LandmarkPoint[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const neutralPose: SignPose = {
  leftShoulderAngle: 2.35,
  leftElbowAngle: -1.55,
  rightShoulderAngle: 0.79,
  rightElbowAngle: 1.55,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signDictionary = dictionary as Record<string, SignFrame[]>;
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const easeInOutQuad = (value: number) => {
  const t = clamp(value);
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
};

const blendPose = (from: SignPose, to: SignPose, alpha: number): SignPose => ({
  leftShoulderAngle:  from.leftShoulderAngle  + (to.leftShoulderAngle  - from.leftShoulderAngle)  * alpha,
  leftElbowAngle:     from.leftElbowAngle     + (to.leftElbowAngle     - from.leftElbowAngle)     * alpha,
  rightShoulderAngle: from.rightShoulderAngle + (to.rightShoulderAngle - from.rightShoulderAngle) * alpha,
  rightElbowAngle:    from.rightElbowAngle    + (to.rightElbowAngle    - from.rightElbowAngle)    * alpha,
});

const blendLandmarkHand = (
  from: LandmarkPoint[],
  to: LandmarkPoint[],
  alpha: number,
): LandmarkPoint[] => {
  const len = Math.max(from.length, to.length);
  const zero = { x: 0, y: 0, z: 0 };
  return Array.from({ length: len }, (_, i) => {
    const a = from[i] ?? zero;
    const b = to[i]   ?? zero;
    return { x: a.x + (b.x - a.x) * alpha, y: a.y + (b.y - a.y) * alpha, z: a.z + (b.z - a.z) * alpha };
  });
};

// ─── Angle-based dictionary playback ─────────────────────────────────────────

export const getSignFrames = (word: string): SignFrame[] =>
  signDictionary[word.toLowerCase()] || [];

export const playSign = (
  word: string,
  elapsedSeconds: number,
): { pose: SignPose; completed: boolean; frame: number; totalFrames: number } => {
  const frames = getSignFrames(word);
  if (!frames.length) return { pose: neutralPose, completed: true, frame: 0, totalFrames: 0 };
  const duration = frames.at(-1)?.time || 1;
  if (elapsedSeconds >= duration + 0.22)
    return { pose: neutralPose, completed: true, frame: frames.length, totalFrames: frames.length };
  if (elapsedSeconds > duration)
    return {
      pose: blendPose(frames.at(-1)!, neutralPose, easeInOutQuad((elapsedSeconds - duration) / 0.22)),
      completed: false,
      frame: frames.length,
      totalFrames: frames.length,
    };
  const foundIndex = frames.findIndex(
    (frame, index) =>
      index < frames.length - 1 && elapsedSeconds >= frame.time && elapsedSeconds <= frames[index + 1].time,
  );
  const index   = Math.max(0, foundIndex);
  const current = frames[index];
  const next    = frames[index + 1] || current;
  const progress = next.time === current.time ? 1 : (elapsedSeconds - current.time) / (next.time - current.time);
  return { pose: blendPose(current, next, easeInOutQuad(progress)), completed: false, frame: index + 1, totalFrames: frames.length };
};

export const playSentence = (keywords: string[]): string[] =>
  keywords.filter((word) => getSignFrames(word).length > 0);

// ─── Landmark-driven playback ─────────────────────────────────────────────────

export type LandmarkSample = {
  pose: SignPose;
  leftHand: LandmarkPoint[];
  rightHand: LandmarkPoint[];
  completed: boolean;
  frame: number;
  totalFrames: number;
};

/** Samples one landmark-based sign sequence at `elapsedSeconds`, interpolating between frames. */
export const playLandmarkSign = (
  frames: LandmarkFrame[],
  elapsedSeconds: number,
): LandmarkSample => {
  if (!frames.length)
    return { pose: neutralPose, leftHand: [], rightHand: [], completed: true, frame: 0, totalFrames: 0 };

  const duration = frames.at(-1)!.time || 1;
  const FADE_OUT = 0.25;

  if (elapsedSeconds >= duration + FADE_OUT)
    return { pose: neutralPose, leftHand: [], rightHand: [], completed: true, frame: frames.length, totalFrames: frames.length };

  if (elapsedSeconds > duration) {
    const alpha = easeInOutQuad((elapsedSeconds - duration) / FADE_OUT);
    const last = frames.at(-1)!;
    return {
      pose:      blendPose(last, neutralPose, alpha),
      leftHand:  blendLandmarkHand(last.leftHand,  [], alpha),
      rightHand: blendLandmarkHand(last.rightHand, [], alpha),
      completed: false,
      frame:     frames.length,
      totalFrames: frames.length,
    };
  }

  const foundIndex = frames.findIndex(
    (f, i) => i < frames.length - 1 && elapsedSeconds >= f.time && elapsedSeconds <= frames[i + 1].time,
  );
  const i   = Math.max(0, foundIndex);
  const cur = frames[i];
  const nxt = frames[i + 1] ?? cur;
  const progress = nxt.time === cur.time ? 1 : (elapsedSeconds - cur.time) / (nxt.time - cur.time);
  const alpha    = easeInOutQuad(progress);
  return {
    pose:      blendPose(cur, nxt, alpha),
    leftHand:  blendLandmarkHand(cur.leftHand,  nxt.leftHand,  alpha),
    rightHand: blendLandmarkHand(cur.rightHand, nxt.rightHand, alpha),
    completed: false,
    frame:     i + 1,
    totalFrames: frames.length,
  };
};
