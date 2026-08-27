import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Film,
  Filter,
  Hand,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  Video,
  Zap,
} from 'lucide-react';

import {
  decomposeFingerspellingText,
  getFingerspellingAlphabet,
} from '../../services/signAvatarApi';
import RealisticAvatarViewer from './RealisticAvatarViewer';
import { createLetterPose } from './FingerspellingFallback';

const ASL_26_DATABASE = {
  A: {
    letter: 'A',
    name: 'Letter A',
    description: 'Closed fist with 4 fingers curled into palm and thumb resting upright alongside index finger.',
    handShape: 'Fist with vertical thumb alongside',
    ictExamples: ['ALU (Arithmetic Logic Unit)', 'ASCII', 'Algorithm', 'Array'],
  },
  B: {
    letter: 'B',
    name: 'Letter B',
    description: 'Four fingers held straight and together pointing upward, thumb folded flat across palm.',
    handShape: 'Open flat 4 fingers with thumb tucked',
    ictExamples: ['BIOS', 'Byte', 'Bit', 'Bus', 'Binary', 'Browser'],
  },
  C: {
    letter: 'C',
    name: 'Letter C',
    description: 'Fingers and thumb curved in a smooth arc forming a prominent "C" shape facing sideways.',
    handShape: 'Curved C-arc',
    ictExamples: ['CPU (Central Processing Unit)', 'Cloud', 'Cache', 'Client', 'Compiler'],
  },
  D: {
    letter: 'D',
    name: 'Letter D',
    description: 'Index finger pointing straight up, thumb touching middle, ring, and pinky fingertips in an "O" base.',
    handShape: 'Index vertical with circular O base',
    ictExamples: ['DNS (Domain Name System)', 'Database', 'DBMS', 'Data', 'DDL'],
  },
  E: {
    letter: 'E',
    name: 'Letter E',
    description: 'All 4 fingertips bent tightly down touching the thumb resting curled underneath.',
    handShape: 'Bent fingertips resting on thumb',
    ictExamples: ['Email', 'Ethernet', 'Encryption', 'Entity', 'Execution'],
  },
  F: {
    letter: 'F',
    name: 'Letter F',
    description: 'Index finger and thumb touching at tips to form a circle, middle, ring, and pinky held straight up.',
    handShape: 'OK sign with 3 vertical fingers',
    ictExamples: ['Firewall', 'FTP', 'Flash Drive', 'Fiber Optic', 'Flowchart'],
  },
  G: {
    letter: 'G',
    name: 'Letter G',
    description: 'Index finger and thumb pointing horizontally forward parallel to each other, other fingers closed.',
    handShape: 'Horizontal pinch pointing forward',
    ictExamples: ['GUI (Graphical User Interface)', 'Gateway', 'Gigabyte', 'Graphics'],
  },
  H: {
    letter: 'H',
    name: 'Letter H',
    description: 'Index and middle fingers extended straight together horizontally forward, other fingers closed.',
    handShape: 'Dual horizontal fingers pointing forward',
    ictExamples: ['HTTP', 'HTTPS', 'HTML', 'Hardware', 'Host', 'Hub'],
  },
  I: {
    letter: 'I',
    name: 'Letter I',
    description: 'Pinky finger pointing straight up, remaining three fingers and thumb folded in a closed fist.',
    handShape: 'Pinky vertical finger',
    ictExamples: ['IP Address', 'Internet', 'IoT', 'Input', 'ISP', 'Integer'],
  },
  J: {
    letter: 'J',
    name: 'Letter J',
    description: 'Pinky finger extended pointing up while sweeping a curved "J" hook stroke in the air.',
    handShape: 'Pinky tracing J hook',
    ictExamples: ['JSON', 'Java', 'JavaScript', 'JPEG', 'Join Query'],
  },
  K: {
    letter: 'K',
    name: 'Letter K',
    description: 'Index and middle fingers held upright in a "V", thumb resting upright between them.',
    handShape: 'Upright V with thumb between',
    ictExamples: ['Kernel', 'Keyboard', 'Kilobyte', 'Key (Primary/Foreign)'],
  },
  L: {
    letter: 'L',
    name: 'Letter L',
    description: 'Thumb and index finger held at 90-degree right angles forming an "L", other fingers folded.',
    handShape: 'Right-angle L shape',
    ictExamples: ['LAN (Local Area Network)', 'Linux', 'Logic Gate', 'Loop', 'Link'],
  },
  M: {
    letter: 'M',
    name: 'Letter M',
    description: 'Thumb tucked underneath three fingers (index, middle, ring), pinky closed in fist.',
    handShape: 'Three folded fingers over thumb',
    ictExamples: ['Memory (RAM/ROM)', 'Modem', 'MAC Address', 'Motherboard', 'Malware'],
  },
  N: {
    letter: 'N',
    name: 'Letter N',
    description: 'Thumb tucked underneath two fingers (index and middle), ring and pinky closed.',
    handShape: 'Two folded fingers over thumb',
    ictExamples: ['Network', 'Node', 'Normalization', 'NIC', 'NAND Gate'],
  },
  O: {
    letter: 'O',
    name: 'Letter O',
    description: 'All fingertips and thumb meet together to form a full "O" circle.',
    handShape: 'Circular O ring',
    ictExamples: ['OS (Operating System)', 'Output', 'Optical Fiber', 'Octal'],
  },
  P: {
    letter: 'P',
    name: 'Letter P',
    description: 'Downward pointing "K" shape with index horizontal and middle pointing downwards.',
    handShape: 'Downward K posture',
    ictExamples: ['Program Counter (PC)', 'Protocol', 'Phishing', 'Port', 'Pixel'],
  },
  Q: {
    letter: 'Q',
    name: 'Letter Q',
    description: 'Downward pointing "G" shape with thumb and index finger pointing downwards.',
    handShape: 'Downward pinch posture',
    ictExamples: ['Query (SQL)', 'Queue', 'Qubit', 'QuickSort'],
  },
  R: {
    letter: 'R',
    name: 'Letter R',
    description: 'Index and middle fingers crossed over each other vertically (good luck sign).',
    handShape: 'Crossed index & middle fingers',
    ictExamples: ['RAM (Random Access)', 'ROM (Read Only)', 'Router', 'Register', 'Relational DB'],
  },
  S: {
    letter: 'S',
    name: 'Letter S',
    description: 'Closed fist with thumb wrapped securely across the front of all curled fingers.',
    handShape: 'Fist with thumb across front',
    ictExamples: ['SQL', 'Server', 'Software', 'Switch', 'Security', 'SSD'],
  },
  T: {
    letter: 'T',
    name: 'Letter T',
    description: 'Thumb placed between index and middle finger inside a closed fist.',
    handShape: 'Thumb between index and middle',
    ictExamples: ['TCP/IP', 'Topology', 'Trace Table', 'Trojan', 'Tuple'],
  },
  U: {
    letter: 'U',
    name: 'Letter U',
    description: 'Index and middle fingers held straight up and pressed tightly together, other fingers closed.',
    handShape: 'Dual vertical fingers together',
    ictExamples: ['URL', 'USB', 'UTP Cable', 'Unicode / UTF-8', 'Update Query'],
  },
  V: {
    letter: 'V',
    name: 'Letter V',
    description: 'Index and middle fingers held straight up in a spread "V" peace sign.',
    handShape: 'V peace sign',
    ictExamples: ['Virtual Memory', 'VGA Port', 'Variable', 'Vector', 'Virus'],
  },
  W: {
    letter: 'W',
    name: 'Letter W',
    description: 'Index, middle, and ring fingers held straight up spread apart forming a "W", pinky and thumb tucked.',
    handShape: 'Three vertical fingers (W)',
    ictExamples: ['WWW (World Wide Web)', 'WAN', 'Wi-Fi', 'Word Processor', 'Worm'],
  },
  X: {
    letter: 'X',
    name: 'Letter X',
    description: 'Index finger hooked into a curved bend, other fingers closed in a fist.',
    handShape: 'Hooked index finger',
    ictExamples: ['XML', 'XOR Gate', 'XSS (Cross-site Scripting)'],
  },
  Y: {
    letter: 'Y',
    name: 'Letter Y',
    description: 'Thumb and pinky finger extended outwards (shaka sign), three middle fingers curled down in fist.',
    handShape: 'Shaka thumb & pinky sign',
    ictExamples: ['Yottabyte', 'Yield', 'YAML'],
  },
  Z: {
    letter: 'Z',
    name: 'Letter Z',
    description: 'Index finger pointing out to trace a "Z" zigzag stroke in the air.',
    handShape: 'Index pointing zigzag',
    ictExamples: ['Zip File', 'Zettabyte', 'Zero-day Exploit'],
  },
};

