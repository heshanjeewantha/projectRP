import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadVideo, convertSignVideoToTranscript } from '../../component-01-attention-monitoring/services/videoApi';
import useStore from '../utils/useStore';
import { UploadCloud, CheckCircle, Loader2, AlertCircle, FileText, Sparkles, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUpload = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { setCurrentVideo, userRole } = useStore();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState('sign_to_transcript'); // 'sign_to_transcript' | 'standard'
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [convertedTranscript, setConvertedTranscript] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.split('.').slice(0, -1).join('.'));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return;

    setStatus('uploading');
    setConvertedTranscript(null);

    try {
      if (mode === 'sign_to_transcript') {
        const result = await convertSignVideoToTranscript(file, title);
        setConvertedTranscript(result);
        setStatus('success');
      } else {
        const newVideo = await uploadVideo(file, title);
        setCurrentVideo(newVideo);
        setStatus('success');
        setFile(null);
        setTitle('');
        setTimeout(() => {
          setStatus('idle');
          navigate(userRole === 'admin' ? '/admin' : '/');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const formCard = (
    <div className="dashboard-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-accent/15 rounded-full blur-3xl pointer-events-none" />

      {/* Mode Selector Switch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6 p-1.5 rounded-2xl bg-black/40 border border-white/5">
        <button
          type="button"
          onClick={() => setMode('sign_to_transcript')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            mode === 'sign_to_transcript'
              ? 'bg-primary text-[#032418] shadow-md font-extrabold'
              : 'text-text-muted hover:text-white'
          }`}
        >
          <Wand2 size={15} />
          Sign Video to Transcript
        </button>
        <button
          type="button"
          onClick={() => setMode('standard')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition ${
            mode === 'standard'
              ? 'bg-primary text-[#032418] shadow-md font-extrabold'
              : 'text-text-muted hover:text-white'
          }`}
        >
          <UploadCloud size={15} />
          Standard Lesson Upload
        </button>
      </div>

      <form onSubmit={handleUpload} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-primary mb-2 uppercase tracking-wider">
            Lesson / Video Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-12 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-text-muted/40 outline-none transition focus:border-primary/60 focus:bg-white/[0.08]"
            placeholder="e.g. Computer Hardware & Storage Devices"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
            {mode === 'sign_to_transcript' ? 'Sign Language Video File' : 'Lecture Video File'}
          </label>
          <div
            className={`relative rounded-2xl border-2 border-dashed p-6 sm:p-8 text-center transition cursor-pointer group ${
              file ? 'border-primary/50 bg-primary/5' : 'border-white/15 hover:border-primary/50 hover:bg-white/5'
            }`}
          >
            <input
              type="file"
              accept="video/mp4,video/avi,video/quicktime,video/webm"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required
            />

            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file-selected"
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="bg-primary/20 p-2.5 rounded-full text-primary border border-primary/30">
                    <CheckCircle size={24} />
                  </div>
                  <p className="text-white font-bold text-sm">{file.name}</p>
                  <p className="text-text-muted text-xs bg-white/5 px-3 py-0.5 rounded-full">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="no-file"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-2 text-text-muted group-hover:text-primary transition"
                >
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <UploadCloud size={28} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white">Click or drag video file here</p>
                    <p className="text-[11px] mt-0.5 text-text-muted">Supports MP4, WebM, AVI, and MOV</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <button
          type="submit"
          disabled={status === 'uploading' || !file || !title}
          className={`w-full h-12 text-sm font-extrabold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2.5 ${
            !file || !title
              ? 'bg-white/5 text-text-muted cursor-not-allowed border border-white/5'
              : status === 'uploading'
              ? 'bg-primary/70 text-[#032418]'
              : status === 'error'
              ? 'bg-rose-500 text-white'
              : 'bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] text-[#032418] hover:scale-[1.01] active:scale-[0.99] shadow-emerald-500/10'
          }`}
        >
          {status === 'uploading' ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>
                {mode === 'sign_to_transcript'
                  ? 'Converting Sign Video to Transcript...'
                  : 'Uploading & Processing Lesson...'}
              </span>
            </>
          ) : status === 'success' && mode !== 'sign_to_transcript' ? (
            <>
              <CheckCircle size={18} />
              <span>Ready for Learning!</span>
            </>
          ) : status === 'error' ? (
            <>
              <AlertCircle size={18} />
              <span>Retry Processing</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>
                {mode === 'sign_to_transcript'
                  ? 'Convert Sign Video to Transcript'
                  : 'Start AI Lecture Processing'}
              </span>
            </>
          )}
        </button>
      </form>

      {/* Live Converted Transcript Preview */}
      {convertedTranscript && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-2xl border border-primary/30 bg-primary/[0.04] p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-white/[0.06] pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="text-base font-bold text-white">Generated Sign Transcript</h3>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {convertedTranscript.segment_count} segments • Duration: {Math.round(convertedTranscript.total_duration)}s
              </p>
            </div>
            <span className="self-start sm:self-auto rounded-full bg-primary/20 border border-primary/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              Confidence: {Math.round(convertedTranscript.average_confidence * 100)}%
            </span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {(convertedTranscript.segments || []).map((seg, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/[0.06] bg-black/40 p-3 flex flex-col sm:flex-row sm:items-center gap-2.5"
              >
                <span className="shrink-0 rounded-md bg-primary/15 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary font-mono">
                  {Math.floor(seg.start_time)}s — {Math.floor(seg.end_time)}s
                </span>
                <div className="flex-1">
                  <span className="inline-block uppercase tracking-wider text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-primary/20 text-primary mr-1.5 border border-primary/30">
                    {seg.label}
                  </span>
                  <span className="text-xs text-white/90">{seg.text}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/lesson')}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-extrabold text-[#032418] transition hover:bg-emerald-400"
            >
              Open in Student Lesson Player →
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );

  if (embedded) {
    return formCard;
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-6">
        <div className="dashboard-panel rounded-3xl p-6 sm:p-7 shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="bg-primary/20 p-3 rounded-xl text-primary border border-primary/25 shadow-inner">
              <UploadCloud size={24} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Lesson &amp; Sign Video Studio
              </h2>
              <p className="text-text-muted mt-0.5 text-xs sm:text-sm">
                Convert sign language videos to time-aligned transcripts and interactive AI lessons.
              </p>
            </div>
          </div>
        </div>

        {formCard}
      </div>
    </div>
  );
};

export default AdminUpload;
