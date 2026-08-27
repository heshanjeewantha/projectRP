import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Play,
  Vibrate,
  ShieldCheck,
  Hand,
  Zap,
  Check,
  Flame,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Authentic ASL Dual-Hand Specifications (Mirrored User Perspective)
// - Screen Left Box = User's Physical LEFT Hand
// - Screen Right Box = User's Physical RIGHT Hand
// `count` is the number of extended fingers required (0 = fist, 5 = open palm, etc.)
const DUAL_HAND_SPECS = {
  computer: {
    name: 'Open 5-Finger Typing',
    icon: '⌨️',
    leftHandReq: { count: 5, label: 'Open 5 Fingers 🖐️' },
    rightHandReq: { count: 5, label: 'Open 5 Fingers 🖐️' },
    description: 'Raise both hands with 5 fingers open and flutter in typing motion.',
    action: 'Place hands in Left and Right boxes and move fingers.',
  },
  hardware: {
    name: 'Fist Strike on Palm',
    icon: '🔨',
    leftHandReq: { count: 5, label: 'Flat Palm 🖐️' },
    rightHandReq: { count: 0, label: 'Closed Fist ✊' },
    description: 'Left hand flat receiving palm, Right hand closed solid fist.',
    action: 'Left hand (Screen Left) flat palm, Right hand (Screen Right) fist.',
  },
  software: {
    name: 'V-Glide Across Palm',
    icon: '📜',
    leftHandReq: { count: 5, label: 'Flat Palm 🖐️' },
    rightHandReq: { count: 2, label: '2-Finger (V) ✌️' },
    description: 'Left hand flat palm, Right hand 2-finger V-glide across palm.',
    action: 'Left hand (Screen Left) flat palm, Right hand (Screen Right) V-sign.',
  },
  database: {
    name: 'Tiered C-Shapes',
    icon: '🗄️',
    leftHandReq: { count: 3, label: 'C-Shape 🗄️' },
    rightHandReq: { count: 3, label: 'C-Shape 🗄️' },
    description: 'Both hands curved into C-shapes showing layered tiers.',
    action: 'Show curved C-handshape in both Left and Right boxes.',
  },
  network: {
    name: 'Linked Middle Nodes',
    icon: '🌐',
    leftHandReq: { count: 3, label: 'Middle Touch 🤞' },
    rightHandReq: { count: 3, label: 'Middle Touch 🤞' },
    description: 'Both hands extended with middle fingers prominent.',
    action: 'Extend fingers in Left and Right boxes.',
  },
  internet: {
    name: 'Open 5 Orbital Hands',
    icon: '🌍',
    leftHandReq: { count: 5, label: 'Open 5 Fingers 🖐️' },
    rightHandReq: { count: 5, label: 'Open 5 Fingers 🖐️' },
    description: 'Both hands open with 5 fingers spread in circular orbits.',
    action: 'Show 5 open fingers in both Left and Right boxes.',
  },
  email: {
    name: 'Envelope Slot Pass',
    icon: '✉️',
    leftHandReq: { count: 3, label: 'Envelope Slot ✉️' },
    rightHandReq: { count: 2, label: 'Flat Sender ✌️' },
    description: 'Left hand envelope slot, Right hand flat sender entering slot.',
    action: 'Left hand (Screen Left) slot, Right hand (Screen Right) sender.',
  },
  security: {
    name: 'Dual Closed S-Fists',
    icon: '🛡️',
    leftHandReq: { count: 0, label: 'Closed S-Fist ✊' },
    rightHandReq: { count: 0, label: 'Closed S-Fist ✊' },
    description: 'Both hands closed tightly into S-fists across chest.',
    action: 'Show closed fists in both Left and Right boxes.',
  },
};

