import { useEffect, useRef } from 'react';
import {
  AnimationState,
  LandmarkFrame,
  LandmarkPoint,
  neutralPose,
  playSentence,
  playLandmarkSign,
  playSign,
  SignPose,
} from './signEngine';

// ─── Types ───────────────────────────────────────────────────

export type SignAvatarDebug = {
  keywords: string[];
  currentSign: string;
  currentFrame: string;
  animationState: AnimationState;
  sinhalaMeaning?: string;
};

type Props = {
  keywords: string[];
  isPlaying: boolean;
  playbackSpeed?: number;
  resetToken?: number;
  landmarkFrames?: LandmarkFrame[] | null;
  sinhalaMeaning?: string;
  onSequenceComplete?: () => void;
  onDebugChange?: (debug: SignAvatarDebug) => void;
};

type Playback = {
  queue: string[];
  index: number;
  started: number;
  paused: number | null;
  state: AnimationState;
  pose: SignPose;
  progress: number;
};

type Pt = { x: number; y: number };

// ─── High-Definition Canvas Resolution ───────────────────────
const W = 800;
const H = 580;
const CX = W / 2;

// ─── Vibrant Finger Color Map ────────────────────────────────
const FINGER_COLORS = [
  '#ff5252', // Thumb: Bright Coral Red
  '#38bdf8', // Index: Vivid Sky Cyan
  '#4ade80', // Middle: Radiant Emerald Green
  '#facc15', // Ring: Bright Golden Yellow
  '#c084fc', // Pinky: Electric Purple
];

const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

const FINGER_GROUPS = [
  [0, 1, 2, 3, 4],        // Thumb
  [0, 5, 6, 7, 8],        // Index
  [0, 9, 10, 11, 12],     // Middle
  [0, 13, 14, 15, 16],    // Ring
  [0, 17, 18, 19, 20],    // Pinky
];
const PALM_INDICES = [0, 1, 5, 9, 13, 17];

// ─── Drawing Primitives ──────────────────────────────────────

const at = (o: Pt, angle: number, len: number): Pt => ({
  x: o.x + Math.cos(angle) * len,
  y: o.y + Math.sin(angle) * len,
});

const bone = (ctx: CanvasRenderingContext2D, a: Pt, b: Pt, w: number, color: string) => {
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
};

const circle = (ctx: CanvasRenderingContext2D, p: Pt, r: number, fill: string, stroke?: string, strokeW = 1.5) => {
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeW;
    ctx.stroke();
  }
};

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
};

// ─── Dynamic Synthetic 21-Keypoint Hand Generator ────────────
/**
 * Synthesizes a lifelike 21-point MediaPipe hand skeleton for any word
 * that does not have raw WLASL video extractions (like DATA, HARDWARE, etc.)
 */
