import { useEffect, useRef, useState } from 'react';
import useStore from '../../shared-app/utils/useStore';

export const useWebSocket = (sessionId) => {
  const [isConnected, setIsConnected]     = useState(false);
  const [latestDetection, setLatestDetection] = useState(null);
  const wsRef = useRef(null);

  // Store setters
  const setAttentionStatus  = useStore((s) => s.setAttentionStatus);
  const setAttentionDetail  = useStore((s) => s.setAttentionDetail);
  const setDrowsiness       = useStore((s) => s.setDrowsiness);
  const setPhoneDetected    = useStore((s) => s.setPhoneDetected);
  const setYawning          = useStore((s) => s.setYawning);
  const setGazeDirection    = useStore((s) => s.setGazeDirection);
  const setBlinkRate        = useStore((s) => s.setBlinkRate);
  const setEngagementScore  = useStore((s) => s.setEngagementScore);
  const setLiveSign         = useStore((s) => s.setLiveSign);
  const addAttentionEvent   = useStore((s) => s.addAttentionEvent);

  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost     = window.location.hostname || 'localhost';
    const wsUrl      = `${wsProtocol}://${wsHost}:8000/ws/attention/${sessionId}`;
    const ws         = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (!isMounted) { ws.close(); return; }
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const data = JSON.parse(event.data);

        // Only process valid attention payloads
        if (data.status !== 'attentive' && data.status !== 'not_attentive') return;

        setLatestDetection(data);
        setAttentionStatus(data.status);
        setAttentionDetail(data);

        // Drowsiness
        if (data.drowsiness_score !== undefined) {
          setDrowsiness(data.drowsiness_score ?? 0, data.perclos ?? 0);
        }

        // Phone
        if (data.phone_detected !== undefined) {
          setPhoneDetected(!!data.phone_detected);
        }

        // Yawning
        if (data.yawning !== undefined) {
          setYawning(!!data.yawning);
        }

        // Gaze
        if (data.gaze_direction) {
          setGazeDirection(data.gaze_direction);
        }

        // Blink rate
        if (data.blink_rate !== undefined) {
          setBlinkRate(data.blink_rate ?? 0);
        }

        // Engagement score
        if (data.engagement_score !== undefined) {
          setEngagementScore(data.engagement_score ?? 100);
        }

        // Live sign
        if (data.sign_text !== undefined) {
          setLiveSign(
            data.sign_text,
            data.sign_confidence ?? 0,
            data.sign_explanation ?? ''
          );
        }

        // Session event log (throttled — only log every 5th frame to save memory)
        if (data.timestamp !== undefined) {
          addAttentionEvent({
            timestamp:       data.timestamp,
            status:          data.status,
            reason:          data.reason ?? 'unknown',
            engagementScore: data.engagement_score ?? 100,
          });
        }

      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    ws.onclose = () => {
      if (isMounted) {
        setIsConnected(false);
        setLatestDetection(null);
      }
    };

    wsRef.current = ws;

    return () => {
      isMounted = false;
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [
    sessionId,
    setAttentionStatus, setAttentionDetail,
    setDrowsiness, setPhoneDetected, setYawning,
    setGazeDirection, setBlinkRate, setEngagementScore,
    setLiveSign, addAttentionEvent,
  ]);

  const sendFrame = (base64Frame, videoTimestamp) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        frame:     base64Frame,
        timestamp: videoTimestamp,
      }));
    }
  };

  return { isConnected, latestDetection, sendFrame };
};
