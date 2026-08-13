import { useEffect, useMemo, useRef, useState } from 'react';

import {
  createAvatarHands,
  getElbowPoint,
  getPalmPath,
  HAND_CONNECTIONS,
  HAND_JOINT_LABELS,
  interpolateAvatarHands,
} from './HandRigController';
import { getGesturePoseData } from './GesturePoseLibrary';

const SPEED_FACTORS = {
  slow: 1.22,
  normal: 1,
  fast: 0.78,
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (start, end, progress) => start + (end - start) * progress;
const easeInOut = (value) => 0.5 - Math.cos(value * Math.PI) / 2;

const formatWarning = (warning) => (warning ? warning : '');

const interpolateHandPose = (startPose, endPose, progress) => ({
  ...startPose,
  position: {
    x: lerp(startPose.position.x, endPose.position.x, progress),
    y: lerp(startPose.position.y, endPose.position.y, progress),
    z: lerp(startPose.position.z || 0, endPose.position.z || 0, progress),
  },
  scale: lerp(startPose.scale || 1, endPose.scale || 1, progress),
  wristAngle: lerp(startPose.wristAngle || 0, endPose.wristAngle || 0, progress),
  palmAngle: lerp(startPose.palmAngle || 0, endPose.palmAngle || 0, progress),
  fingerSpread: lerp(startPose.fingerSpread || 1, endPose.fingerSpread || 1, progress),
  thumbSpread: lerp(startPose.thumbSpread || 24, endPose.thumbSpread || 24, progress),
  fingerCurls: {
    thumb: lerp(startPose.fingerCurls.thumb, endPose.fingerCurls.thumb, progress),
    index: lerp(startPose.fingerCurls.index, endPose.fingerCurls.index, progress),
    middle: lerp(startPose.fingerCurls.middle, endPose.fingerCurls.middle, progress),
    ring: lerp(startPose.fingerCurls.ring, endPose.fingerCurls.ring, progress),
    pinky: lerp(startPose.fingerCurls.pinky, endPose.fingerCurls.pinky, progress),
  },
});

const resolveMotionFramePose = (motionKeyframes, progress) => {
  if (!motionKeyframes?.length) {
    return null;
  }

  if (motionKeyframes.length === 1 || progress <= motionKeyframes[0].progress) {
    return motionKeyframes[0];
  }

  for (let index = 0; index < motionKeyframes.length - 1; index += 1) {
    const currentFrame = motionKeyframes[index];
    const nextFrame = motionKeyframes[index + 1];
    if (progress <= nextFrame.progress) {
      const frameRange = nextFrame.progress - currentFrame.progress || 1;
      const frameProgress = clamp((progress - currentFrame.progress) / frameRange, 0, 1);
      return {
        label: nextFrame.label || currentFrame.label,
        leftHandPose: interpolateHandPose(currentFrame.leftHandPose, nextFrame.leftHandPose, frameProgress),
        rightHandPose: interpolateHandPose(currentFrame.rightHandPose, nextFrame.rightHandPose, frameProgress),
      };
    }
  }

  return motionKeyframes[motionKeyframes.length - 1];
};

const getGestureMetrics = (displayPose, gestureProgress, isPlaying) => {
  const leftWrist = displayPose.left?.[0] || { x: 334, y: 304 };
  const rightWrist = displayPose.right?.[0] || { x: 566, y: 304 };
  const handCenterX = (leftWrist.x + rightWrist.x) / 2;
  const handCenterY = (leftWrist.y + rightWrist.y) / 2;
  const handSpread = Math.abs(rightWrist.x - leftWrist.x);
  const signPulse = isPlaying ? Math.sin(gestureProgress * Math.PI) : 0.18;
  const torsoLean = clamp((handCenterX - 450) / 28, -10, 10);
  const headTilt = clamp((rightWrist.y - leftWrist.y) / 10, -9, 9);
  const headLift = clamp((300 - handCenterY) / 8, -8, 18);
  const shoulderLift = clamp((320 - handCenterY) / 5, 0, 22);
  const breathingOffset = isPlaying ? signPulse * 3.4 : 1.4;
  const stageGlowOpacity = 0.18 + signPulse * 0.28;
  const energyArc = `M${leftWrist.x + 18} ${leftWrist.y - 18} C ${handCenterX - handSpread * 0.18} ${handCenterY - 42 - signPulse * 18}, ${handCenterX + handSpread * 0.18} ${handCenterY - 42 - signPulse * 18}, ${rightWrist.x - 18} ${rightWrist.y - 18}`;

  return {
    leftWrist,
    rightWrist,
    handCenterX,
    handCenterY,
    handSpread,
    signPulse,
    torsoLean,
    headTilt,
    headLift,
    shoulderLift,
    breathingOffset,
    stageGlowOpacity,
    energyArc,
  };
};

const HandRenderer = ({
  hand,
  side,
  showHandLandmarks,
  showFingerLabels,
}) => {
  if (!hand?.length) return null;

  const palmPath = getPalmPath(hand);
  const wrist = hand[0];
  const thumbBase = hand[1];
  const indexBase = hand[5];
  const middleBase = hand[9];
  const ringBase = hand[13];
  const pinkyBase = hand[17];
  const palmCenterX = (thumbBase.x + middleBase.x + pinkyBase.x + wrist.x) / 4;
  const palmCenterY = (thumbBase.y + middleBase.y + pinkyBase.y + wrist.y) / 4;
  const cuffOffset = side === 'left' ? -8 : 8;
  const knucklePath = `M${thumbBase.x} ${thumbBase.y} C ${indexBase.x - 8} ${indexBase.y + 6}, ${ringBase.x + 4} ${ringBase.y + 8}, ${pinkyBase.x} ${pinkyBase.y}`;
  const palmCreasePrimary = `M${wrist.x} ${wrist.y - 2} C ${palmCenterX - 18} ${palmCenterY + 18}, ${palmCenterX + 8} ${palmCenterY - 8}, ${middleBase.x + (side === 'left' ? 4 : -4)} ${middleBase.y - 4}`;
  const palmCreaseSecondary = `M${thumbBase.x + (side === 'left' ? 8 : -8)} ${thumbBase.y + 10} C ${palmCenterX - 8} ${palmCenterY + 12}, ${palmCenterX + 12} ${palmCenterY + 8}, ${ringBase.x} ${ringBase.y + 6}`;

  return (
    <g className={`sign-avatar-hand-group sign-avatar-hand-group-${side}`}>
      <ellipse
        cx={palmCenterX}
        cy={palmCenterY + 11}
        rx={48}
        ry={34}
        className="sign-avatar-palm-shadow"
      />
      <path d={palmPath} className="sign-avatar-palm-shape" />
      <polygon
        points={`${thumbBase.x},${thumbBase.y} ${indexBase.x},${indexBase.y - 6} ${middleBase.x},${middleBase.y - 8} ${ringBase.x},${ringBase.y - 4} ${pinkyBase.x},${pinkyBase.y + 2} ${wrist.x + cuffOffset},${wrist.y - 6}`}
        className="sign-avatar-palm-highlight"
      />
      <path d={knucklePath} className="sign-avatar-knuckle-line" />
      <path d={palmCreasePrimary} className="sign-avatar-palm-crease" />
      <path d={palmCreaseSecondary} className="sign-avatar-palm-crease sign-avatar-palm-crease-soft" />

      {HAND_CONNECTIONS.map(([start, end]) => {
        const startPoint = hand[start];
        const endPoint = hand[end];
        if (!startPoint || !endPoint) return null;

        const isPalmConnection = start === 0 || (start === 5 && end === 9) || (start === 9 && end === 13) || (start === 13 && end === 17);
        if (isPalmConnection) return null;

        const segmentDepth = end % 4;
        const segmentWidth = segmentDepth === 2 ? 10 : segmentDepth === 3 ? 8.3 : 6.8;

        return (
          <g key={`${side}-${start}-${end}`}>
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              className="sign-avatar-finger-backline"
              style={{ strokeWidth: segmentWidth + 3.2 }}
            />
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              className="sign-avatar-finger-segment"
              style={{ strokeWidth: segmentWidth }}
            />
          </g>
        );
      })}

      {hand.map((point, index) => {
        const isVisibleJoint = index === 0 || [2, 3, 6, 7, 10, 11, 14, 15, 18, 19].includes(index);
        if (!isVisibleJoint) return null;
        return (
          <circle
            key={`${side}-joint-${index}`}
            cx={point.x}
            cy={point.y}
            r={index === 0 ? 5.8 : 2.7}
            className="sign-avatar-joint"
          />
        );
      })}

      {[4, 8, 12, 16, 20].map((index) => {
        const tip = hand[index];
        const previous = hand[index - 1];
        if (!tip || !previous) return null;
        const angle = Math.atan2(tip.y - previous.y, tip.x - previous.x) * (180 / Math.PI);
        return (
          <ellipse
            key={`${side}-nail-${index}`}
            cx={tip.x}
            cy={tip.y}
            rx={index === 4 ? 4.5 : 3.7}
            ry={index === 4 ? 2.6 : 2.2}
            transform={`rotate(${angle} ${tip.x} ${tip.y})`}
            className="sign-avatar-fingernail"
          />
        );
      })}

      {showHandLandmarks &&
        hand.map((point, index) => (
          <circle
            key={`${side}-landmark-${index}`}
            cx={point.x}
            cy={point.y}
            r={2.9}
            className="sign-avatar-landmark"
          />
        ))}

      {showFingerLabels &&
        Object.entries(HAND_JOINT_LABELS).map(([index, label]) => {
          const point = hand[Number(index)];
          if (!point) return null;
          const labelOffset = side === 'left' ? -12 : 12;

          return (
            <text
              key={`${side}-label-${index}`}
              x={point.x + labelOffset}
              y={point.y - 10}
              className="sign-avatar-finger-label"
            >
              {label}
            </text>
          );
        })}

      <circle cx={wrist.x} cy={wrist.y} r={8.5} className="sign-avatar-wrist-cap" />
      <ellipse cx={wrist.x + cuffOffset} cy={wrist.y + 5} rx={14} ry={11} className="sign-avatar-wrist-cuff" />
    </g>
  );
};

const RealisticAvatarViewer = ({
  currentGesture,
  currentWord,
  speed = 'normal',
  isPlaying = false,
  showHandLandmarks = false,
  showFingerLabels = false,
  zoomLevel = 1.12,
}) => {
  const [gestureProgress, setGestureProgress] = useState(0);
  const [displayPose, setDisplayPose] = useState(() =>
    createAvatarHands(undefined, undefined)
  );

  const previousPoseRef = useRef(displayPose);

  const viewerData = useMemo(() => getGesturePoseData(currentGesture, currentWord), [currentGesture, currentWord]);

  const targetPoseData = useMemo(() => {
    if (viewerData?.fingerspellingPoses?.length) {
      const letterIndex = Math.min(
        viewerData.fingerspellingPoses.length - 1,
        Math.floor(gestureProgress * viewerData.fingerspellingPoses.length)
      );
      const activeLetterPose = viewerData.fingerspellingPoses[letterIndex];
      return {
        ...viewerData,
        activeLabel: activeLetterPose?.label || viewerData.glossWord,
        hands: createAvatarHands(activeLetterPose?.leftHandPose, activeLetterPose?.rightHandPose),
      };
    }

    if (viewerData?.motionKeyframes?.length) {
      const motionPose = resolveMotionFramePose(viewerData.motionKeyframes, gestureProgress) || {};
      return {
        ...viewerData,
        activeLabel: viewerData?.glossWord || currentWord || 'READY',
        hands: createAvatarHands(motionPose.leftHandPose || viewerData?.leftHandPose, motionPose.rightHandPose || viewerData?.rightHandPose),
      };
    }

    return {
      ...viewerData,
      activeLabel: viewerData?.glossWord || currentWord || 'READY',
      hands: createAvatarHands(viewerData?.leftHandPose, viewerData?.rightHandPose),
    };
  }, [viewerData, currentWord, gestureProgress]);

  const poseMetrics = useMemo(
    () => getGestureMetrics(displayPose, gestureProgress, isPlaying),
    [displayPose, gestureProgress, isPlaying]
  );

  useEffect(() => {
    if (!currentGesture) return undefined;

    const duration = Math.max(700, (currentGesture.durationMs || 1400) * (SPEED_FACTORS[speed] || 1));
    let animationFrame = 0;
    let startedAt = 0;

    const step = (timestamp) => {
      if (!startedAt) {
        startedAt = timestamp;
      }

      const elapsed = timestamp - startedAt;
      const nextProgress = Math.min(1, elapsed / duration);
      setGestureProgress(nextProgress);

      if (isPlaying && nextProgress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };

    if (isPlaying) {
      animationFrame = window.requestAnimationFrame(step);
    }

    return () => window.cancelAnimationFrame(animationFrame);
  }, [currentGesture, isPlaying, speed]);

  useEffect(() => {
    const targetHands = targetPoseData.hands;
    const startHands = previousPoseRef.current || targetHands;
    let animationFrame = 0;
    let startedAt = 0;

    const transitionDuration = 460;

    const step = (timestamp) => {
      if (!startedAt) {
        startedAt = timestamp;
      }

      const elapsed = timestamp - startedAt;
      const progress = Math.min(1, elapsed / transitionDuration);
      const eased = easeInOut(progress);
      const nextPose = interpolateAvatarHands(startHands, targetHands, eased);
      setDisplayPose(nextPose);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      } else {
        previousPoseRef.current = targetHands;
      }
    };

    animationFrame = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [targetPoseData]);

  const leftWrist = poseMetrics.leftWrist;
  const rightWrist = poseMetrics.rightWrist;
  const leftShoulder = { x: 356, y: 232 - poseMetrics.shoulderLift * 0.16 };
  const rightShoulder = { x: 544, y: 232 - poseMetrics.shoulderLift * 0.16 };
  const leftElbow = getElbowPoint(leftShoulder, leftWrist, 'left');
  const rightElbow = getElbowPoint(rightShoulder, rightWrist, 'right');

  const zoomTranslateX = 450 * (1 - zoomLevel);
  const zoomTranslateY = 265 * (1 - zoomLevel) - 8;

  return (
    <div className="sign-avatar-stage sign-avatar-stage-realistic">
      <div className="sign-avatar-grid" />
      <div
        className="sign-avatar-stage-spotlight"
        style={{
          '--spot-x': `${poseMetrics.handCenterX}px`,
          '--spot-y': `${poseMetrics.handCenterY - 54}px`,
          '--spot-opacity': poseMetrics.stageGlowOpacity,
        }}
      />

      <div className="sign-avatar-stage-badges">
        <span className="sign-avatar-stage-badge">Upper Body Focus</span>
        <span className="sign-avatar-stage-badge sign-avatar-stage-badge-soft">Live Sign Motion</span>
      </div>

      <svg
        viewBox="0 0 900 560"
        className="sign-avatar-canvas"
        role="img"
        aria-label="Realistic sign language avatar with both hands visible"
      >
        <defs>
          <linearGradient id="avatarSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0c2a3" />
            <stop offset="52%" stopColor="#d79b78" />
            <stop offset="100%" stopColor="#ae6e4e" />
          </linearGradient>
          <linearGradient id="avatarShirt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#153022" />
            <stop offset="52%" stopColor="#0d1f16" />
            <stop offset="100%" stopColor="#07110c" />
          </linearGradient>
          <linearGradient id="avatarPalm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f3ccb2" />
            <stop offset="45%" stopColor="#dca682" />
            <stop offset="100%" stopColor="#b87959" />
          </linearGradient>
          <radialGradient id="avatarFaceHighlight" cx="38%" cy="28%" r="52%">
            <stop offset="0%" stopColor="rgba(255, 236, 221, 0.55)" />
            <stop offset="100%" stopColor="rgba(255, 236, 221, 0)" />
          </radialGradient>
          <radialGradient id="avatarCheekShade" cx="50%" cy="50%" r="68%">
            <stop offset="0%" stopColor="rgba(107, 63, 43, 0.14)" />
            <stop offset="100%" stopColor="rgba(107, 63, 43, 0)" />
          </radialGradient>
          <radialGradient id="avatarStageGlow" cx="50%" cy="28%" r="48%">
            <stop offset="0%" stopColor="rgba(95, 191, 151, 0.22)" />
            <stop offset="100%" stopColor="rgba(95, 191, 151, 0)" />
          </radialGradient>
          <radialGradient id="avatarShoulderGlow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(113, 214, 168, 0.12)" />
            <stop offset="100%" stopColor="rgba(113, 214, 168, 0)" />
          </radialGradient>
          <radialGradient id="avatarHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(113, 224, 182, 0.32)" />
            <stop offset="55%" stopColor="rgba(113, 224, 182, 0.12)" />
            <stop offset="100%" stopColor="rgba(113, 224, 182, 0)" />
          </radialGradient>
          <linearGradient id="avatarArmLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 232, 214, 0.88)" />
            <stop offset="50%" stopColor="rgba(225, 169, 131, 0.92)" />
            <stop offset="100%" stopColor="rgba(170, 112, 82, 0.94)" />
          </linearGradient>
          <linearGradient id="avatarAuraStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(95, 191, 151, 0)" />
            <stop offset="50%" stopColor="rgba(113, 224, 182, 0.72)" />
            <stop offset="100%" stopColor="rgba(95, 191, 151, 0)" />
          </linearGradient>
          <filter id="avatarShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(0, 0, 0, 0.36)" />
          </filter>
          <filter id="avatarGlow" x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="10" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect x="0" y="0" width="900" height="560" fill="url(#avatarStageGlow)" />
        <ellipse cx="450" cy="236" rx="212" ry="124" className="sign-avatar-shoulder-glow" />
        <ellipse
          cx={poseMetrics.handCenterX}
          cy={poseMetrics.handCenterY - 58}
          rx={140 + poseMetrics.handSpread * 0.08}
          ry={76 + poseMetrics.signPulse * 12}
          className="sign-avatar-sign-focus"
          opacity={poseMetrics.stageGlowOpacity}
        />
        <path
          d={poseMetrics.energyArc}
          className="sign-avatar-sign-energy"
          opacity={0.3 + poseMetrics.signPulse * 0.4}
          filter="url(#avatarGlow)"
        />

        <g
          transform={`translate(${zoomTranslateX} ${zoomTranslateY + poseMetrics.breathingOffset}) scale(${zoomLevel}) rotate(${poseMetrics.torsoLean} 450 280)`}
        >
          <ellipse cx="450" cy="252" rx="122" ry="88" className="sign-avatar-chest-glow" />
          <path
            d="M336 516C346 428 364 332 390 274C404 242 424 222 450 218C476 222 496 242 510 274C536 332 554 428 564 516H336Z"
            className="sign-avatar-shirt-shape"
          />
          <path
            d="M354 512C366 408 382 328 404 284C416 258 432 244 450 242C468 244 484 258 496 284C518 328 534 408 546 512"
            className="sign-avatar-shirt-highlight"
          />
          <path d="M318 264C350 224 396 206 450 206C504 206 550 224 582 264" className="sign-avatar-collar-line" />
          <path d="M396 192C406 226 432 244 450 246C468 244 494 226 504 192" className="sign-avatar-neck-shape" />
          <g transform={`translate(0 ${-poseMetrics.headLift}) rotate(${poseMetrics.headTilt} 450 120)`}>
            <ellipse cx="450" cy="118" rx="64" ry="78" className="sign-avatar-head-shape" />
            <ellipse cx="430" cy="100" rx="34" ry="28" className="sign-avatar-face-highlight" />
            <ellipse cx="428" cy="134" rx="24" ry="18" className="sign-avatar-face-cheek" />
            <ellipse cx="476" cy="132" rx="22" ry="17" className="sign-avatar-face-cheek sign-avatar-face-cheek-right" />
            <ellipse cx="390" cy="122" rx="11" ry="18" className="sign-avatar-ear-shape" />
            <ellipse cx="510" cy="122" rx="11" ry="18" className="sign-avatar-ear-shape" />
            <path d="M395 80C404 54 426 40 450 38C478 36 504 50 518 76C522 84 523 92 520 100C506 86 482 76 450 76C430 76 412 78 395 80Z" className="sign-avatar-hair-shape" />
            <path d="M400 76C418 58 444 50 474 54C491 56 506 66 514 78" className="sign-avatar-hair-highlight" />
            <ellipse cx="450" cy="138" rx="44" ry="56" className="sign-avatar-face-shadow" />
            <path d="M418 106C424 100 432 98 440 100" className="sign-avatar-brow-line" />
            <path d="M460 100C468 98 476 100 482 106" className="sign-avatar-brow-line" />
            <ellipse cx="432" cy="116" rx="7.4" ry="4.6" className="sign-avatar-eye-shape" />
            <ellipse cx="468" cy="116" rx="7.4" ry="4.6" className="sign-avatar-eye-shape" />
            <circle cx="432" cy="116.5" r="2.3" className="sign-avatar-face-feature" />
            <circle cx="468" cy="116.5" r="2.3" className="sign-avatar-face-feature" />
            <path d="M425 114C429 111 435 111 439 114" className="sign-avatar-eyelid-line" />
            <path d="M461 114C465 111 471 111 475 114" className="sign-avatar-eyelid-line" />
            <path d="M448 112C444 122 443 132 446 140" className="sign-avatar-nose-line" />
            <path d="M446 140C450 142 454 142 458 140" className="sign-avatar-nose-shadow" />
            <path d="M430 152C440 159 460 159 470 152" className="sign-avatar-mouth-line" />
            <path d="M436 160C444 165 456 165 464 160" className="sign-avatar-lip-line" />
            <path d="M424 168C434 176 446 180 450 180C454 180 466 176 476 168" className="sign-avatar-jaw-shadow" />
            <path d="M426 170C434 175 444 178 450 178C456 178 466 175 474 170" className="sign-avatar-beard-shadow" />
          </g>

          <path
            d={`M${leftShoulder.x} ${leftShoulder.y} Q ${leftElbow.x - 8} ${leftElbow.y + 6} ${leftWrist.x + 8} ${leftWrist.y + 6}`}
            className="sign-avatar-sleeve-shadow"
          />
          <path
            d={`M${rightShoulder.x} ${rightShoulder.y} Q ${rightElbow.x + 8} ${rightElbow.y + 6} ${rightWrist.x - 8} ${rightWrist.y + 6}`}
            className="sign-avatar-sleeve-shadow"
          />

          <path
            d={`M${leftShoulder.x} ${leftShoulder.y} Q ${leftElbow.x} ${leftElbow.y} ${leftWrist.x} ${leftWrist.y}`}
            className="sign-avatar-arm-silhouette"
            filter="url(#avatarShadow)"
          />
          <path
            d={`M${rightShoulder.x} ${rightShoulder.y} Q ${rightElbow.x} ${rightElbow.y} ${rightWrist.x} ${rightWrist.y}`}
            className="sign-avatar-arm-silhouette"
            filter="url(#avatarShadow)"
          />
          <path
            d={`M${leftShoulder.x + 14} ${leftShoulder.y - 8} C 402 ${250 - poseMetrics.shoulderLift * 0.2}, 498 ${250 - poseMetrics.shoulderLift * 0.2}, ${rightShoulder.x - 14} ${rightShoulder.y - 8}`}
            className="sign-avatar-shoulder-line"
          />
          <circle
            cx={leftWrist.x}
            cy={leftWrist.y}
            r={24 + poseMetrics.signPulse * 8}
            className="sign-avatar-hand-aura"
            opacity={0.12 + poseMetrics.signPulse * 0.18}
          />
          <circle
            cx={rightWrist.x}
            cy={rightWrist.y}
            r={24 + poseMetrics.signPulse * 8}
            className="sign-avatar-hand-aura"
            opacity={0.12 + poseMetrics.signPulse * 0.18}
          />

          <HandRenderer
            hand={displayPose.left}
            side="left"
            showHandLandmarks={showHandLandmarks}
            showFingerLabels={showFingerLabels}
          />
          <HandRenderer
            hand={displayPose.right}
            side="right"
            showHandLandmarks={showHandLandmarks}
            showFingerLabels={showFingerLabels}
          />
        </g>
      </svg>

      <div className="sign-avatar-word-panel">
        <div className="sign-avatar-word-head">
          <div>
            <div className="sign-avatar-word-label">Current Gesture</div>
            <div className="sign-avatar-word-value">{targetPoseData.activeLabel || 'READY'}</div>
          </div>
          <div className="sign-avatar-word-status">Live Pose</div>
        </div>
        <div className="sign-avatar-word-description">
          {targetPoseData.description || 'Generate sign animation to preview the active gloss word.'}
        </div>
        {formatWarning(targetPoseData.warning) && (
          <div className="sign-avatar-inline-warning">{formatWarning(targetPoseData.warning)}</div>
        )}
      </div>
    </div>
  );
};

export default RealisticAvatarViewer;
