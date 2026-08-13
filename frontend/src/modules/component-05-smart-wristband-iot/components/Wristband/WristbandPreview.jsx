import { useEffect, useRef, useState } from 'react';

const PULSE_CLASS_MAP = {
  'Short Pulse': 'wristband-preview-pulse-short',
  'Double Pulse': 'wristband-preview-pulse-double',
  'Long Pulse': 'wristband-preview-pulse-long',
  'Short + Long': 'wristband-preview-pulse-mixed',
  'Repeated Pulse': 'wristband-preview-pulse-repeat',
  'Emergency Pulse': 'wristband-preview-pulse-emergency',
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getMessageLines = (message) => {
  const fallback = 'READY';
  const normalized = (message || fallback).trim();
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length <= 1) return [normalized];
  if (words.length === 2) return words;

  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
};

const getMessageFontSize = (lines) => {
  const longestLine = lines.reduce((max, line) => Math.max(max, line.length), 0);
  if (longestLine >= 11) return 18;
  if (longestLine >= 9) return 20;
  return 22;
};

const WristbandPreview = ({
  oledMessage,
  vibrationPattern,
  connectionStatus,
  intensity = 70,
}) => {
  const dragStateRef = useRef({ active: false, x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: -8, y: 8 });
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const handlePointerUp = () => {
      dragStateRef.current.active = false;
    };

    window.addEventListener('pointerup', handlePointerUp);
    return () => window.removeEventListener('pointerup', handlePointerUp);
  }, []);

  const handlePointerDown = (event) => {
    dragStateRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handlePointerMove = (event) => {
    if (!dragStateRef.current.active) return;

    const deltaX = event.clientX - dragStateRef.current.x;
    const deltaY = event.clientY - dragStateRef.current.y;
    dragStateRef.current = {
      active: true,
      x: event.clientX,
      y: event.clientY,
    };

    setRotation((previous) => ({
      x: clamp(previous.x - deltaY * 0.18, -18, 14),
      y: clamp(previous.y + deltaX * 0.2, -24, 24),
    }));
  };

  const vibrationClass = PULSE_CLASS_MAP[vibrationPattern] || 'wristband-preview-pulse-short';
  const intensityGlow = 0.2 + intensity / 150;
  const messageLines = getMessageLines(oledMessage);
  const messageFontSize = getMessageFontSize(messageLines);

  return (
    <div className="wristband-preview-shell">
      <div
        className="wristband-preview-stage"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
      >
        <div className="wristband-preview-grid" />

        <div className="wristband-preview-device-hover">
          <div
            className="wristband-preview-device"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoomLevel})`,
            }}
          >
            <div className="wristband-preview-shadow" />
            <div
              className={`wristband-preview-wave ${vibrationClass}`}
              style={{ opacity: intensityGlow }}
            />
            <div
              className={`wristband-preview-wave wristband-preview-wave-delay ${vibrationClass}`}
              style={{ opacity: intensityGlow * 0.76 }}
            />

            <svg
              className="wristband-preview-svg"
              viewBox="0 0 420 520"
              aria-hidden="true"
            >
            <defs>
              <linearGradient id="bandOuter" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#20362b" />
                <stop offset="55%" stopColor="#101b15" />
                <stop offset="100%" stopColor="#08100c" />
              </linearGradient>
              <linearGradient id="bandInner" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#15251d" />
                <stop offset="100%" stopColor="#09110d" />
              </linearGradient>
              <linearGradient id="bodyOuter" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#18231d" />
                <stop offset="100%" stopColor="#060b08" />
              </linearGradient>
              <linearGradient id="bezelGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(141, 229, 188, 0.18)" />
                <stop offset="100%" stopColor="rgba(52, 211, 153, 0.04)" />
              </linearGradient>
              <linearGradient id="screenFill" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#09110d" />
                <stop offset="100%" stopColor="#030605" />
              </linearGradient>
              <filter id="watchShadow" x="-30%" y="-30%" width="160%" height="180%">
                <feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#000000" floodOpacity="0.32" />
              </filter>
              <filter id="screenGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#5fbf97" floodOpacity="0.18" />
              </filter>
              <clipPath id="screenClip">
                <rect x="144" y="184" width="132" height="116" rx="24" />
              </clipPath>
            </defs>

            <g className="wristband-preview-smartwatch-group">
              <g className="wristband-preview-top-band-group">
                <path
                  className="wristband-preview-band-shape"
                  d="M164 184 C150 126 154 76 182 28 L238 28 C266 76 270 126 256 184 Z"
                  fill="url(#bandOuter)"
                />
                <path
                  className="wristband-preview-band-inner-shape"
                  d="M178 182 C166 130 170 88 190 44 L230 44 C250 88 254 130 242 182 Z"
                  fill="url(#bandInner)"
                />
              </g>

              <g className="wristband-preview-bottom-band-group">
                <path
                  className="wristband-preview-band-shape"
                  d="M164 336 C150 394 154 444 182 492 L238 492 C266 444 270 394 256 336 Z"
                  fill="url(#bandOuter)"
                />
                <path
                  className="wristband-preview-band-inner-shape"
                  d="M178 338 C166 390 170 432 190 476 L230 476 C250 432 254 390 242 338 Z"
                  fill="url(#bandInner)"
                />
              </g>

              <g className="wristband-preview-watch-body-group" filter="url(#watchShadow)">
                <rect
                  x="108"
                  y="148"
                  width="204"
                  height="188"
                  rx="56"
                  className="wristband-preview-body-shape"
                  fill="url(#bodyOuter)"
                />
                <rect
                  x="120"
                  y="160"
                  width="180"
                  height="164"
                  rx="46"
                  className="wristband-preview-bezel-shape"
                  fill="rgba(11,18,14,0.92)"
                  stroke="rgba(255,255,255,0.04)"
                />
                <rect
                  x="138"
                  y="178"
                  width="144"
                  height="128"
                  rx="30"
                  className="wristband-preview-screen-shape"
                  fill="url(#screenFill)"
                  filter="url(#screenGlow)"
                />
                <rect
                  x="139"
                  y="179"
                  width="142"
                  height="126"
                  rx="29"
                  fill="none"
                  stroke="rgba(103, 194, 156, 0.08)"
                />
                <rect
                  x="161"
                  y="188"
                  width="52"
                  height="22"
                  rx="9"
                  fill="rgba(107, 194, 156, 0.12)"
                />
                <rect
                  x="108"
                  y="178"
                  width="18"
                  height="40"
                  rx="8"
                  fill="rgba(18, 29, 22, 0.96)"
                />
                <rect
                  x="294"
                  y="220"
                  width="12"
                  height="44"
                  rx="6"
                  fill="rgba(170, 184, 177, 0.32)"
                />
                <rect
                  x="298"
                  y="230"
                  width="4"
                  height="24"
                  rx="2"
                  fill="rgba(225, 233, 229, 0.16)"
                />

                <circle
                  cx="173"
                  cy="199"
                  r="5"
                  fill={connectionStatus === 'connected' ? '#6bc29c' : '#ef8897'}
                />
                <text x="184" y="204" className="wristband-preview-svg-header">
                  {connectionStatus === 'connected' ? 'ONLINE' : 'OFFLINE'}
                </text>

                <g clipPath="url(#screenClip)">
                  {messageLines.map((line, index) => (
                    <text
                      key={`${line}-${index}`}
                      x="210"
                      y={messageLines.length === 1 ? 258 : index === 0 ? 240 : 278}
                      textAnchor="middle"
                      className="wristband-preview-svg-message"
                      style={{ fontSize: `${messageFontSize}px` }}
                    >
                      {line}
                    </text>
                  ))}

                  <text
                    x="210"
                    y="292"
                    textAnchor="middle"
                    className="wristband-preview-svg-pattern"
                  >
                    {vibrationPattern}
                  </text>
                </g>
              </g>
            </g>
            </svg>
          </div>
        </div>
      </div>

      <div className="wristband-preview-controls">
        <label className="wristband-preview-control">
          <span>Zoom</span>
          <input
            type="range"
            min="0.84"
            max="1.24"
            step="0.02"
            value={zoomLevel}
            onChange={(event) => setZoomLevel(Number(event.target.value))}
          />
        </label>
        <label className="wristband-preview-control">
          <span>Rotate Y</span>
          <input
            type="range"
            min="-24"
            max="24"
            step="1"
            value={rotation.y}
            onChange={(event) =>
              setRotation((previous) => ({ ...previous, y: Number(event.target.value) }))
            }
          />
        </label>
      </div>
    </div>
  );
};

export default WristbandPreview;
