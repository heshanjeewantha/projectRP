import { useEffect, useMemo, useRef, useState } from 'react';
import { BrainCircuit, FastForward, Gauge, Play, RotateCcw, Volume2, Sparkles } from 'lucide-react';


import SignAvatar2D from './two-d-sign-avatar/SignAvatar2D';
import { extractKeywords } from './two-d-sign-avatar/keywordExtraction';
import { signDictionaryLookup } from '../../data/signDictionary';

const LANDMARK_API = '/api/signs/landmark-sequence';

// In-memory cache for fetched WLASL landmark files
const landmarkCache = new Map();

const fetchLandmarkFrames = async (keyword) => {
  if (!keyword) return null;
  const key = keyword.toLowerCase();
  if (landmarkCache.has(key)) return landmarkCache.get(key);
  try {
    const res = await fetch(`${LANDMARK_API}/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const frames = data?.frames?.length ? data.frames : null;
    landmarkCache.set(key, frames);
    return frames;
  } catch {
    return null;
  }
};

const SPEED_OPTIONS = [
  { label: '0.25x', value: 0.25, tip: '0.25x Ultra Slow' },
  { label: '0.5x', value: 0.5, tip: '0.5x Slow' },
  { label: '0.75x', value: 0.75, tip: '0.75x Moderate' },
  { label: '1.0x', value: 1.0, tip: '1.0x Normal' },
  { label: '1.25x', value: 1.25, tip: '1.25x Fast' },
];

const AvatarAnimationController = ({
  sequence = [],
  isPlaying,
  currentIndex = 0,
  onCurrentIndexChange,
  onSequenceComplete,
  resetToken,
}) => {
  const [landmarkFrames, setLandmarkFrames] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [internalReset, setInternalReset] = useState(0);

  const [debug, setDebug] = useState({
    keywords: [],
    currentSign: '—',
    currentFrame: '0/0',
    animationState: 'IDLE',
    sinhalaMeaning: '',
  });

  // Active keyword info
  const activeKeyword = sequence[currentIndex]?.keyword?.toLowerCase() ?? null;
  const activeItem = sequence[currentIndex] || null;
  const activeEntry = activeKeyword ? signDictionaryLookup[activeKeyword] : null;
  const sinhalaMeaning = activeEntry?.sinhalaMeaning || '';
  const isWlaslItem = Boolean(activeItem?.wlaslModelClass);
  const wlaslAccLabel = isWlaslItem
    ? `${activeItem.wlaslArchitecture || 'BiLSTM'} · ${((activeItem.wlaslValAccuracy || 0) * 100).toFixed(0)}% acc`
    : null;


  // All extracted keywords from sequence
  const allKeywords = useMemo(
    () => extractKeywords(sequence.map((item) => String(item?.keyword || '')).join(' ')),
    [sequence]
  );

  // Fetch real ASL landmark frames whenever active keyword changes
  const lastFetchedRef = useRef(null);
  useEffect(() => {
    if (!activeKeyword) {
      setLandmarkFrames(null);
      return;
    }
    if (activeKeyword === lastFetchedRef.current) return;
    lastFetchedRef.current = activeKeyword;
    setLandmarkFrames(null);
    fetchLandmarkFrames(activeKeyword).then((frames) => {
      setLandmarkFrames(frames);
    });
  }, [activeKeyword]);

  const activeKeywords = useMemo(
    () => (activeKeyword ? [activeKeyword] : allKeywords.slice(0, 1)),
    [activeKeyword, allKeywords]
  );

  const handleReplayActiveSign = () => {
    setInternalReset((val) => val + 1);
  };

  return (
    <div className="sign-avatar-controller sign-avatar-controller--2d">
      {/* Top Controller Header / Toolbar */}
      <div className="sign-avatar-controller__toolbar">
        <div className="sign-avatar-controller__badge-row">
          <span className="sign-avatar-controller__badge">
            <Sparkles size={13} />
            2D Canvas Avatar
          </span>
          <span
            className={`sign-avatar-controller__badge ${
              landmarkFrames ? 'is-direct' : 'is-fallback'
            }`}
          >
            {landmarkFrames ? '● Real ASL Dataset (WLASL)' : '● Synthetic Pose Rig'}
          </span>
          {isWlaslItem && (
            <span className="sign-avatar-controller__badge is-wlasl-model" title={wlaslAccLabel}>
              <BrainCircuit size={12} />
              {wlaslAccLabel}
            </span>
          )}
        </div>


        {/* Speed Selector */}
        <div className="sign-avatar-controller__speed-group">
          <Gauge size={14} className="sign-avatar-controller__speed-icon" />
          <span className="sign-avatar-controller__speed-label">Speed:</span>
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPlaybackSpeed(opt.value)}
              className={`sign-avatar-controller__speed-btn ${
                playbackSpeed === opt.value ? 'is-active' : ''
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleReplayActiveSign}
            title="Replay Current Sign"
            className="sign-avatar-controller__replay-btn"
          >
            <RotateCcw size={13} />
            Replay
          </button>
        </div>
      </div>

      {/* Main Canvas Avatar Stage */}
      <div className="sign-avatar-controller__stage sign-avatar-2d">
        <SignAvatar2D
          keywords={activeKeywords}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          resetToken={resetToken + internalReset}
          landmarkFrames={landmarkFrames}
          sinhalaMeaning={sinhalaMeaning}
          onSequenceComplete={onSequenceComplete}
          onDebugChange={setDebug}
        />
      </div>

      {/* User-Friendly Sign Details Card */}
      <div className="sign-avatar-controller__details sign-avatar-2d__debug">
        <div className="sign-avatar-controller__word-card">
          <div className="sign-avatar-controller__current-box">
            <div className="sign-avatar-controller__label">Currently Signing</div>
            <div className="sign-avatar-controller__word-hero">
              <span className="sign-avatar-controller__hero-en">{debug.currentSign}</span>
              {sinhalaMeaning && (
                <span className="sign-avatar-controller__hero-si">{sinhalaMeaning}</span>
              )}
            </div>
          </div>

          <div className="sign-avatar-controller__meta-grid">
            <div className="sign-avatar-controller__meta-item">
              <span className="sign-avatar-controller__meta-lbl">Frame</span>
              <strong>{debug.currentFrame}</strong>
            </div>
            <div className="sign-avatar-controller__meta-item">
              <span className="sign-avatar-controller__meta-lbl">State</span>
              <strong className={`sign-avatar-controller__state is-${debug.animationState.toLowerCase()}`}>
                {debug.animationState}
              </strong>
            </div>
            <div className="sign-avatar-controller__meta-item">
              <span className="sign-avatar-controller__meta-lbl">Source</span>
              <strong>
                {isWlaslItem && wlaslAccLabel
                  ? wlaslAccLabel
                  : landmarkFrames
                  ? `${landmarkFrames.length} WLASL Frames`
                  : 'Kinematic'}
              </strong>
            </div>

            <div className="sign-avatar-controller__meta-item">
              <span className="sign-avatar-controller__meta-lbl">Speed</span>
              <strong>{playbackSpeed}x</strong>
            </div>
          </div>

          <div className="sign-avatar-controller__keywords-row">
            <span className="sign-avatar-controller__label">Full Lesson Sequence:</span>
            <div className="sign-avatar-controller__keyword-chips">
              {sequence.map((item, idx) => {
                const kw = item?.keyword || '';
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={`${kw}-${idx}`}
                    type="button"
                    onClick={() => onCurrentIndexChange?.(idx)}
                    className={`sign-avatar-controller__kw-chip ${isActive ? 'is-active' : ''}`}
                  >
                    {kw}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarAnimationController;