const generateSynthetic21Hand = (word: string, progress: number, mirror: boolean): LandmarkPoint[] => {
  const norm = (word || '').toLowerCase();
  const wave = Math.sin(progress * Math.PI * 2);

  // Base Wrist
  const pts: LandmarkPoint[] = [{ x: 0.5, y: 0.82, z: 0 }];

  // Articulated finger curvature based on semantic gesture archetype
  let curl = [0.25, 0.35, 0.38, 0.40, 0.42];

  if (norm.includes('data') || norm.includes('storage') || norm.includes('memory')) {
    // Cupping/gathering gesture: fingers pulse rhythmically
    const c = 0.30 + 0.28 * (1 - Math.abs(wave));
    curl = [0.25, c, c + 0.05, c + 0.08, c + 0.1];
  } else if (norm.includes('code') || norm.includes('keyboard')) {
    // Typing ripple across fingers
    curl = [
      0.25 + 0.2 * Math.sin(progress * 10),
      0.35 + 0.25 * Math.sin(progress * 10 + 1),
      0.35 + 0.25 * Math.sin(progress * 10 + 2),
      0.35 + 0.25 * Math.sin(progress * 10 + 3),
      0.35 + 0.25 * Math.sin(progress * 10 + 4),
    ];
  } else if (norm.includes('input') || norm.includes('login') || norm.includes('mouse')) {
    // Pointing index gesture
    curl = [0.65, 0.05, 0.72, 0.75, 0.78];
  } else if (norm.includes('security') || norm.includes('password')) {
    // Shield flat open palm
    curl = [0.12, 0.06, 0.06, 0.06, 0.06];
  } else {
    // Gentle natural flexion
    const c = 0.25 + 0.16 * wave;
    curl = [0.22, c, c * 1.1, c * 1.15, c * 1.2];
  }

  const angles = [-0.52, -0.22, 0.0, 0.22, 0.48];
  const lengths = [0.19, 0.29, 0.31, 0.28, 0.23];

  angles.forEach((baseAngle, fi) => {
    const c = curl[fi];
    const fingerLen = lengths[fi];
    const mcpAngle = -Math.PI / 2 + baseAngle * (mirror ? -1 : 1);

    const mcp = {
      x: pts[0].x + Math.cos(mcpAngle) * 0.16,
      y: pts[0].y + Math.sin(mcpAngle) * 0.16,
      z: 0,
    };
    pts.push(mcp);

    const pipAngle = mcpAngle + (mirror ? -c : c) * 0.38;
    const pip = {
      x: mcp.x + Math.cos(pipAngle) * (fingerLen * 0.36),
      y: mcp.y + Math.sin(pipAngle) * (fingerLen * 0.36),
      z: 0,
    };
    pts.push(pip);

    const dipAngle = pipAngle + (mirror ? -c : c) * 0.46;
    const dip = {
      x: pip.x + Math.cos(dipAngle) * (fingerLen * 0.32),
      y: pip.y + Math.sin(dipAngle) * (fingerLen * 0.32),
      z: 0,
    };
    pts.push(dip);

    const tipAngle = dipAngle + (mirror ? -c : c) * 0.54;
    const tip = {
      x: dip.x + Math.cos(tipAngle) * (fingerLen * 0.32),
      y: dip.y + Math.sin(tipAngle) * (fingerLen * 0.32),
      z: 0,
    };
    pts.push(tip);
  });

  return pts;
};