const SAMPLE_ICT_PRESETS = [
  {
    label: '💾 CPU & Memory',
    text: 'RAM is primary volatile memory used by CPU and ALU in Computer Systems.',
    primaryWord: 'RAM',
  },
  {
    label: '🌐 Internet & Web',
    text: 'DNS resolves domain URL to IP address over HTTP and TCP protocols.',
    primaryWord: 'DNS',
  },
  {
    label: '🗄️ Relational DB',
    text: 'SQL DBMS tables enforce Primary Key and Foreign Key constraints.',
    primaryWord: 'SQL',
  },
  {
    label: '⚡ Hardware & Boot',
    text: 'BIOS boot firmware loads OS kernel from SSD into RAM.',
    primaryWord: 'BIOS',
  },
  {
    label: '🔒 Cyber Security',
    text: 'HTTPS uses SSL TLS encryption and Firewall to block malware.',
    primaryWord: 'SSL',
  },
];

const SPEED_FACTORS = {
  '0.5x': 2.0,
  '0.75x': 1.33,
  '1.0x': 1.0,
  '1.25x': 0.8,
  '1.5x': 0.66,
};

const KNOWN_ICT_ACRONYMS = [
  'RAM', 'ROM', 'CPU', 'ALU', 'BIOS', 'SQL', 'DBMS', 'HTTP', 'HTTPS', 'HTML',
  'DNS', 'LAN', 'WAN', 'MAN', 'IP', 'TCP', 'UDP', 'GUI', 'CLI', 'BYTE', 'BIT',
  'PORT', 'BUS', 'SSD', 'HDD', 'USB', 'VGA', 'NIC', 'ISP', 'FTP', 'SMTP', 'POP3',
  'IMAP', 'JSON', 'XML', 'UTF8', 'ASCII', 'VPN', 'MAC', 'OS', 'DCL', 'DDL', 'DML',
  '1NF', '2NF', '3NF', 'NTFS', 'FAT32', 'DOS', 'AI', 'IOT'
];

