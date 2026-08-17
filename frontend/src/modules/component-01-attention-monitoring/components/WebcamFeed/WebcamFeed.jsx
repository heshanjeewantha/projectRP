import { useRef, useEffect } from 'react';
import { Camera, CameraOff, Smartphone, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../../../shared-app/utils/useStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { logAttentionBatch } from '../../services/attentionApi';

const WebcamFeed = ({ videoRef, compact = false }) => {
  const videoElementRef   = useRef(null);
  const canvasRef         = useRef(null);
  const eventsBuffer      = useRef([]);
  const latestDetectionRef = useRef(null);

  const {
    sessionId, userId, currentVideo, isWebcamActive, setWebcamActive,
    attentionStatus,
    drowsinessScore, phoneDetected, yawning,
    gazeDirection, blinkRate, engagementScore,
  } = useStore();

  const effectiveUserId               = userId || 'student_demo_123';
  const { isConnected, latestDetection, sendFrame } = useWebSocket(sessionId);

  useEffect(() => {
    latestDetectionRef.current = latestDetection;
  }, [latestDetection]);

  // Setup webcam
  useEffect(() => {
    let stream = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = stream;
        }
        setWebcamActive(true);
      } catch (err) {
        console.error('Camera access denied:', err);
        setWebcamActive(false);
      }
    };
    startCamera();
    return () => { if (stream) stream.getTracks().forEach((t) => t.stop()); };
  }, [setWebcamActive]);

  // Frame capture loop
  useEffect(() => {
    let intervalId;
    if (isWebcamActive && isConnected) {
      intervalId = setInterval(() => {
        const video  = videoElementRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width  = video.videoWidth  || 320;
        canvas.height = video.videoHeight || 240;
        if (canvas.width === 0) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Frame     = canvas.toDataURL('image/jpeg', 0.5);
        const videoTimestamp  = videoRef?.current?.currentTime || 0;
        sendFrame(base64Frame, videoTimestamp);

        const latestEvent = latestDetectionRef.current;
        if (latestEvent) {
          eventsBuffer.current.push({
            timestamp:           videoTimestamp,
            status:              latestEvent.status,
            reason:              latestEvent.reason ?? 'unknown',
            eye_open:            latestEvent.eye_open ?? true,
            head_pose_deviation: latestEvent.head_pose_deviation ?? 0,
            perclos:             latestEvent.perclos ?? 0,
            drowsiness_score:    latestEvent.drowsiness_score ?? 0,
            mar:                 latestEvent.mar ?? 0,
            yawning:             latestEvent.yawning ?? false,
            blink_rate:          latestEvent.blink_rate ?? 0,
            gaze_direction:      latestEvent.gaze_direction ?? 'center',
            phone_detected:      latestEvent.phone_detected ?? false,
            phone_confidence:    latestEvent.phone_confidence ?? 0,
            sign_text:           latestEvent.sign_text ?? null,
            sign_confidence:     latestEvent.sign_confidence ?? 0,
            engagement_score:    latestEvent.engagement_score ?? 100,
          });
        }
      }, 500); // 2 FPS
    }
    return () => clearInterval(intervalId);
  }, [isWebcamActive, isConnected, sendFrame, videoRef]);

  // Batch logging every 5 seconds
  useEffect(() => {
    if (!currentVideo) return;
    const intervalId = setInterval(() => {
      if (eventsBuffer.current.length > 0) {
        const eventsToSend      = [...eventsBuffer.current];
        eventsBuffer.current    = [];
        logAttentionBatch(effectiveUserId, sessionId, currentVideo.id, eventsToSend)
          .catch((err) => console.error('Failed to batch log attention:', err));
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [currentVideo, effectiveUserId, sessionId]);

  const toggleWebcam = () => setWebcamActive(!isWebcamActive);

  // Derived alert states
  const isDrowsy   = drowsinessScore >= 0.35;
  const isDistracted = attentionStatus === 'not_attentive';
  const gazeOff    = gazeDirection === 'left' || gazeDirection === 'right';

  // Gaze indicator dot position
  const gazeDotStyle = {
    center: { left: '50%', top: '50%' },
    left:   { left: '20%', top: '50%' },
    right:  { left: '80%', top: '50%' },
    up:     { left: '50%', top: '20%' },
    down:   { left: '50%', top: '80%' },
    unknown:{ left: '50%', top: '50%' },
  }[gazeDirection] || { left: '50%', top: '50%' };

  // Engagement color
  const engagementColor =
    engagementScore >= 70 ? '#5fbf97' :
    engagementScore >= 40 ? '#f59e0b' : '#ef4444';

  if (compact) {
    return (
      <div className="dashboard-media-frame relative isolate overflow-hidden">
        <video
          ref={videoElementRef}
          autoPlay playsInline muted
          className={`h-full w-full object-cover transition-opacity duration-500 ${isWebcamActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Scanning line */}
        {isWebcamActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
            <div className="h-1 w-full bg-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-[scan_3s_ease-in-out_infinite]" />
          </div>
        )}

        {/* Phone alert overlay */}
        <AnimatePresence>
          {phoneDetected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm"
            >
              <Smartphone size={12} />
              Phone in Hand Detected!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drowsy alert */}
        <AnimatePresence>
          {isDrowsy && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm"
            >
              <Moon size={12} />
              Drowsy
            </motion.div>
          )}
        </AnimatePresence>

        {/* Yawning alert */}
        <AnimatePresence>
          {yawning && !isDrowsy && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-orange-400/90 px-3 py-1.5 text-xs font-bold text-white shadow-lg backdrop-blur-sm"
            >
              😴 Yawning
            </motion.div>
          )}
        </AnimatePresence>

        {/* Audio bars */}
        {!isWebcamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
            <CameraOff size={32} className="opacity-50" />
            <span className="text-sm">Camera inactive</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2 px-4 pb-4">
          {[18, 24, 28, 30, 34, 36, 42, 46].map((height, index) => (
            <span
              key={index}
              className="w-3 rounded-full bg-[linear-gradient(180deg,rgba(95,191,151,0.9),rgba(34,197,94,0.65))] opacity-90"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>

        <canvas ref={canvasRef} width="320" height="240" className="hidden" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4 flex w-full items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Camera size={20} className={isWebcamActive ? 'text-primary' : 'text-text-muted'} />
          Attention Monitor
        </h3>

        {isWebcamActive && (
          <div className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-1">
            {attentionStatus === 'attentive' ? (
              <><span className="h-2 w-2 rounded-full bg-success animate-pulse" /><span className="text-xs font-medium text-success">Attentive</span></>
            ) : attentionStatus === 'not_attentive' ? (
              <><span className="h-2 w-2 rounded-full bg-warning animate-pulse" /><span className="text-xs font-medium text-warning">Distracted</span></>
            ) : (
              <><span className="h-2 w-2 rounded-full bg-text-muted" /><span className="text-xs font-medium text-text-muted">Calibrating...</span></>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-media-frame relative overflow-hidden">
        <video
          ref={videoElementRef}
          autoPlay playsInline muted
          className={`w-full h-full object-cover transition-opacity duration-500 ${isWebcamActive ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Scanning line */}
        {isWebcamActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
            <div className="w-full h-1 bg-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-[scan_3s_ease-in-out_infinite]" />
          </div>
        )}

        {/* Phone detected */}
        <AnimatePresence>
          {phoneDetected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-sm"
            >
              <Smartphone size={13} />
              📱 Phone Detected!
            </motion.div>
          )}
        </AnimatePresence>

        {/* Drowsy alert */}
        <AnimatePresence>
          {isDrowsy && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: [1, 0.6, 1], y: 0 }}
              transition={{ opacity: { repeat: Infinity, duration: 1.5 } }}
              exit={{ opacity: 0 }}
              className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-amber-500/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-sm"
            >
              <Moon size={13} />
              😴 Drowsy Alert
            </motion.div>
          )}
        </AnimatePresence>

        {/* Yawning */}
        <AnimatePresence>
          {yawning && !isDrowsy && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-orange-400/90 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-sm"
            >
              🥱 Yawning
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gaze indicator (small dot on mini eye diagram) */}
        {isWebcamActive && gazeDirection !== 'unknown' && (
          <div
            className="pointer-events-none absolute bottom-16 right-3 h-8 w-8 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm"
            title={`Gaze: ${gazeDirection}`}
          >
            <div
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_6px_rgba(99,102,241,0.8)] transition-all duration-300"
              style={gazeDotStyle}
            />
          </div>
        )}

        {/* Camera inactive */}
        {!isWebcamActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-text-muted">
            <CameraOff size={32} className="opacity-50" />
            <span className="text-sm">Camera inactive</span>
          </div>
        )}

        {/* Audio bars */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end gap-2 px-4 pb-4">
          {[18, 24, 28, 30, 34, 36, 42, 46].map((height, index) => (
            <span
              key={index}
              className="w-3 rounded-full bg-[linear-gradient(180deg,rgba(95,191,151,0.9),rgba(34,197,94,0.65))] opacity-90"
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
      </div>

      {/* Engagement bar */}
      {isWebcamActive && (
        <div className="mt-3 w-full">
          <div className="mb-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-text-muted">
            <span>Engagement</span>
            <span style={{ color: engagementColor }}>{engagementScore}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: engagementColor }}
              animate={{ width: `${engagementScore}%` }}
              transition={{ type: 'spring', stiffness: 80 }}
            />
          </div>
        </div>
      )}

      <button
        onClick={toggleWebcam}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-medium transition-all ${
          isWebcamActive
            ? 'border border-danger/20 bg-danger/10 text-danger hover:bg-danger/16'
            : 'bg-primary text-[#032418] hover:bg-primary-hover shadow-md'
        }`}
      >
        {isWebcamActive ? <CameraOff size={18} /> : <Camera size={18} />}
        {isWebcamActive ? 'Stop Tracking' : 'Start Tracking'}
      </button>

      <canvas ref={canvasRef} width="320" height="240" className="hidden" />
    </div>
  );
};

export default WebcamFeed;