// ─── Large High-Definition Landmark Hand Renderer ────────────
const drawLandmarkHand = (
  ctx: CanvasRenderingContext2D,
  pts: LandmarkPoint[],
  vx: number,
  vy: number,
  vw: number,
  vh: number,
  mirror: boolean,
  label: string,
  isRealDataset: boolean,
) => {
  if (pts.length < 21) return;

  // 1. Panel Container Glassmorphism
  roundRect(ctx, vx, vy, vw, vh, 18);
  const panelGrad = ctx.createLinearGradient(vx, vy, vx + vw, vy + vh);
  panelGrad.addColorStop(0, 'rgba(15, 36, 26, 0.88)');
  panelGrad.addColorStop(1, 'rgba(6, 18, 12, 0.94)');
  ctx.fillStyle = panelGrad;
  ctx.fill();
  ctx.strokeStyle = isRealDataset ? 'rgba(74, 222, 128, 0.40)' : 'rgba(56, 189, 248, 0.40)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Panel Header Badge
  roundRect(ctx, vx + 16, vy + 12, vw - 32, 28, 8);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '700 12px "Inter", system-ui, sans-serif';
  ctx.fillStyle = isRealDataset ? '#86efac' : '#7dd3fc';
  ctx.textAlign = 'left';
  ctx.fillText(label, vx + 28, vy + 30);

  ctx.font = '700 10px system-ui';
  ctx.fillStyle = isRealDataset ? 'rgba(134, 239, 172, 0.8)' : 'rgba(125, 211, 252, 0.8)';
  ctx.textAlign = 'right';
  ctx.fillText(isRealDataset ? 'WLASL DATASET' : 'ARTICULATED RIG', vx + vw - 28, vy + 30);

  // 2. Compute Hand Bounding Box & Scale to Fill Panel (Huge Scale)
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const spanX = Math.max(0.025, maxX - minX);
  const spanY = Math.max(0.025, maxY - minY);
  const handCenterX = (minX + maxX) / 2;
  const handCenterY = (minY + maxY) / 2;

  // Huge scale: fills 84% of the large panel
  const targetDimension = Math.min(vw - 40, vh - 60) * 0.84;
  const scale = targetDimension / Math.max(spanX, spanY);

  const boxCenterX = vx + vw / 2;
  const boxCenterY = vy + 48 + (vh - 48) / 2;

  const toCanvas = (p: LandmarkPoint): Pt => {
    const dx = mirror ? -(p.x - handCenterX) : (p.x - handCenterX);
    const dy = p.y - handCenterY;
    return {
      x: boxCenterX + dx * scale,
      y: boxCenterY + dy * scale,
    };
  };

  const cp = pts.map(toCanvas);

  // 3. Shaded Palm Area
  ctx.beginPath();
  PALM_INDICES.forEach((i, k) => {
    if (k === 0) ctx.moveTo(cp[i].x, cp[i].y);
    else ctx.lineTo(cp[i].x, cp[i].y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(240, 185, 130, 0.22)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(240, 185, 130, 0.55)';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // 4. Heavy Articulated Finger Bones
  FINGER_GROUPS.forEach((group, fi) => {
    const col = FINGER_COLORS[fi];
    for (let k = 0; k < group.length - 1; k++) {
      const a = cp[group[k]];
      const b = cp[group[k + 1]];
      if (!a || !b) continue;
      bone(ctx, a, b, 8, 'rgba(0, 0, 0, 0.45)');
      bone(ctx, a, b, 6, col);
    }
  });

  // 5. High-Visibility Joint Nodes
  cp.forEach((p, i) => {
    const isWrist = i === 0;
    const isTip = [4, 8, 12, 16, 20].includes(i);
    const fi = [4, 8, 12, 16, 20].indexOf(i);

    if (isWrist) {
      circle(ctx, p, 9, '#fde047', '#a16207', 2.5);
    } else if (isTip) {
      const color = FINGER_COLORS[fi];
      circle(ctx, p, 8, color, '#ffffff', 2.5);
    } else {
      circle(ctx, p, 5, '#ffffff', 'rgba(30, 20, 10, 0.7)', 2);
    }
  });
};

// ─── Main Scene Renderer ─────────────────────────────────────

const renderAvatar = (
  canvas: HTMLCanvasElement,
  pose: SignPose,
  sign: string,
  sinhalaMeaning: string,
  progress: number,
  leftHand: LandmarkPoint[],
  rightHand: LandmarkPoint[],
  isRealDataset: boolean,
) => {
  const scale = window.devicePixelRatio || 1;
  if (canvas.width !== W * scale || canvas.height !== H * scale) {
    canvas.width = W * scale;
    canvas.height = H * scale;
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);

  // ── 1. Studio Backdrop ──
  const bg = ctx.createRadialGradient(CX, 220, 60, CX, 220, H * 0.9);
  bg.addColorStop(0, '#0d281e');
  bg.addColorStop(0.7, '#05140e');
  bg.addColorStop(1, '#020906');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Stage Floor Light
  const stageGlow = ctx.createRadialGradient(CX, H - 30, 20, CX, H - 30, 320);
  stageGlow.addColorStop(0, isRealDataset ? 'rgba(74, 222, 128, 0.18)' : 'rgba(56, 189, 248, 0.14)');
  stageGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = stageGlow;
  ctx.fillRect(0, 0, W, H);

  // ── 2. Upper Body Avatar Geometry ──
  const SHOULDER_Y = 172;
  const shoulders: [Pt, Pt] = [{ x: CX - 94, y: SHOULDER_Y }, { x: CX + 94, y: SHOULDER_Y }];
  const elbows: [Pt, Pt] = [
    at(shoulders[0], pose.leftShoulderAngle, 84),
    at(shoulders[1], pose.rightShoulderAngle, 84),
  ];
  const foreDir: [number, number] = [
    pose.leftShoulderAngle + pose.leftElbowAngle,
    pose.rightShoulderAngle + pose.rightElbowAngle,
  ];
  const wrists: [Pt, Pt] = [
    at(elbows[0], foreDir[0], 76),
    at(elbows[1], foreDir[1], 76),
  ];

  // Shaded Torso
  const tg = ctx.createLinearGradient(CX - 110, SHOULDER_Y, CX + 110, 320);
  tg.addColorStop(0, '#15803d');
  tg.addColorStop(1, '#0f3d24');
  ctx.fillStyle = tg;
  ctx.beginPath();
  ctx.moveTo(CX - 105, SHOULDER_Y);
  ctx.lineTo(CX + 105, SHOULDER_Y);
  ctx.lineTo(CX + 130, 310);
  ctx.lineTo(CX - 130, 310);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(134, 239, 172, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Neck
  bone(ctx, { x: CX, y: 132 }, { x: CX, y: SHOULDER_Y }, 20, '#d9a87e');

  // Head
  const hg = ctx.createRadialGradient(CX, 72, 12, CX, 76, 52);
  hg.addColorStop(0, '#fed7aa');
  hg.addColorStop(1, '#ea580c');
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.ellipse(CX, 74, 44, 54, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hair
  ctx.fillStyle = '#27170e';
  ctx.beginPath();
  ctx.ellipse(CX, 44, 48, 38, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(CX - 44, 62, 9, 20, -0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(CX + 44, 62, 9, 20, 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Eyebrows
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#381e11';
  ctx.beginPath();
  ctx.moveTo(CX - 24, 66);
  ctx.lineTo(CX - 8, 68);
  ctx.moveTo(CX + 8, 68);
  ctx.lineTo(CX + 24, 66);
  ctx.stroke();

  // Eyes
  [CX - 15, CX + 15].forEach((ex) => {
    circle(ctx, { x: ex, y: 78 }, 6.5, '#ffffff');
    circle(ctx, { x: ex, y: 78 }, 3.5, '#18181b');
    circle(ctx, { x: ex + 1.2, y: 76.5 }, 1.4, 'rgba(255, 255, 255, 0.9)');
  });

  // Smile
  ctx.beginPath();
  ctx.arc(CX, 94, 13, 0.2, Math.PI - 0.2);
  ctx.strokeStyle = '#9a3412';
  ctx.lineWidth = 2.2;
  ctx.stroke();

  // Arms
  [0, 1].forEach((i) => {
    bone(ctx, shoulders[i], elbows[i], 24, '#e0a87c');
    bone(ctx, elbows[i], wrists[i], 20, '#d8a070');
    circle(ctx, shoulders[i], 13, '#e8b48a', 'rgba(60, 30, 10, 0.45)', 2);
    circle(ctx, elbows[i], 11, '#e0a87c', 'rgba(60, 30, 10, 0.4)', 2);
    circle(ctx, wrists[i], 8, '#d8a070', 'rgba(60, 30, 10, 0.35)', 2);
  });

  // ── 3. Two Huge Hand Viewport Panels (360×265px) ──────────────
  const PANEL_W = 360;
  const PANEL_H = 265;
  const PANEL_Y = 270;

  const leftPanelX = CX - PANEL_W - 14;
  const rightPanelX = CX + 14;

  drawLandmarkHand(ctx, leftHand, leftPanelX, PANEL_Y, PANEL_W, PANEL_H, true, 'LEFT HAND', isRealDataset);
  drawLandmarkHand(ctx, rightHand, rightPanelX, PANEL_Y, PANEL_W, PANEL_H, false, 'RIGHT HAND', isRealDataset);

  // Guide Dashes from Wrists to Panels
  ctx.setLineDash([4, 6]);
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = isRealDataset ? 'rgba(134, 239, 172, 0.45)' : 'rgba(125, 211, 252, 0.45)';
  ctx.beginPath();
  ctx.moveTo(wrists[0].x, wrists[0].y);
  ctx.lineTo(leftPanelX + PANEL_W / 2, PANEL_Y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(wrists[1].x, wrists[1].y);
  ctx.lineTo(rightPanelX + PANEL_W / 2, PANEL_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  // ── 4. Prominent Header Banner (Active Sign + Meaning) ─────────
  const chipY = 22;
  const mainTitle = sign ? sign.toUpperCase() : 'READY TO SIGN';
  const subTitle = sinhalaMeaning ? `· ${sinhalaMeaning}` : '';
  const fullLabel = `${mainTitle} ${subTitle}`.trim();

  ctx.font = '700 16px "Inter", system-ui, sans-serif';
  const tw = ctx.measureText(fullLabel).width;
  const chipW = Math.max(220, tw + 48);
  const chipX = CX - chipW / 2;

  // Chip Box
  roundRect(ctx, chipX, chipY - 14, chipW, 34, 17);
  ctx.fillStyle = sign ? 'rgba(22, 101, 52, 0.55)' : 'rgba(255, 255, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = sign ? (isRealDataset ? '#4ade80' : '#38bdf8') : 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Progress Bar underline inside chip
  if (sign && progress > 0) {
    const barW = (chipW - 20) * Math.min(1, Math.max(0, progress));
    ctx.beginPath();
    ctx.moveTo(chipX + 10, chipY + 16);
    ctx.lineTo(chipX + 10 + barW, chipY + 16);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Chip Text
  ctx.fillStyle = sign ? '#bbf7d0' : 'rgba(255, 255, 255, 0.5)';
  ctx.textAlign = 'center';
  ctx.fillText(fullLabel, CX, chipY + 9);

  // ── 5. Bottom Finger Color Legend ─────────────────────────────
  FINGER_NAMES.forEach((name, i) => {
    const lx = 24 + i * 82;
    const ly = H - 18;
    circle(ctx, { x: lx, y: ly }, 5.5, FINGER_COLORS[i], '#ffffff', 1.5);
    ctx.font = '700 11px system-ui';
    ctx.fillStyle = FINGER_COLORS[i];
    ctx.textAlign = 'left';
    ctx.fillText(name, lx + 9, ly + 4);
  });

  // ── 6. Mode Badge ─────────────────────────────────────────────
  ctx.font = '700 11px system-ui';
  ctx.fillStyle = isRealDataset ? '#4ade80' : '#38bdf8';
  ctx.textAlign = 'right';
  ctx.fillText(isRealDataset ? '● REAL ASL DATASET' : '● ARTICULATED RIG', W - 20, H - 15);
};

// ─── Main Component ───────────────────────────────────────────

const SignAvatar2D = ({
  keywords,
  isPlaying,
  playbackSpeed = 1.0,
  resetToken = 0,
  landmarkFrames,
  sinhalaMeaning = '',
  onSequenceComplete,
  onDebugChange,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const player = useRef<Playback>({
    queue: [],
    index: 0,
    started: 0,
    paused: null,
    state: 'IDLE',
    pose: neutralPose,
    progress: 0,
  });

  const landmarkRef = useRef<LandmarkFrame[] | null | undefined>(landmarkFrames);
  landmarkRef.current = landmarkFrames;

  const speedRef = useRef<number>(playbackSpeed);
  speedRef.current = playbackSpeed;

  // Play / Pause Synchronizer
  useEffect(() => {
    const state = player.current;
    const now = performance.now();
    if (isPlaying) {
      if (state.state === 'PAUSED') {
        state.started += now - (state.paused || now);
        state.paused = null;
        state.state = 'PLAYING';
      } else {
        state.queue = landmarkFrames?.length ? keywords : playSentence(keywords);
        state.index = 0;
        state.started = now;
        state.progress = 0;
        state.state = state.queue.length ? 'PLAYING' : 'IDLE';
      }
    } else if (state.state === 'PLAYING') {
      state.paused = now;
      state.state = 'PAUSED';
    }
  }, [isPlaying, keywords, landmarkFrames]);

  // Reset Trigger
  useEffect(() => {
    const s = player.current;
    s.queue = [];
    s.index = 0;
    s.pose = neutralPose;
    s.state = 'IDLE';
    s.paused = null;
    s.progress = 0;
  }, [resetToken]);

  // Main 60FPS Render Loop
  useEffect(() => {
    let req = 0;
    const tick = (now: number) => {
      const state = player.current;
      const lm = landmarkRef.current;
      const speed = speedRef.current || 1.0;
      let sign = state.queue[state.index] || '—';
      let frame = '0/0';

      if (state.state === 'PLAYING' && sign !== '—') {
        const elapsed = ((now - state.started) / 1000) * speed;

        if (lm?.length) {
          const s = playLandmarkSign(lm, elapsed);
          state.pose = s.pose;
          state.progress = s.totalFrames > 0 ? s.frame / s.totalFrames : 0;
          frame = `${s.frame}/${s.totalFrames}`;

          const isReal = (s.leftHand?.length ?? 0) >= 21 || (s.rightHand?.length ?? 0) >= 21;
          const leftPts = (s.leftHand?.length ?? 0) >= 21
            ? s.leftHand
            : generateSynthetic21Hand(sign, state.progress, true);
          const rightPts = (s.rightHand?.length ?? 0) >= 21
            ? s.rightHand
            : generateSynthetic21Hand(sign, state.progress, false);

          if (s.completed) {
            state.index += 1;
            if (state.index >= state.queue.length) {
              state.state = 'COMPLETE';
              state.pose = neutralPose;
              state.progress = 1;
              sign = '—';
              onSequenceComplete?.();
            } else {
              state.started = now;
              sign = state.queue[state.index];
            }
          }
          if (canvasRef.current) {
            renderAvatar(canvasRef.current, state.pose, sign === '—' ? '' : sign, sinhalaMeaning, state.progress, leftPts, rightPts, isReal);
          }
        } else {
          const s = playSign(sign, elapsed);
          state.pose = s.pose;
          state.progress = s.totalFrames > 0 ? s.frame / s.totalFrames : 0;
          frame = `${s.frame}/${s.totalFrames}`;

          const leftPts = generateSynthetic21Hand(sign, state.progress, true);
          const rightPts = generateSynthetic21Hand(sign, state.progress, false);

          if (s.completed) {
            state.index += 1;
            if (state.index >= state.queue.length) {
              state.state = 'COMPLETE';
              state.pose = neutralPose;
              state.progress = 1;
              sign = '—';
              onSequenceComplete?.();
            } else {
              state.started = now;
              sign = state.queue[state.index];
            }
          }
          if (canvasRef.current) {
            renderAvatar(canvasRef.current, state.pose, sign === '—' ? '' : sign, sinhalaMeaning, state.progress, leftPts, rightPts, false);
          }
        }
      } else {
        if (canvasRef.current) {
          const leftIdle = generateSynthetic21Hand('', 0, true);
          const rightIdle = generateSynthetic21Hand('', 0, false);
          renderAvatar(canvasRef.current, state.pose, '', '', 0, leftIdle, rightIdle, false);
        }
      }

      onDebugChange?.({
        keywords,
        currentSign: sign,
        currentFrame: frame,
        animationState: state.state,
        sinhalaMeaning,
      });
      req = requestAnimationFrame(tick);
    };

    req = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(req);
  }, [keywords, sinhalaMeaning, onDebugChange, onSequenceComplete]);

  return (
    <div className="responsive-avatar-canvas-wrapper w-full overflow-hidden rounded-2xl bg-[#060c09] shadow-[0_12px_32px_rgba(0,0,0,0.3)]">
      <canvas
        ref={canvasRef}
        className="sign-avatar-2d__canvas"
        aria-label="ASL sign language avatar — 2D canvas with high-definition real landmark skeleton"
        style={{
          width: '100%',
          height: 'auto',
          aspectRatio: '800 / 580',
          display: 'block',
          borderRadius: '16px',
        }}
      />
    </div>
  );
};

export default SignAvatar2D;
