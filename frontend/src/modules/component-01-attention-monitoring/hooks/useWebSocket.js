import { useEffect, useRef, useState } from 'react';
import useStore from '../../shared-app/utils/useStore';

export const useWebSocket = (sessionId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [latestDetection, setLatestDetection] = useState(null);
  const wsRef = useRef(null);
  const setAttentionStatus = useStore((state) => state.setAttentionStatus);

  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsHost = window.location.hostname || 'localhost';
    const wsUrl = `${wsProtocol}://${wsHost}:8000/ws/attention/${sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      if (!isMounted) {
        ws.close();
        return;
      }
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'attentive' || data.status === 'not_attentive') {
          setLatestDetection(data);
          setAttentionStatus(data.status);
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
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      // If it's CONNECTING, it will be closed in onopen to prevent the warning
    };
  }, [sessionId, setAttentionStatus]);

  const sendFrame = (base64Frame, videoTimestamp) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        frame: base64Frame,
        timestamp: videoTimestamp
      }));
    }
  };

  return { isConnected, latestDetection, sendFrame };
};
