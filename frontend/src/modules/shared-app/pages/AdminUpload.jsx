import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadVideo } from '../../component-01-attention-monitoring/services/videoApi';
import useStore from '../utils/useStore';
import { UploadCloud, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUpload = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { setCurrentVideo, userRole } = useStore();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error

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
    try {
      const newVideo = await uploadVideo(file, title);
      setCurrentVideo(newVideo);
      setStatus('success');
      setFile(null);
      setTitle('');
      setTimeout(() => {
        setStatus('idle');
        navigate(userRole === 'admin' ? '/admin' : '/');
      }, 2000);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={embedded ? 'max-w-2xl mx-auto' : 'px-6 pb-12 max-w-2xl mx-auto'}
    >
      <div className="glass-panel p-10 relative overflow-hidden">
        {/* Background glow decor */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl" />

        <div className="flex items-center gap-4 mb-10 relative">
          <motion.div 
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            className="bg-primary/20 p-4 rounded-2xl text-primary shadow-inner"
          >
            <UploadCloud size={32} />
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Upload Lecture</h2>
            <p className="text-text-muted mt-1">Transform your video into an interactive AI lesson.</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="space-y-8 relative">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <label className="block text-sm font-bold text-text-muted mb-3 uppercase tracking-wider">Video Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-text-main focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-text-muted/30"
              placeholder="e.g. Advanced Hand Signs - Module 4"
              required
            />
          </motion.div>

          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <label className="block text-sm font-bold text-text-muted mb-3 uppercase tracking-wider">Video File</label>
            <div className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all cursor-pointer group ${
              file ? 'border-success/50 bg-success/5' : 'border-white/10 hover:border-primary/50 hover:bg-white/5'
            }`}>
              <input
                type="file"
                accept="video/mp4,video/avi,video/quicktime"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                required
              />
              
              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div 
                    key="file-selected"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="bg-success/20 p-3 rounded-full text-success">
                      <CheckCircle size={32} />
                    </div>
                    <p className="text-white font-bold text-lg">{file.name}</p>
                    <p className="text-text-muted text-sm bg-white/5 px-4 py-1 rounded-full">{(file.size / (1024*1024)).toFixed(2)} MB</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="no-file"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4 text-text-muted group-hover:text-primary transition-colors"
                  >
                    <motion.div whileHover={{ y: -5 }} className="bg-white/5 p-5 rounded-3xl">
                      <UploadCloud size={48} />
                    </motion.div>
                    <div>
                      <p className="font-bold text-lg">Click or drag video here</p>
                      <p className="text-xs mt-1 font-medium opacity-60">High quality MP4, AVI, or MOV</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.button 
            type="submit" 
            disabled={status === 'uploading' || !file || !title}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`btn w-full py-4 text-lg font-bold rounded-2xl shadow-xl transition-all duration-500 ${
              (!file || !title) ? 'bg-white/5 text-text-muted cursor-not-allowed border-white/5' : 
              status === 'uploading' ? 'btn-primary opacity-80' : 
              status === 'error' ? 'bg-danger text-white' :
              'btn-primary'
            }`}
          >
            <AnimatePresence mode="wait">
              {status === 'uploading' ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                  <Loader2 className="animate-spin" size={24} />
                  AI Analysis in Progress...
                </motion.div>
              ) : status === 'success' ? (
                <motion.div key="success" initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex items-center gap-3">
                  <CheckCircle size={24} />
                  Ready for Learning
                </motion.div>
              ) : status === 'error' ? (
                <motion.div key="error" className="flex items-center gap-3">
                  <AlertCircle size={24} />
                  Retry Upload
                </motion.div>
              ) : (
                <span key="idle">Start AI Processing</span>
              )}
            </AnimatePresence>
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
};

export default AdminUpload;
