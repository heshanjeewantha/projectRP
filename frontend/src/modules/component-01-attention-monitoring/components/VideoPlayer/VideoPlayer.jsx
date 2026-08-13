import { useState } from 'react';
import { Play, Pause, Volume2, Maximize, MonitorPlay } from 'lucide-react';
import MissedPopup from '../../../component-02-knowledge-graph-question-system/components/Popup/MissedPopup';

const VideoPlayer = ({ video, transcript, onTimeUpdate, videoRef }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    setCurrentTime(current);
    setProgress(total ? (current / total) * 100 : 0);
    if (onTimeUpdate) onTimeUpdate(current);
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * duration;
    setCurrentTime(pos * duration);
  };

  if (!video) {
    return (
      <div className="dashboard-media-frame flex flex-col items-center justify-center text-text-muted">
        <MonitorPlay size={48} className="mb-4 opacity-50" />
        <p>Select a video to begin</p>
      </div>
    );
  }

  const videoUrl = `http://localhost:8000/${video.storage_path.replace(/\\/g, '/')}`;

  return (
    <div className="group relative w-full overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,rgba(12,16,13,0.92),rgba(5,8,6,0.96))]">
      <MissedPopup videoRef={videoRef} />
      
      <video
        ref={videoRef}
        src={videoUrl}
        className="aspect-video w-full bg-black object-cover"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      
      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        
        {/* Progress Bar */}
        <div 
          className="w-full h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer relative"
          onClick={handleProgressClick}
        >
          <div 
            className="h-full bg-primary rounded-full" 
            style={{ width: `${progress}%` }}
          />
          {/* Transcript Markers */}
          {transcript?.segments?.map((seg, idx) => {
            const left = (seg.start_time / duration) * 100;
            const width = ((seg.end_time - seg.start_time) / duration) * 100;
            return (
              <div 
                key={idx}
                className="absolute top-0 h-full bg-accent/40 rounded-full pointer-events-none"
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            )
          })}
        </div>

        <div className="flex justify-between items-center text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-primary transition-colors">
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <Volume2 size={20} className="text-text-muted" />
              <div className="w-16 h-1 bg-white/20 rounded-full">
                <div className="w-2/3 h-full bg-white rounded-full"></div>
              </div>
            </div>
            <span className="text-sm font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <button className="hover:text-primary transition-colors">
            <Maximize size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
