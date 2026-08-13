import { useMemo, useState } from 'react';

import SignAvatar2D from './two-d-sign-avatar/SignAvatar2D';
import { extractKeywords } from './two-d-sign-avatar/keywordExtraction';

const AvatarAnimationController = ({ sequence = [], isPlaying, onSequenceComplete, resetToken }) => {
  const [debug, setDebug] = useState({ keywords: [], currentSign: '—', currentFrame: '0/0', animationState: 'IDLE' });
  const keywords = useMemo(() => extractKeywords(sequence.map((item) => String(item?.keyword || '')).join(' ')), [sequence]);

  return (
    <div className="sign-avatar-controller sign-avatar-controller--2d">
      <div className="sign-avatar-controller__stage sign-avatar-2d">
        <SignAvatar2D keywords={keywords} isPlaying={isPlaying} resetToken={resetToken} onSequenceComplete={onSequenceComplete} onDebugChange={setDebug} />
      </div>
      <div className="sign-avatar-controller__details sign-avatar-2d__debug">
        <div className="sign-avatar-controller__badge-row">
          <span className="sign-avatar-controller__badge">2D Canvas avatar</span>
          <span className="sign-avatar-controller__badge">Frame-based sign player</span>
        </div>
        <div className="sign-avatar-controller__word-card">
          <div className="sign-avatar-controller__label">Detected Keywords</div>
          <div className="sign-avatar-controller__subtitle">{debug.keywords.join(' · ') || 'No supported ICT signs detected'}</div>
          <div className="sign-avatar-controller__label">Current Sign</div>
          <div className="sign-avatar-controller__word">{debug.currentSign}</div>
          <div className="sign-avatar-controller__subtitle">Frame: {debug.currentFrame} · State: {debug.animationState}</div>
        </div>
      </div>
    </div>
  );
};

export default AvatarAnimationController;