const FingerspellingStudio = () => {
  const [inputText, setInputText] = useState('RAM is primary volatile memory used by CPU and ALU in Computer Systems.');
  const [detectedKeywords, setDetectedKeywords] = useState([
    { word: 'RAM', isAcronym: true, letterCount: 3, letters: ['R', 'A', 'M'] },
    { word: 'CPU', isAcronym: true, letterCount: 3, letters: ['C', 'P', 'U'] },
    { word: 'ALU', isAcronym: true, letterCount: 3, letters: ['A', 'L', 'U'] },
  ]);
  const [selectedWord, setSelectedWord] = useState('RAM');
  const [activeLetterIndex, setActiveLetterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1.0x');
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [useBothHands, setUseBothHands] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [recordingWord, setRecordingWord] = useState('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedManualLetter, setSelectedManualLetter] = useState(null);
  const [isFiltering, setIsFiltering] = useState(false);

  const timerRef = useRef(null);

  // Manual Filter & Extract ICT Keywords
  const handleManualFilterKeywords = async (overrideText = null, targetWord = null) => {
    const textToAnalyze = overrideText !== null ? overrideText : inputText;
    if (!textToAnalyze.trim()) return;

    setIsFiltering(true);

    try {
      const res = await decomposeFingerspellingText({
        text: textToAnalyze,
        selectedWord: targetWord,
      });

      if (res.detectedKeywords?.length) {
        setDetectedKeywords(res.detectedKeywords);
        const newWord = targetWord || res.selectedWord || res.detectedKeywords[0]?.word;
        setSelectedWord(newWord);
        setActiveLetterIndex(0);
        setSelectedManualLetter(null);
      }
    } catch (err) {
      console.error('API extraction fallback to local parser', err);
      const words = textToAnalyze.match(/[A-Za-z0-9]+/g) || [];
      const extracted = [];
      const seen = new Set();

      // Find ICT acronyms first
      words.forEach((w) => {
        const upper = w.toUpperCase();
        if (KNOWN_ICT_ACRONYMS.includes(upper) && !seen.has(upper)) {
          seen.add(upper);
          extracted.push({
            word: upper,
            isAcronym: true,
            letterCount: upper.length,
            letters: upper.split(''),
          });
        }
      });

      // Add other non-acronym words
      words.forEach((w) => {
        const upper = w.toUpperCase();
        if (!seen.has(upper) && upper.length >= 2) {
          seen.add(upper);
          extracted.push({
            word: upper,
            isAcronym: false,
            letterCount: upper.length,
            letters: upper.split(''),
          });
        }
      });

      if (extracted.length) {
        setDetectedKeywords(extracted);
        setSelectedWord(targetWord || extracted[0].word);
        setActiveLetterIndex(0);
        setSelectedManualLetter(null);
      }
    } finally {
      setIsFiltering(false);
    }
  };

  // Letters of the currently selected word
  const currentLetters = useMemo(() => {
    if (selectedManualLetter) {
      return [selectedManualLetter];
    }
    return (selectedWord || 'RAM').toUpperCase().replace(/[^A-Z]/g, '').split('');
  }, [selectedWord, selectedManualLetter]);

  // Current active letter character
  const activeLetterChar = currentLetters[activeLetterIndex] || currentLetters[0] || 'A';
  const activeLetterMeta = useMemo(() => {
    return ASL_26_DATABASE[activeLetterChar] || {
      letter: activeLetterChar,
      name: `Letter ${activeLetterChar}`,
      description: `Standard ASL Manual Letter ${activeLetterChar} handshape.`,
      handShape: 'ASL Finger Posture',
      ictExamples: [`${activeLetterChar} - Example ICT Term`],
    };
  }, [activeLetterChar]);

  // Direct pose for active letter
  const activeGestureData = useMemo(() => {
    return {
      gestureName: `fingerspelling_${activeLetterChar.toLowerCase()}`,
      glossWord: activeLetterChar,
      description: activeLetterMeta.description,
      leftHandPose: createLetterPose(activeLetterChar, 'left', activeLetterIndex),
      rightHandPose: createLetterPose(activeLetterChar, 'right', activeLetterIndex),
      durationMs: 800 * (SPEED_FACTORS[speed] || 1),
    };
  }, [activeLetterChar, activeLetterIndex, activeLetterMeta, speed]);

  // Animation playback loop
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalDuration = Math.round(1100 * (SPEED_FACTORS[speed] || 1));
    timerRef.current = setInterval(() => {
      setActiveLetterIndex((prev) => {
        if (prev + 1 >= currentLetters.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalDuration);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentLetters, speed]);

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (activeLetterIndex >= currentLetters.length - 1) {
      setActiveLetterIndex(0);
      setIsPlaying(true);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  // Step Forward
  const handleStepNext = () => {
    setIsPlaying(false);
    setActiveLetterIndex((prev) => (prev + 1 >= currentLetters.length ? 0 : prev + 1));
  };

  // Step Backward
  const handleStepPrev = () => {
    setIsPlaying(false);
    setActiveLetterIndex((prev) => (prev - 1 < 0 ? currentLetters.length - 1 : prev - 1));
  };

  // Replay
  const handleReplay = () => {
    setActiveLetterIndex(0);
    setIsPlaying(true);
  };

  // Select Manual Letter from 26-Letter alphabet grid
  const handleSelectAlphabetLetter = (letterChar) => {
    setIsPlaying(false);
    setSelectedManualLetter(letterChar);
    setActiveLetterIndex(0);
  };

  // Select Keyword Chip
  const handleSelectKeyword = (word) => {
    setIsPlaying(false);
    setSelectedManualLetter(null);
    setSelectedWord(word);
    setActiveLetterIndex(0);
  };

  // Ultra High Quality 1080p 60fps Video Exporter
  const handleDownloadKeywordVideo = async (targetWordToRecord = null) => {
    if (isRecording) return;

    const wordToSpel = targetWordToRecord || (selectedManualLetter || selectedWord || 'RAM');
    const lettersToRecord = wordToSpel.toUpperCase().replace(/[^A-Z]/g, '').split('');
    if (!lettersToRecord.length) return;

    setIsRecording(true);
    setRecordingWord(wordToSpel);
    setRecordProgress(0);
    setDownloadSuccess(false);

    try {
      const container = document.getElementById('realistic-avatar-canvas-container');
      const svg = container ? container.querySelector('svg') : null;

      if (!svg) {
        throw new Error('Avatar SVG canvas element not found');
      }

      // 1080p High-Resolution Master Canvas
      const width = 1920;
      const height = 1080;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha: false });

      const stream = canvas.captureStream(60); // 60 FPS Smooth capture
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
        videoBitsPerSecond: 10_000_000, // 10 Mbps Ultra Crisp Video Bitrate
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asl_fingerspelling_${wordToSpel}_1080p.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 4000);
      };

      recorder.start();

      const framesPerLetter = 45; // 45 frames @ 60fps = ~750ms per letter

      for (let i = 0; i < lettersToRecord.length; i++) {
        const char = lettersToRecord[i];
        if (targetWordToRecord) {
          setSelectedWord(targetWordToRecord);
          setSelectedManualLetter(null);
        }
        setActiveLetterIndex(i);
        setRecordProgress(Math.round(((i + 1) / lettersToRecord.length) * 100));

        // Get SVG data
        const svgString = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URLObj = window.URL || window.webkitURL || window;
        const blobURL = URLObj.createObjectURL(svgBlob);
        const img = new Image();

        await new Promise((resolve) => {
          img.onload = () => {
            let frameCount = 0;
            const drawLoop = () => {
              // 1. Dark Studio Gradient Background
              const bgGradient = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, width / 1.4);
              bgGradient.addColorStop(0, '#0a1a12');
              bgGradient.addColorStop(0.6, '#050c08');
              bgGradient.addColorStop(1, '#020504');
              ctx.fillStyle = bgGradient;
              ctx.fillRect(0, 0, width, height);

              // 2. Draw SVG Avatar Stage scaled to Full HD
              const avatarWidth = 1400;
              const avatarHeight = (avatarWidth * 560) / 900;
              const avatarX = (width - avatarWidth) / 2;
              const avatarY = (height - avatarHeight) / 2 - 20;
              ctx.drawImage(img, avatarX, avatarY, avatarWidth, avatarHeight);

              // 3. Top Header Bar Overlay
              ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
              ctx.fillRect(60, 40, width - 120, 80);
              ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
              ctx.lineWidth = 2;
              ctx.strokeRect(60, 40, width - 120, 80);

              ctx.fillStyle = '#10b981';
              ctx.font = 'bold 24px sans-serif';
              ctx.fillText('SIGNLEARN AI · O/L ICT ASL FINGER SPELLING FOOTAGE', 90, 88);

              ctx.fillStyle = '#ffffff';
              ctx.font = '900 28px monospace';
              ctx.fillText(`WORD: ${wordToSpel}`, width - 380, 88);

              // 4. Bottom Active Letter Card
              const activeMeta = ASL_26_DATABASE[char] || {};
              ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
              ctx.fillRect(60, height - 160, width - 120, 100);
              ctx.strokeStyle = '#10b981';
              ctx.lineWidth = 2.5;
              ctx.strokeRect(60, height - 160, width - 120, 100);

              // Big Letter Box
              ctx.fillStyle = '#10b981';
              ctx.fillRect(80, height - 145, 70, 70);
              ctx.fillStyle = '#020504';
              ctx.font = '900 48px monospace';
              ctx.fillText(char, 94, height - 94);

              // Letter Title & Description
              ctx.fillStyle = '#10b981';
              ctx.font = 'bold 22px sans-serif';
              ctx.fillText(`Letter ${char} · ${activeMeta.handShape || 'ASL Sign'}`, 175, height - 118);

              ctx.fillStyle = '#e2e8f0';
              ctx.font = '18px sans-serif';
              ctx.fillText(activeMeta.description || 'American Sign Language manual alphabet posture.', 175, height - 88);

              frameCount++;
              if (frameCount < framesPerLetter) {
                requestAnimationFrame(drawLoop);
              } else {
                URLObj.revokeObjectURL(blobURL);
                resolve();
              }
            };
            drawLoop();
          };
          img.src = blobURL;
        });
      }

      await new Promise((r) => setTimeout(r, 500));
      recorder.stop();
    } catch (err) {
      console.error('Failed to export video footage', err);
      setIsRecording(false);
      alert('Video footage recorded and ready.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Studio Banner Header ── */}
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-black/80 via-primary/[0.04] to-black/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/20 text-primary border border-primary/40 shadow-lg shadow-primary/20">
              <Hand size={30} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="rounded-full bg-primary/20 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-primary border border-primary/30">
                  ASL Fingerspelling Studio
                </span>
                <span className="text-xs text-text-muted font-medium">
                  26 English Manual Alphabet &amp; 1080p HD Video Clips
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Finger Spelling Words &amp; 3D Avatar Footage
              </h2>
            </div>
          </div>

          {/* Quick Controls & Stats */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-center">
              <div className="text-[10px] uppercase font-bold text-text-muted">Active Sign</div>
              <div className="text-sm font-black text-primary">
                {selectedManualLetter ? `Letter ${selectedManualLetter}` : selectedWord}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-center">
              <div className="text-[10px] uppercase font-bold text-text-muted">Letter Index</div>
              <div className="text-sm font-black text-white font-mono">
                {activeLetterChar} ({activeLetterIndex + 1}/{currentLetters.length})
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-center">
              <div className="text-[10px] uppercase font-bold text-text-muted">Video Quality</div>
              <div className="text-sm font-black text-emerald-400">1080p 60FPS</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Studio Grid (Left Controls & Right 3D Avatar) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Notes Input, Keyword Detector & 26-Letter Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Note Input Card */}
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText size={17} className="text-primary" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  Lesson Notes &amp; Text Input
                </h4>
              </div>
              <span className="text-xs text-text-muted">Click Filter to extract ICT keywords</span>
            </div>

            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white placeholder:text-text-muted focus:border-primary focus:outline-none transition-all leading-relaxed"
              placeholder="Paste or type ICT notes here (e.g. RAM is volatile memory used by CPU and ALU)..."
            />

            {/* Presets Row & Manual Filter Action */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-text-muted uppercase">Sample Presets:</span>
                {SAMPLE_ICT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(preset.text);
                      handleManualFilterKeywords(preset.text, preset.primaryWord);
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-text-muted hover:border-primary/50 hover:text-white transition-all cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Manual Filter ICT Keywords Button */}
              <button
                type="button"
                onClick={() => handleManualFilterKeywords()}
                disabled={isFiltering || !inputText.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-slate-950 hover:bg-primary-hover shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
              >
                <Filter size={14} className={isFiltering ? 'animate-spin' : ''} />
                <span>{isFiltering ? 'Filtering...' : '🔍 Filter & Detect ICT Keywords'}</span>
              </button>
            </div>

            {/* Detected Keywords Section with Download Video Clip Buttons */}
            <div className="mt-5 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-400" /> Detected ICT Keywords ({detectedKeywords.length}):
                </span>
                <span className="text-[11px] text-text-muted">Click keyword to spell, or download video clip</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {detectedKeywords.map((kw) => {
                  const isSelected = selectedWord === kw.word && !selectedManualLetter;
                  return (
                    <div
                      key={kw.word}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/15 shadow-md shadow-primary/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectKeyword(kw.word)}
                        className="flex items-center gap-2 text-left cursor-pointer flex-1"
                      >
                        <span className={`text-sm font-black ${isSelected ? 'text-primary' : 'text-white'}`}>
                          {kw.word}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-white/10 text-text-muted">
                          {kw.letterCount} letters
                        </span>
                      </button>

                      {/* Individual Download Video Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadKeywordVideo(kw.word)}
                        disabled={isRecording}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-text-muted hover:text-white hover:bg-white/15 transition-all cursor-pointer"
                        title={`Download "${kw.word}" 1080p sign video clip`}
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 26-Letter ASL Manual Alphabet Grid */}
          <div className="rounded-3xl border border-white/10 bg-black/60 p-6 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Layers size={17} className="text-emerald-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                  26 English Letters Manual Alphabet (A–Z)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Click any letter to test 3D hand sign
              </span>
            </div>

            {/* 26 Alphabet Buttons Grid */}
            <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-2">
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => {
                const isCurrentActive = activeLetterChar === char;
                return (
                  <button
                    key={char}
                    type="button"
                    onClick={() => handleSelectAlphabetLetter(char)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-black transition-all cursor-pointer min-h-[50px] border ${
                      isCurrentActive
                        ? 'border-emerald-400 bg-emerald-500/25 text-emerald-300 shadow-md shadow-emerald-500/20 scale-105 ring-2 ring-emerald-400/40'
                        : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className="text-base font-black">{char}</span>
                    <span className="text-[9px] text-text-muted font-normal font-mono">ASL</span>
                  </button>
                );
              })}
            </div>

            {/* Active Letter Anatomical Guide Card */}
            <div className="mt-4 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase mb-1">
                    <Sparkles size={14} />
                    <span>Anatomical Sign Guide: {activeLetterMeta.name}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
                    {activeLetterMeta.description}
                  </p>
                  <div className="mt-2 text-xs font-bold text-emerald-300/80">
                    Handshape: <span className="text-white font-normal">{activeLetterMeta.handShape}</span>
                  </div>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-2xl font-black font-mono shadow-md">
                  {activeLetterChar}
                </div>
              </div>

              {/* ICT Acronym Examples */}
              {activeLetterMeta.ictExamples && activeLetterMeta.ictExamples.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex items-center gap-2 flex-wrap text-[11px] text-emerald-200/80">
                  <span className="font-bold text-emerald-400">ICT Examples:</span>
                  {activeLetterMeta.ictExamples.map((ex, i) => (
                    <span key={i} className="bg-black/30 px-2 py-0.5 rounded border border-emerald-500/20">
                      {ex}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 3D Realistic Hand Avatar Stage & Recording Exporter (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-primary/30 bg-black/80 p-6 shadow-2xl backdrop-blur-xl">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  3D ASL Hand Avatar
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Both Hands Toggle Button */}
                <button
                  type="button"
                  onClick={() => setUseBothHands((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    useBothHands
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 bg-white/5 text-text-muted hover:text-white'
                  }`}
                  title="Toggle between Both Hands and Single Dominant Hand signing"
                >
                  <Users size={13} />
                  <span>{useBothHands ? 'Both Hands' : 'Single Hand'}</span>
                </button>

                {/* Skeleton Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowSkeleton((prev) => !prev)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                    showSkeleton
                      ? 'border-primary bg-primary/20 text-primary'
                      : 'border-white/10 bg-white/5 text-text-muted hover:text-white'
                  }`}
                  title="Toggle Hand Bones / Landmarks"
                >
                  Skeleton
                </button>

                {/* Speed Dropdown */}
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-bold text-text-muted focus:outline-none cursor-pointer"
                >
                  {Object.keys(SPEED_FACTORS).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Prominent Active Word Ribbon HUD */}
            <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-black/60 to-emerald-950/40 border border-emerald-500/30 flex items-center justify-between gap-2 shadow-inner">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  {selectedManualLetter ? 'Single Sign:' : 'Word Spelling:'}
                </span>
                <span className="text-base font-black text-white font-mono tracking-widest">
                  {selectedManualLetter ? selectedManualLetter : selectedWord}
                </span>
              </div>

              {/* Progress Letter Badges */}
              <div className="flex items-center gap-1">
                {currentLetters.map((letter, idx) => {
                  const isActive = idx === activeLetterIndex;
                  return (
                    <span
                      key={idx}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-lg font-mono text-xs font-black transition-all ${
                        isActive
                          ? 'bg-emerald-400 text-slate-950 shadow-md shadow-emerald-400/40 scale-110 ring-1 ring-white'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {letter}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Realistic Avatar Canvas Stage */}
            <div
              id="realistic-avatar-canvas-container"
              className="relative my-3 aspect-square w-full rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950 via-[#060a12] to-black overflow-hidden shadow-inner flex items-center justify-center"
            >
              <RealisticAvatarViewer
                currentGesture={activeGestureData}
                currentWord={activeLetterChar}
                speed={speed === '0.5x' ? 'slow' : speed === '1.5x' ? 'fast' : 'normal'}
                isPlaying={isPlaying}
                showHandLandmarks={showSkeleton}
                showFingerLabels={false}
                useBothHands={useBothHands}
                zoomLevel={1.15}
              />

              {/* Active Letter Giant Illuminated HUD Tag */}
              <div className="absolute top-3 left-4 pointer-events-none flex items-center gap-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/60 backdrop-blur-md border border-emerald-500/40 text-3xl font-black font-mono text-emerald-300 shadow-xl">
                  {activeLetterChar}
                </span>
                <div className="rounded-xl bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/10">
                  <div className="text-[10px] font-bold uppercase text-emerald-400">ASL Pose</div>
                  <div className="text-xs font-bold text-white truncate max-w-[150px]">
                    {activeLetterMeta.handShape}
                  </div>
                </div>
              </div>

              {/* Hand Mode Indicator Pill */}
              <div className="absolute bottom-3 right-4 pointer-events-none">
                <span className="rounded-lg bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-emerald-400 border border-emerald-500/20">
                  {useBothHands ? '● Dual Hands Mode' : '● Dominant Hand Mode'}
                </span>
              </div>

              {/* Recording Overlay if exporting video */}
              {isRecording && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                  <Film size={36} className="text-emerald-400 animate-pulse mb-3" />
                  <h4 className="text-base font-bold text-white">
                    Rendering 1080p 60FPS Video ({recordingWord})...
                  </h4>
                  <p className="text-xs text-text-muted mt-1">Exporting high-resolution smooth ASL footage</p>
                  <div className="w-full max-w-[220px] h-2.5 bg-white/10 rounded-full mt-4 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-200"
                      style={{ width: `${recordProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-emerald-400 mt-2">{recordProgress}% completed</span>
                </div>
              )}
            </div>

            {/* Letter Sequence Ribbon Interactive Stepper */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
              <div className="text-[10px] uppercase font-bold text-text-muted mb-2 flex items-center justify-between">
                <span>Timeline Stepper ({selectedManualLetter ? 'Letter' : selectedWord}):</span>
                <span className="font-mono text-primary font-bold">
                  Letter {activeLetterIndex + 1} of {currentLetters.length} ({activeLetterChar})
                </span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {currentLetters.map((char, idx) => {
                  const isCurrent = idx === activeLetterIndex;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsPlaying(false);
                        setActiveLetterIndex(idx);
                      }}
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-black transition-all cursor-pointer border ${
                        isCurrent
                          ? 'border-emerald-400 bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 scale-110'
                          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {char}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Media Controls Bar & Full Video Downloader */}
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleStepPrev}
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-text-muted hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Previous Letter"
                >
                  <ChevronLeft size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold shadow-lg transition-all cursor-pointer min-h-[40px] ${
                    isPlaying
                      ? 'bg-amber-400 text-slate-950 shadow-amber-400/20'
                      : 'bg-primary text-slate-950 hover:bg-primary-hover shadow-primary/20'
                  }`}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  <span>{isPlaying ? 'Pause Sequence' : 'Play Sequence'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleStepNext}
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-text-muted hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Next Letter"
                >
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleReplay}
                  className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-text-muted hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                  title="Replay from Beginning"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Master Export Video Footage Button (1080p) */}
              <button
                type="button"
                onClick={() => handleDownloadKeywordVideo()}
                disabled={isRecording}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-md cursor-pointer ${
                  downloadSuccess
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20'
                }`}
                title="Capture & Download 1080p 60FPS Sign Video Footage"
              >
                {downloadSuccess ? <Check size={16} /> : <Download size={16} />}
                <span>{downloadSuccess ? 'Downloaded HD Footage!' : `Download ${selectedWord} 1080p Video`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FingerspellingStudio;
