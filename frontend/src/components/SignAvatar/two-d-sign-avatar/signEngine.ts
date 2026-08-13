import dictionary from './signDictionary.json';

export type SignPose = {
  leftShoulderAngle: number;
  leftElbowAngle: number;
  rightShoulderAngle: number;
  rightElbowAngle: number;
};
export type SignFrame = SignPose & { time: number };
export type AnimationState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETE';

export const neutralPose: SignPose = {
  leftShoulderAngle: 2.35,
  leftElbowAngle: -1.55,
  rightShoulderAngle: 0.79,
  rightElbowAngle: 1.55,
};

const signDictionary = dictionary as Record<string, SignFrame[]>;
const clamp = (value: number) => Math.min(1, Math.max(0, value));
/** Smooth acceleration/deceleration for every Canvas sign transition. */
export const easeInOutQuad = (value: number) => {
  const t = clamp(value);
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
};
const blendPose = (from: SignPose, to: SignPose, alpha: number): SignPose => ({
  leftShoulderAngle: from.leftShoulderAngle + (to.leftShoulderAngle - from.leftShoulderAngle) * alpha,
  leftElbowAngle: from.leftElbowAngle + (to.leftElbowAngle - from.leftElbowAngle) * alpha,
  rightShoulderAngle: from.rightShoulderAngle + (to.rightShoulderAngle - from.rightShoulderAngle) * alpha,
  rightElbowAngle: from.rightElbowAngle + (to.rightElbowAngle - from.rightElbowAngle) * alpha,
});

export const getSignFrames = (word: string): SignFrame[] => signDictionary[word.toLowerCase()] || [];

/** Samples one frame-based sign, then eases back to the natural neutral pose. */
export const playSign = (word: string, elapsedSeconds: number): { pose: SignPose; completed: boolean; frame: number; totalFrames: number } => {
  const frames = getSignFrames(word);
  if (!frames.length) return { pose: neutralPose, completed: true, frame: 0, totalFrames: 0 };
  const duration = frames.at(-1)?.time || 1;
  if (elapsedSeconds >= duration + 0.22) return { pose: neutralPose, completed: true, frame: frames.length, totalFrames: frames.length };
  if (elapsedSeconds > duration) return { pose: blendPose(frames.at(-1)!, neutralPose, easeInOutQuad((elapsedSeconds - duration) / 0.22)), completed: false, frame: frames.length, totalFrames: frames.length };
  const foundIndex = frames.findIndex((frame, index) => index < frames.length - 1 && elapsedSeconds >= frame.time && elapsedSeconds <= frames[index + 1].time);
  const index = Math.max(0, foundIndex);
  const current = frames[index];
  const next = frames[index + 1] || current;
  const progress = next.time === current.time ? 1 : (elapsedSeconds - current.time) / (next.time - current.time);
  return { pose: blendPose(current, next, easeInOutQuad(progress)), completed: false, frame: index + 1, totalFrames: frames.length };
};

/** Creates a sentence queue that future landmark, dataset, and 3D adapters can reuse. */
export const playSentence = (keywords: string[]): string[] => keywords.filter((word) => getSignFrames(word).length > 0);
