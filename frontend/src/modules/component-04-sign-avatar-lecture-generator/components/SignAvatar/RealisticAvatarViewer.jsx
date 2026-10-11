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

const easeInOut = (value) => 0.5 - Math.cos(value * Math.PI) / 2;

const getGestureMetrics = (displayPose, isPlaying) => {
  const leftWrist = displayPose.left?.[0] || { x: 300, y: 440 };
  const rightWrist = displayPose.right?.[0] || { x: 560, y: 260 };
  const handCenterX = (leftWrist.x + rightWrist.x) / 2;
  const handCenterY = (leftWrist.y + rightWrist.y) / 2;
  const handSpread = Math.abs(rightWrist.x - leftWrist.x);
  const signPulse = isPlaying ? 0.35 : 0.15;
  const stageGlowOpacity = 0.18 + signPulse * 0.22;

  return {
    leftWrist,
    rightWrist,
    handCenterX,
    handCenterY,
    handSpread,
    signPulse,
    stageGlowOpacity,
  };
};

const HandRenderer = ({
  hand,
  side,
  showHandLandmarks,
  showFingerLabels,
  isResting = false,
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
  const knucklePath = `M${thumbBase.x} ${thumbBase.y} C ${indexBase.x - 6} ${indexBase.y + 4}, ${ringBase.x + 4} ${ringBase.y + 6}, ${pinkyBase.x} ${pinkyBase.y}`;

  return (
    <g
      className={`sign-avatar-hand-group sign-avatar-hand-group-${side}`}
      opacity={isResting ? 0.32 : 1}
      style={{ transition: 'opacity 0.25s ease' }}
    >
      {/* Soft Ambient Palm Shadow */}
      <ellipse
        cx={palmCenterX}
        cy={palmCenterY + 10}
        rx={50}
        ry={36}
        fill="rgba(0, 0, 0, 0.55)"
        filter="blur(10px)"
      />

      {/* Palm Flesh Body */}
      <path
        d={palmPath}
        className="sign-avatar-palm-shape"
        fill="url(#avatarPalm)"
        stroke="#7c3d1f"
        strokeWidth="2.8"
        strokeLinejoin="round"
      />

      {/* Palm Surface Highlight */}
      <polygon
        points={`${thumbBase.x},${thumbBase.y} ${indexBase.x},${indexBase.y - 4} ${middleBase.x},${middleBase.y - 6} ${ringBase.x},${ringBase.y - 3} ${pinkyBase.x},${pinkyBase.y + 2} ${wrist.x + cuffOffset},${wrist.y - 4}`}
        fill="rgba(255, 242, 232, 0.28)"
      />

      {/* Knuckle Arch Crease */}
      <path d={knucklePath} stroke="#a8603e" strokeWidth="2.2" fill="none" opacity="0.65" strokeLinecap="round" />

      {/* Articulated Finger Segments */}
      {HAND_CONNECTIONS.map(([start, end]) => {
        const startPoint = hand[start];
        const endPoint = hand[end];
        if (!startPoint || !endPoint) return null;

        const isPalmConnection =
          start === 0 ||
          (start === 5 && end === 9) ||
          (start === 9 && end === 13) ||
          (start === 13 && end === 17);
        if (isPalmConnection) return null;

        const segmentDepth = end % 4;
        const segmentWidth = segmentDepth === 2 ? 12 : segmentDepth === 3 ? 10.2 : 8.6;

        return (
          <g key={`${side}-${start}-${end}`}>
            {/* Outline Shadow */}
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="#5c2a15"
              strokeWidth={segmentWidth + 3.8}
              strokeLinecap="round"
            />
            {/* Inner Organic Flesh Fill */}
            <line
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="url(#avatarSkin)"
              strokeWidth={segmentWidth}
              strokeLinecap="round"
            />
            {/* Top Light Glaze */}
            <line
              x1={startPoint.x}
              y1={startPoint.y - 1}
              x2={endPoint.x}
              y2={endPoint.y - 1}
              stroke="rgba(255, 245, 238, 0.45)"
              strokeWidth={segmentWidth * 0.38}
              strokeLinecap="round"
            />
          </g>
        );
      })}

      {/* Knuckle Joint Circles */}
      {hand.map((point, index) => {
        const isVisibleJoint = [2, 3, 6, 7, 10, 11, 14, 15, 18, 19].includes(index);
        if (!isVisibleJoint) return null;
        return (
          <circle
            key={`${side}-joint-${index}`}
            cx={point.x}
            cy={point.y}
            r={3.5}
            fill="#e2ad8b"
            stroke="#7c3d1f"
            strokeWidth="1.4"
          />
        );
      })}

      {/* Detailed Fingernails with Highlights */}
      {[4, 8, 12, 16, 20].map((index) => {
        const tip = hand[index];
        const previous = hand[index - 1];
        if (!tip || !previous) return null;
        const angle = Math.atan2(tip.y - previous.y, tip.x - previous.x) * (180 / Math.PI);
        return (
          <g key={`${side}-nail-${index}`} transform={`rotate(${angle} ${tip.x} ${tip.y})`}>
            <ellipse
              cx={tip.x}
              cy={tip.y}
              rx={index === 4 ? 5.2 : 4.4}
              ry={index === 4 ? 3.0 : 2.6}
              fill="#fadcc8"
              stroke="#a8603e"
              strokeWidth="1.3"
            />
            <ellipse
              cx={tip.x - 1}
              cy={tip.y - 0.6}
              rx={index === 4 ? 2.8 : 2.2}
              ry={index === 4 ? 1.2 : 1.0}
              fill="rgba(255, 255, 255, 0.65)"
            />
          </g>
        );
      })}

      {/* Skeleton Landmarks Mode */}
      {showHandLandmarks &&
        hand.map((point, index) => (
          <circle
            key={`${side}-landmark-${index}`}
            cx={point.x}
            cy={point.y}
            r={4.2}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth="1.8"
          />
        ))}

      {/* Joint Labels */}
      {showFingerLabels &&
        Object.entries(HAND_JOINT_LABELS).map(([index, label]) => {
          const point = hand[Number(index)];
          if (!point) return null;
          const labelOffset = side === 'left' ? -15 : 15;

          return (
            <text
              key={`${side}-label-${index}`}
              x={point.x + labelOffset}
              y={point.y - 8}
              fill="#10b981"
              fontSize="11"
              fontWeight="bold"
              fontFamily="monospace"
            >
              {label}
            </text>
          );
        })}

      {/* Wrist Base Cuff */}
      <ellipse
        cx={wrist.x + cuffOffset}
        cy={wrist.y + 6}
        rx={17}
        ry={13}
        fill="#07170f"
        stroke="#10b981"
        strokeWidth="1.8"
      />
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
  useBothHands = false,
  zoomLevel = 1.15,
}) => {
  const [displayPose, setDisplayPose] = useState(() =>
    createAvatarHands(undefined, undefined)
  );

  const previousPoseRef = useRef(displayPose);

  const targetPoseData = useMemo(() => {
    if (currentGesture?.leftHandPose && currentGesture?.rightHandPose) {
      const leftPose = useBothHands
        ? {
            ...currentGesture.rightHandPose,
            position: { x: 335, y: 260, z: 0 },
            wristAngle: -currentGesture.rightHandPose.wristAngle,
          }
        : currentGesture.leftHandPose;

      return {
        activeLabel: currentGesture.glossWord || currentWord || 'READY',
        hands: createAvatarHands(leftPose, currentGesture.rightHandPose),
      };
    }

    const poseData = getGesturePoseData(currentGesture, currentWord);
    const leftPose = useBothHands
      ? {
          ...poseData.rightHandPose,
          position: { x: 335, y: 260, z: 0 },
          wristAngle: -poseData.rightHandPose.wristAngle,
        }
      : poseData.leftHandPose;

    return {
      activeLabel: poseData.glossWord || currentWord || 'READY',
      hands: createAvatarHands(leftPose, poseData.rightHandPose),
    };
  }, [currentGesture, currentWord, useBothHands]);

  const poseMetrics = useMemo(
    () => getGestureMetrics(displayPose, isPlaying),
    [displayPose, isPlaying]
  );

  // Smooth pose interpolation across letter switches
  useEffect(() => {
    const targetHands = targetPoseData.hands;
    const startHands = previousPoseRef.current || targetHands;
    let animationFrame = 0;
    let startedAt = 0;

    const transitionDuration = 240;

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
  const leftShoulder = { x: 330, y: 310 };
  const rightShoulder = { x: 570, y: 310 };
  const leftElbow = getElbowPoint(leftShoulder, leftWrist, 'left');
  const rightElbow = getElbowPoint(rightShoulder, rightWrist, 'right');

  return (
    <div className="sign-avatar-stage sign-avatar-stage-realistic relative w-full h-full flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 900 560"
        className="w-full h-full"
        role="img"
        aria-label="Realistic sign language avatar with articulated hands"
      >
        <defs>
          <linearGradient id="avatarSkin" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f5d0b9" />
            <stop offset="50%" stopColor="#dfa785" />
            <stop offset="100%" stopColor="#b37151" />
          </linearGradient>
          <linearGradient id="avatarPalm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fae4d7" />
            <stop offset="50%" stopColor="#e9c2aa" />
            <stop offset="100%" stopColor="#c88e6e" />
          </linearGradient>
          <linearGradient id="avatarTorso" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f291e" />
            <stop offset="60%" stopColor="#091711" />
            <stop offset="100%" stopColor="#040b08" />
          </linearGradient>
          <radialGradient id="stageSpotlight" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="rgba(16, 185, 129, 0.22)" />
            <stop offset="60%" stopColor="rgba(16, 185, 129, 0.05)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>

        {/* Stage Ambient Glow */}
        <rect x="0" y="0" width="900" height="560" fill="url(#stageSpotlight)" />

        {/* Silhouette Avatar Body (Background Layer - Zero overlap with hands) */}
        <g opacity="0.85">
          {/* Head & Neck */}
          <ellipse cx="450" cy="95" rx="42" ry="52" fill="#dca682" stroke="#8b4d2f" strokeWidth="2" />
          <path d="M410 70C420 50 440 42 450 42C465 42 485 50 490 70C480 62 465 58 450 58C435 58 420 62 410 70Z" fill="#2d1a10" />
          <path d="M432 142C438 165 462 165 468 142" fill="#c58a69" />

          {/* Torso & Shoulders */}
          <path
            d="M310 540C320 420 340 330 380 270C410 230 490 230 520 270C560 330 580 420 590 540Z"
            fill="url(#avatarTorso)"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeOpacity="0.4"
          />

          {/* Collar Accent */}
          <path d="M415 240C435 255 465 255 485 240" stroke="#10b981" strokeWidth="2.5" fill="none" opacity="0.7" />

          {/* Stylized Arms connecting shoulders to wrists */}
          <path
            d={`M${leftShoulder.x} ${leftShoulder.y} Q ${leftElbow.x} ${leftElbow.y} ${leftWrist.x} ${leftWrist.y + 8}`}
            stroke="#091711"
            strokeWidth="30"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M${leftShoulder.x} ${leftShoulder.y} Q ${leftElbow.x} ${leftElbow.y} ${leftWrist.x} ${leftWrist.y + 8}`}
            stroke="#10b981"
            strokeWidth="2"
            strokeOpacity="0.3"
            fill="none"
          />

          <path
            d={`M${rightShoulder.x} ${rightShoulder.y} Q ${rightElbow.x} ${rightElbow.y} ${rightWrist.x} ${rightWrist.y + 8}`}
            stroke="#091711"
            strokeWidth="30"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d={`M${rightShoulder.x} ${rightShoulder.y} Q ${rightElbow.x} ${rightElbow.y} ${rightWrist.x} ${rightWrist.y + 8}`}
            stroke="#10b981"
            strokeWidth="2"
            strokeOpacity="0.5"
            fill="none"
          />
        </g>

        {/* Foreground Hands */}
        <HandRenderer
          hand={displayPose.left}
          side="left"
          showHandLandmarks={showHandLandmarks}
          showFingerLabels={showFingerLabels}
          isResting={!useBothHands}
        />

        <HandRenderer
          hand={displayPose.right}
          side="right"
          showHandLandmarks={showHandLandmarks}
          showFingerLabels={showFingerLabels}
          isResting={false}
        />
      </svg>
    </div>
  );
};

export default RealisticAvatarViewer;
