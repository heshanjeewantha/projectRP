import { useRef, useEffect } from 'react';
import { Camera, CameraOff } from 'lucide-react';
import useStore from '../../../shared-app/utils/useStore';
import { useWebSocket } from '../../hooks/useWebSocket';
import { logAttentionBatch } from '../../services/attentionApi';

const WebcamFeed = ({ videoRef, compact = false }) => {
  const videoElementRef = useRef(null);
  const canvasRef = useRef(null);
  const eventsBuffer = useRef([]);
  const latestDetectionRef = useRef(null);
  
  const { sessionId, userId, currentVideo, isWebcamActive, setWebcamActive, attentionStatus } = useStore();
  const effectiveUserId = userId || 'student_demo_123';
  const { isConnected, latestDetection, sendFrame } = useWebSocket(sessionId);

  useEffect(() => {
    latestDetectionRef.current = latestDetection;
  }, [latestDetection]);

  // Setup generic HTML5 webcam
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
        console.error("Camera access denied:", err);
        setWebcamActive(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [setWebcamActive]);

  // Frame capture loop
  useEffect(() => {
    let intervalId;

    if (isWebcamActive && isConnected) {
      intervalId = setInterval(() => {
        const video = videoElementRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;

        if (canvas.width === 0) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const base64Frame = canvas.toDataURL('image/jpeg', 0.5);
        const videoTimestamp = videoRef?.current?.currentTime || 0;

        sendFrame(base64Frame, videoTimestamp);

        const latestEvent = latestDetectionRef.current;
        if (latestEvent) {
          eventsBuffer.current.push({
            timestamp: videoTimestamp,
            status: latestEvent.status,
            eye_open: latestEvent.eye_open ?? true,
            head_pose_deviation: latestEvent.head_pose_deviation ?? 0,
          });
        }
      }, 500); // 2 FPS
    }

    return () => clearInterval(intervalId);
  }, [isWebcamActive, isConnected, sendFrame, videoRef]);

  // Batch logging loop (every 5 seconds)
  useEffect(() => {
    if (!currentVideo) return;

    const intervalId = setInterval(() => {
      if (eventsBuffer.current.length > 0) {
        const eventsToSend = [...eventsBuffer.current];
        eventsBuffer.current = []; // Clear buffer
        
        logAttentionBatch(effectiveUserId, sessionId, currentVideo.id, eventsToSend)
          .catch(err => console.error("Failed to batch log attention:", err));
      }
    }, 5000);
    return () => clearInterval(intervalId);
  }, [currentVideo, effectiveUserId, sessionId]);

  const toggleWebcam = () => {
    setWebcamActive(!isWebcamActive);
  };

  if (compact) {
    return (
      <div className="dashboard-media-frame relative isolate">
        <video
          ref={videoElementRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover transition-opacity duration-500 ${
            isWebcamActive ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {isWebcamActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
            <div className="h-1 w-full bg-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-[scan_3s_ease-in-out_infinite]" />
          </div>
        )}

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
          <Camera size={20} className={isWebcamActive ? "text-primary" : "text-text-muted"} />
          Attention Monitor
        </h3>
        
        {isWebcamActive && (
          <div className="flex items-center gap-2 rounded-full bg-black/20 px-3 py-1">
            {attentionStatus === 'attentive' ? (
              <><span className="h-2 w-2 rounded-full bg-success animate-pulse"></span> <span className="text-xs font-medium text-success">Attentive</span></>
            ) : attentionStatus === 'not_attentive' ? (
              <><span className="h-2 w-2 rounded-full bg-warning animate-pulse"></span> <span className="text-xs font-medium text-warning">Distracted</span></>
            ) : (
              <><span className="h-2 w-2 rounded-full bg-text-muted"></span> <span className="text-xs font-medium text-text-muted">Calibrating...</span></>
            )}
          </div>
        )}
      </div>

      <div className="dashboard-media-frame relative">
        <video
          ref={videoElementRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transition-opacity duration-500 ${isWebcamActive ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* Scanning line animation when active */}
        {isWebcamActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px]">
            <div className="w-full h-1 bg-primary/40 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-[scan_3s_ease-in-out_infinite]"></div>
          </div>
        )}

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
      </div>
      
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
      
      {/* Hidden canvas for extracting frames */}
      <canvas ref={canvasRef} width="320" height="240" className="hidden" />
    </div>
  );
};

export default WebcamFeed;
