import { useEffect, useRef } from 'react';
import { AnimationState, neutralPose, playSentence, playSign, SignPose } from './signEngine';

export type SignAvatarDebug = { keywords: string[]; currentSign: string; currentFrame: string; animationState: AnimationState };
type Props = { keywords: string[]; isPlaying: boolean; resetToken?: number; onSequenceComplete?: () => void; onDebugChange?: (debug: SignAvatarDebug) => void };
type Playback = { queue: string[]; index: number; started: number; paused: number | null; state: AnimationState; pose: SignPose };
type Point = { x: number; y: number };

const at = (origin: Point, angle: number, length: number): Point => ({ x: origin.x + Math.cos(angle) * length, y: origin.y + Math.sin(angle) * length });
const joint = (ctx: CanvasRenderingContext2D, p: Point, radius: number) => { ctx.fillStyle = '#e8ae88'; ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#754d37'; ctx.lineWidth = 2; ctx.stroke(); };

const hand = (ctx: CanvasRenderingContext2D, wrist: Point, direction: number, side: -1 | 1) => {
  const palm = at(wrist, direction, 12); joint(ctx, palm, 12);
  ctx.strokeStyle = '#513829'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  [-0.3, -0.1, 0.1, 0.3].forEach((offset) => { const start = at(palm, direction + side * offset, 4); const end = at(palm, direction + side * offset, 19); ctx.beginPath(); ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); ctx.stroke(); });
};

const renderAvatar = (canvas: HTMLCanvasElement, pose: SignPose, sign: string) => {
  const w = 640; const h = 430; const scale = window.devicePixelRatio || 1;
  if (canvas.width !== w * scale || canvas.height !== h * scale) { canvas.width = w * scale; canvas.height = h * scale; }
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const bg = ctx.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#0a1d17'); bg.addColorStop(1, '#04100c'); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  const cx = w / 2; const neck = { x: cx, y: 142 }; const shoulders = [{ x: cx - 72, y: 177 }, { x: cx + 72, y: 177 }];
  const elbows = [at(shoulders[0], pose.leftShoulderAngle, 73), at(shoulders[1], pose.rightShoulderAngle, 73)];
  const forearms = [pose.leftShoulderAngle + pose.leftElbowAngle, pose.rightShoulderAngle + pose.rightElbowAngle];
  const wrists = [at(elbows[0], forearms[0], 69), at(elbows[1], forearms[1], 69)];
  ctx.fillStyle = '#123b2d'; ctx.beginPath(); ctx.moveTo(cx - 93, 177); ctx.lineTo(cx + 93, 177); ctx.lineTo(cx + 120, 410); ctx.lineTo(cx - 120, 410); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d9a17e'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(neck.x, neck.y); ctx.lineTo(cx, 177); ctx.stroke();
  ctx.fillStyle = '#f5c7a7'; ctx.fillRect(cx - 16, 116, 32, 42); joint(ctx, { x: cx, y: 80 }, 48); ctx.fillStyle = '#33251e'; ctx.beginPath(); ctx.arc(cx, 63, 49, Math.PI, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e3ad8b'; ctx.lineWidth = 24; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  shoulders.forEach((shoulder, i) => { ctx.beginPath(); ctx.moveTo(shoulder.x, shoulder.y); ctx.lineTo(elbows[i].x, elbows[i].y); ctx.lineTo(wrists[i].x, wrists[i].y); ctx.stroke(); });
  shoulders.forEach((p) => joint(ctx, p, 11)); elbows.forEach((p) => joint(ctx, p, 10)); wrists.forEach((p) => joint(ctx, p, 7));
  hand(ctx, wrists[0], forearms[0], -1); hand(ctx, wrists[1], forearms[1], 1);
  ctx.fillStyle = '#8de3b6'; ctx.font = '600 14px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(sign ? `SIGNING: ${sign.toUpperCase()}` : 'READY TO SIGN', cx, 34);
};

const SignAvatar2D = ({ keywords, isPlaying, resetToken = 0, onSequenceComplete, onDebugChange }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const player = useRef<Playback>({ queue: [], index: 0, started: 0, paused: null, state: 'IDLE', pose: neutralPose });
  useEffect(() => { const state = player.current; const now = performance.now(); if (isPlaying) { if (state.state === 'PAUSED') { state.started += now - (state.paused || now); state.paused = null; state.state = 'PLAYING'; } else { state.queue = playSentence(keywords); state.index = 0; state.started = now; state.state = state.queue.length ? 'PLAYING' : 'IDLE'; } } else if (state.state === 'PLAYING') { state.paused = now; state.state = 'PAUSED'; } }, [isPlaying, keywords]);
  useEffect(() => { const state = player.current; state.queue = []; state.index = 0; state.pose = neutralPose; state.state = 'IDLE'; state.paused = null; }, [resetToken]);
  useEffect(() => {
    let request = 0;
    const tick = (now: number) => { const state = player.current; let sign = state.queue[state.index] || '—'; let frame = '0/0'; if (state.state === 'PLAYING' && sign !== '—') { const sample = playSign(sign, (now - state.started) / 1000); state.pose = sample.pose; frame = `${sample.frame}/${sample.totalFrames}`; if (sample.completed) { state.index += 1; if (state.index >= state.queue.length) { state.state = 'COMPLETE'; state.pose = neutralPose; sign = '—'; onSequenceComplete?.(); } else { state.started = now; sign = state.queue[state.index]; } } } if (canvasRef.current) renderAvatar(canvasRef.current, state.pose, sign === '—' ? '' : sign); onDebugChange?.({ keywords, currentSign: sign, currentFrame: frame, animationState: state.state }); request = requestAnimationFrame(tick); };
    request = requestAnimationFrame(tick); return () => cancelAnimationFrame(request);
  }, [keywords, onDebugChange, onSequenceComplete]);
  return <canvas ref={canvasRef} className="sign-avatar-2d__canvas" aria-label="Forward kinematic two dimensional sign avatar" />;
};

export default SignAvatar2D;