// Standard MediaPipe hand landmark indices
// 0 wrist | 1-4 thumb | 5-8 index | 9-12 middle | 13-16 ring | 17-20 pinky
const FINGER_DEFS = [
  { tip: 8, pip: 6 },   // index
  { tip: 12, pip: 10 }, // middle
  { tip: 16, pip: 14 }, // ring
  { tip: 20, pip: 18 }, // pinky
];
const FINGER_BONES = [
  [0, 1, 2, 3, 4],      // thumb
  [0, 5, 6, 7, 8],      // index
  [0, 9, 10, 11, 12],   // middle
  [0, 13, 14, 15, 16],  // ring
  [0, 17, 18, 19, 20],  // pinky
];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Count extended fingers from 21 landmark points (already in pixel space).
const countExtendedFingers = (pts) => {
  let count = 0;
  const wrist = pts[0];
  const thumbTip = pts[4];
  const thumbMcp = pts[2];
  if (dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.15) count += 1;

  FINGER_DEFS.forEach(({ tip, pip }) => {
    if (pts[tip].y < pts[pip].y) count += 1; // tip above pip = extended
  });
  return count;
};

// Screen-Spatial Hand Classifier:
// Converts raw landmarks to mirrored pixel coordinates and binds:
// - Left half of screen (Screen Left box) -> Left Hand (`leftRes`)
// - Right half of screen (Screen Right box) -> Right Hand (`rightRes`)
const classifyHands = (result, w, h) => {
  let rightRes = { detected: false, count: -1, landmarks: null };
  let leftRes = { detected: false, count: -1, landmarks: null };

  if (!result?.landmarks?.length) return { rightRes, leftRes };

  // Convert all detected hands to mirrored pixel coordinates
  const detectedHands = result.landmarks.map((lms) => {
    const pts = lms.map((p) => ({ x: w - p.x * w, y: p.y * h }));
    const count = countExtendedFingers(pts);
    const avgX = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
    return { detected: true, count, landmarks: pts, avgX };
  });

  if (detectedHands.length === 1) {
    const hand = detectedHands[0];
    if (hand.avgX < w * 0.5) {
      leftRes = { detected: true, count: hand.count, landmarks: hand.landmarks };
    } else {
      rightRes = { detected: true, count: hand.count, landmarks: hand.landmarks };
    }
  } else if (detectedHands.length >= 2) {
    // Sort horizontally: leftmost is Screen Left (Left Hand), rightmost is Screen Right (Right Hand)
    detectedHands.sort((a, b) => a.avgX - b.avgX);
    leftRes = { detected: true, count: detectedHands[0].count, landmarks: detectedHands[0].landmarks };
    rightRes = { detected: true, count: detectedHands[detectedHands.length - 1].count, landmarks: detectedHands[detectedHands.length - 1].landmarks };
  }

  return { rightRes, leftRes };
};

const matchesRequirement = (res, req) => res.detected && res.count === req.count;

