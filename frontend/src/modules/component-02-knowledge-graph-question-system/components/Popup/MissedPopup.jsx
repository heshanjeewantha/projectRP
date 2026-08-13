import React from 'react';
import { AlertCircle, X, Repeat } from 'lucide-react';
import useStore from '../../../shared-app/utils/useStore';

const MissedPopup = ({ videoRef }) => {
  const { activePopup, setActivePopup } = useStore();

  if (!activePopup) return null;

  const handleRewind = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = activePopup.start_time;
      videoRef.current.play();
    }
    setActivePopup(null);
  };

  return (
    <div className="absolute top-4 right-4 z-50 w-80 animate-slide-up">
      <div className="solid-panel overflow-hidden border-warning/50 bg-bg-card">
        {/* Header */}
        <div className="bg-warning/10 px-4 py-3 border-b border-warning/30 flex justify-between items-center">
          <div className="flex items-center gap-2 text-warning font-semibold text-sm">
            <AlertCircle size={16} />
            <span>Missed Content Detected</span>
          </div>
          <button 
            onClick={() => setActivePopup(null)}
            className="text-text-muted hover:text-text-main transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-text-muted mb-3">
            It looks like you looked away. Here's what you missed:
          </p>
          <div className="bg-bg-dark rounded-md p-3 border border-border-color mb-4 text-sm">
            <p className="font-medium text-text-main italic">
              "{activePopup.transcript_text}"
            </p>
          </div>
          
          <button 
            onClick={handleRewind}
            className="btn w-full bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20"
          >
            <Repeat size={16} />
            Rewind to {Math.floor(activePopup.start_time)}s
          </button>
        </div>
      </div>
    </div>
  );
};

export default MissedPopup;