const CameraSignEvaluator = ({
  keyword,
  keywordMeta,
  onPassKeyword,
  onErrorTrigger,
  examMode = false,
}) => {
  const normKey = (keyword || 'computer').toLowerCase();
  const spec = DUAL_HAND_SPECS[normKey] || DUAL_HAND_SPECS.computer;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [currentAccuracy, setCurrentAccuracy] = useState(0);
  const [isMatching, setIsMatching] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [rightInZone, setRightInZone] = useState(false); // Screen Left = User Right Hand (UI only)
  const [leftInZone, setLeftInZone] = useState(false);   // Screen Right = User Left Hand (UI only)
  const [statusMessage, setStatusMessage] = useState('Raise hands into the Left and Right boxes.');
  const [secondaryTip, setSecondaryTip] = useState(spec.action);

  const rightInZoneRef = useRef(false);
  const leftInZoneRef = useRef(false);

  const holdStartRef = useRef(null);
  const lastPassTimeRef = useRef(0);
  const lastStateSyncRef = useRef(0);
  const lastDetectRef = useRef(0);
  const lastDetectResultRef = useRef({
    rightRes: { detected: false, count: -1, landmarks: null },
    leftRes: { detected: false, count: -1, landmarks: null },
  });
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const handLandmarkerRef = useRef(null);

  // Load the real hand-tracking model once on mount.
  useEffect(() => {
    let cancelled = false;
    const initModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
        if (!cancelled) {
          handLandmarkerRef.current = landmarker;
          setModelReady(true);
        }
      } catch (err) {
        console.error('Hand landmarker failed to load:', err);
        if (!cancelled) setModelError('Hand-tracking model failed to load. Check your connection and refresh.');
      }
    };
    initModel();
    return () => {
      cancelled = true;
      handLandmarkerRef.current?.close?.();
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setCameraError(null);
      setIsSimulated(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current?.play();
          } catch (pErr) {
            console.warn('Metadata play error:', pErr);
          }
        };
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Auto-play error:', playErr);
        }
      }

      setIsCameraActive(true);
      setCameraLoading(false);
      setStatusMessage('Camera active. Place hands in both boxes.');
      setSecondaryTip(spec.action);
    } catch (err) {
      console.warn('Webcam start error:', err);
      setCameraError('Webcam unavailable or blocked. You can retry or use Virtual Hand Evaluator.');
      setCameraLoading(false);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsSimulated(false);
  };

  const enableSimulationMode = () => {
    stopCamera();
    setIsSimulated(true);
    setIsCameraActive(true);
    setCameraError(null);
    setStatusMessage('Virtual Dual-Hand Simulation Active. Place hands in zones.');
    setSecondaryTip(spec.action);
  };

  useEffect(() => {
    if (isCameraActive && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((err) => console.warn('Stream sync play error:', err));
    }
  }, [isCameraActive]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // Reset state when keyword changes
  useEffect(() => {
    holdStartRef.current = null;
    setHoldProgress(0);
    setCurrentAccuracy(0);
    setIsMatching(false);
    rightInZoneRef.current = false;
    leftInZoneRef.current = false;
    setRightInZone(false);
    setLeftInZone(false);
    setStatusMessage(`Perform sign: '${keyword?.toUpperCase()}'. Place hands in both boxes.`);
    setSecondaryTip(spec.action);
  }, [keyword, spec]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (isCameraActive && canvas) {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const w = canvas.width;
      const h = canvas.height;

      const videoValid = video && video.readyState >= 2 && video.videoWidth > 0 && !video.paused;

      if (videoValid) {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, w, h);
        ctx.restore();
      } else {
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        for (let gx = 0; gx < w; gx += 30) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, h);
          ctx.stroke();
        }
        for (let gy = 0; gy < h; gy += 30) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(w, gy);
          ctx.stroke();
        }
      }

      const boxW = Math.floor(w * 0.40);
      const boxH = Math.floor(h * 0.68);
      const boxY = Math.floor(h * 0.22);

      const screenLeftBox = { x: Math.floor(w * 0.05), y: boxY, w: boxW, h: boxH, title: 'YOUR LEFT HAND' };
      const screenRightBox = { x: Math.floor(w * 0.55), y: boxY, w: boxW, h: boxH, title: 'YOUR RIGHT HAND' };

      let rightRes = { detected: false, count: -1, landmarks: null };
      let leftRes = { detected: false, count: -1, landmarks: null };

      const now = Date.now();

      if (videoValid && handLandmarkerRef.current) {
        // Real detection is throttled to ~12/sec — plenty for a hold-gesture UX
        // and far cheaper than running the model every animation frame.
        if (now - lastDetectRef.current > 80) {
          lastDetectRef.current = now;
          try {
            const result = handLandmarkerRef.current.detectForVideo(video, performance.now());
            lastDetectResultRef.current = classifyHands(result, w, h);
          } catch (e) {
            // model not ready for this frame yet; keep last known result
          }
        }
        rightRes = lastDetectResultRef.current.rightRes;
        leftRes = lastDetectResultRef.current.leftRes;
      } else if (isSimulated) {
        rightRes = rightInZoneRef.current
          ? { detected: true, count: spec.rightHandReq.count, landmarks: null }
          : { detected: false, count: -1, landmarks: null };
        leftRes = leftInZoneRef.current
          ? { detected: true, count: spec.leftHandReq.count, landmarks: null }
          : { detected: false, count: -1, landmarks: null };
      }

      const drawBox = (box, res, targetReq) => {
        const ok = matchesRequirement(res, targetReq);
        const hasHand = res.detected;
        ctx.strokeStyle = ok ? '#10b981' : hasHand ? '#f59e0b' : 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.strokeRect(box.x, box.y, box.w, box.h);
        ctx.setLineDash([]);

        const c = 16;
        ctx.strokeStyle = ok ? '#34d399' : hasHand ? '#fbbf24' : '#38bdf8';
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        ctx.moveTo(box.x, box.y + c);
        ctx.lineTo(box.x, box.y);
        ctx.lineTo(box.x + c, box.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(box.x + box.w - c, box.y);
        ctx.lineTo(box.x + box.w, box.y);
        ctx.lineTo(box.x + box.w, box.y + c);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(box.x, box.y + box.h - c);
        ctx.lineTo(box.x, box.y + box.h);
        ctx.lineTo(box.x + c, box.y + box.h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(box.x + box.w - c, box.y + box.h);
        ctx.lineTo(box.x + box.w, box.y + box.h);
        ctx.lineTo(box.x + box.w, box.y + box.h - c);
        ctx.stroke();

        ctx.fillStyle = ok ? 'rgba(16, 185, 129, 0.9)' : hasHand ? 'rgba(180, 83, 9, 0.9)' : 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(box.x + 6, box.y + 6, box.w - 12, 22);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        const label = !hasHand
          ? `${box.title}: ✋ RAISE HERE (${targetReq.label})`
          : ok
            ? `${box.title}: ✓ MATCHED (${targetReq.label})`
            : `${box.title}: shape ≠ target (${res.count} fingers, need ${targetReq.count})`;
        ctx.fillText(label, box.x + 10, box.y + 20);
      };

      drawBox(screenLeftBox, leftRes, spec.leftHandReq);
      drawBox(screenRightBox, rightRes, spec.rightHandReq);

      // Draw the real 21-point skeleton, confined to wherever the hand actually is.
      const drawSkeleton = (res) => {
        if (!res.detected || !res.landmarks) return;
        const pts = res.landmarks;

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.5;
        FINGER_BONES.forEach((chain) => {
          ctx.beginPath();
          chain.forEach((idx, i) => {
            const p = pts[idx];
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          });
          ctx.stroke();
        });

        pts.forEach((p, idx) => {
          if (idx === 0) {
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
            ctx.fill();
          } else if ([4, 8, 12, 16, 20].includes(idx)) {
            ctx.fillStyle = '#10b981';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        });
      };

      drawSkeleton(rightRes);
      drawSkeleton(leftRes);

      if (now - lastStateSyncRef.current > 100) {
        lastStateSyncRef.current = now;

        if (videoValid) {
          leftInZoneRef.current = leftRes.detected;
          rightInZoneRef.current = rightRes.detected;
          setLeftInZone(leftRes.detected);
          setRightInZone(rightRes.detected);
        }

        const rightOk = matchesRequirement(rightRes, spec.rightHandReq);
        const leftOk = matchesRequirement(leftRes, spec.leftHandReq);
        const bothOk = rightOk && leftOk;

        if (bothOk) {
          setCurrentAccuracy(97);
          setIsMatching(true);

          if (!holdStartRef.current) {
            holdStartRef.current = now;
          }
          const elapsed = now - holdStartRef.current;
          const progress = Math.min(100, Math.round((elapsed / 1200) * 100));
          setHoldProgress(progress);
          setStatusMessage(`Both hands match! Hold for ${(1.2 - elapsed / 1000).toFixed(1)}s...`);
          setSecondaryTip(`Sign '${keyword?.toUpperCase()}' matched.`);

          if (progress >= 100 && now - lastPassTimeRef.current > 2000) {
            lastPassTimeRef.current = now;
            holdStartRef.current = null;
            setStatusMessage(`PASSED! '${keyword?.toUpperCase()}' verified!`);
            setSecondaryTip('Advancing to next sign...');
            onPassKeyword?.(keyword, 97);
          }
        } else {
          holdStartRef.current = null;
          setHoldProgress(0);
          if (!rightRes.detected && !leftRes.detected) {
            setCurrentAccuracy(0);
            setIsMatching(false);
            setStatusMessage('Raise your hands into the Left and Right boxes.');
            setSecondaryTip(spec.action);
          } else {
            setCurrentAccuracy(40);
            setIsMatching(false);
            setStatusMessage('Hand detected — adjust the shape to match the target.');
            setSecondaryTip(spec.action);
          }
        }
      }
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isCameraActive, isSimulated, spec, keyword, onPassKeyword]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [processFrame]);

  const handleInstantPass = () => {
    setIsMatching(true);
    setCurrentAccuracy(98);
    setStatusMessage(`Verified '${keyword?.toUpperCase()}' sign!`);
    setSecondaryTip('Passing to next sign...');

    let p = 0;
    const interval = setInterval(() => {
      p += 34;
      setHoldProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        onPassKeyword?.(keyword, 98);
      }
    }, 120);
  };

  const handleTriggerError = () => {
    setIsMatching(false);
    setCurrentAccuracy(20);
    setHoldProgress(0);
    setStatusMessage(`Incorrect sign for '${keyword?.toUpperCase()}'.`);
    setSecondaryTip('Smart wristband vibrated (RETRY SIGN).');
    onErrorTrigger?.({
      keyword,
      reason: spec.description,
      accuracy: 20,
    });
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-5 sm:p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isMatching ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary/20 text-primary'
              }`}
          >
            <Camera size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">Live Camera Evaluator</h4>
              {isCameraActive && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  Dual-Hand Active
                </span>
              )}
              {!modelReady && !modelError && (
                <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Loading model...
                </span>
              )}
              {modelError && (
                <span className="text-[11px] font-bold text-red-400 bg-red-500/15 px-2.5 py-0.5 rounded-full border border-red-500/30">
                  Model error
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Target Sign: <strong className="text-cyan-400 uppercase">{keyword}</strong> • {spec.name}
            </p>
          </div>
        </div>

        <button
          onClick={isCameraActive ? stopCamera : startCamera}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-sm ${isCameraActive
              ? 'border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
            }`}
        >
          {isCameraActive ? <CameraOff size={15} /> : <Camera size={15} />}
          {isCameraActive ? 'Stop Camera' : 'Open Camera'}
        </button>
      </div>

      <div className="relative mt-4 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-inner">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-contain opacity-0 pointer-events-none"
        />

        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`absolute inset-0 h-full w-full object-contain bg-slate-950 ${!isCameraActive ? 'hidden' : ''}`}
        />

        {!isCameraActive && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
            <div className="flex flex-col items-center justify-center max-w-sm">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-slate-400 border border-white/10 shadow-lg">
                {cameraError ? <AlertTriangle size={28} className="text-amber-400" /> : <Camera size={28} />}
              </div>
              <p className="text-sm font-bold text-white">
                {cameraError ? 'Camera Access Issue' : 'Camera is currently inactive'}
              </p>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                {cameraError || 'Open camera to track both hands in real-time or enable Virtual Hand Simulation.'}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={startCamera}
                  disabled={cameraLoading}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50"
                >
                  {cameraLoading ? <RefreshCw size={15} className="animate-spin" /> : <Camera size={15} />}
                  {cameraLoading ? 'Starting Camera...' : 'Retry Camera Feed'}
                </button>
                <button
                  onClick={enableSimulationMode}
                  className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition-all active:scale-95"
                >
                  <Sparkles size={15} />
                  Virtual Hand Mode
                </button>
              </div>
            </div>
          </div>
        )}

        {isCameraActive && (
          <div className="absolute top-3 right-3 flex items-center gap-2.5 rounded-xl border border-white/15 bg-black/85 px-3 py-1.5 backdrop-blur-md shadow-lg z-10">
            <div className="text-right">
              <div className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Dual Match</div>
              <div
                className={`text-base font-black font-mono ${currentAccuracy >= 60 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
              >
                {currentAccuracy}%
              </div>
            </div>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full ${currentAccuracy >= 60
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-400'
                }`}
            >
              {currentAccuracy >= 60 ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            </div>
          </div>
        )}

        {holdProgress > 0 && (
          <div className="absolute bottom-4 inset-x-8 z-20">
            <div className="flex justify-between text-xs font-black text-white mb-1.5 drop-shadow-md">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <Sparkles size={14} />
                HOLDING DUAL-HAND SIGN...
              </span>
              <span>{holdProgress}%</span>
            </div>
            <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-950/90 border-2 border-emerald-500/60 backdrop-blur shadow-xl">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"
                style={{ width: `${holdProgress}%` }}
                transition={{ ease: 'linear' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            const next = !leftInZone;
            leftInZoneRef.current = next;
            setLeftInZone(next);
          }}
          className={`rounded-2xl border p-3.5 transition-all text-left ${leftInZone
              ? 'border-emerald-500/50 bg-emerald-950/30'
              : 'border-white/10 bg-slate-900/80 hover:border-primary/40'
            }`}
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
            <span className="text-primary">YOUR LEFT HAND (Screen Left):</span>
            <span className={leftInZone ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {leftInZone ? '✓ IN ZONE' : 'EMPTY'}
            </span>
          </div>
          <p className="text-xs font-bold text-white">{spec.leftHandReq.label}</p>
        </button>

        <button
          onClick={() => {
            const next = !rightInZone;
            rightInZoneRef.current = next;
            setRightInZone(next);
          }}
          className={`rounded-2xl border p-3.5 transition-all text-left ${rightInZone
              ? 'border-emerald-500/50 bg-emerald-950/30'
              : 'border-white/10 bg-slate-900/80 hover:border-primary/40'
            }`}
        >
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
            <span className="text-cyan-400">YOUR RIGHT HAND (Screen Right):</span>
            <span className={rightInZone ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
              {rightInZone ? '✓ IN ZONE' : 'EMPTY'}
            </span>
          </div>
          <p className="text-xs font-bold text-white">{spec.rightHandReq.label}</p>
        </button>
      </div>

      <div
        className={`mt-4 rounded-2xl border p-4 transition-colors ${isMatching
            ? 'border-emerald-500/40 bg-emerald-950/40 shadow-emerald-500/10'
            : 'border-white/10 bg-slate-900/60'
          }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${isMatching ? 'bg-emerald-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
              }`}
          >
            {isMatching ? <CheckCircle2 size={15} /> : <Hand size={15} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">{statusMessage}</p>
            <p className="text-xs text-slate-300 mt-1">{secondaryTip}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4">
        <button
          onClick={handleInstantPass}
          className="flex w-full sm:w-auto flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-black text-white shadow-xl shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-400 transition-all active:scale-95"
        >
          <Sparkles size={18} />
          PASS SIGN & ADVANCE ({keyword?.toUpperCase()})
        </button>

        <button
          onClick={handleTriggerError}
          className="flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-3.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all active:scale-95 shadow-sm"
        >
          <Vibrate size={16} />
          Test Wrong Sign Vibration
        </button>
      </div>
    </div>
  );
};

export default CameraSignEvaluator;