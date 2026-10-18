import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Eye,
  Play,
  Radar,
  Sparkles,
  Video,
  Activity,
  BarChart2,
  GraduationCap,
  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';

import { getVideos, getTranscript, getSyllabusTaxonomy } from '../services/videoApi';
import { computeMissedSegments } from '../services/missedApi';
import {
  getKnowledgeGraph,
  getLessonTimeline,
  getPopupQuestion,
  getStudentPopupAnswers,
  submitPopupAnswer,
} from '../../component-02-knowledge-graph-question-system/services/popupApi';
import useStore from '../../shared-app/utils/useStore';

import VideoPlayer from '../components/VideoPlayer/VideoPlayer';
import WebcamFeed from '../components/WebcamFeed/WebcamFeed';
import AttentionStatsPanel from '../components/AttentionStatsPanel/AttentionStatsPanel';
import AttentionHeatmap from '../components/AttentionHeatmap/AttentionHeatmap';
import DistractionAlertModal from '../components/DistractionAlertModal';
import GestureActionHUD from '../components/GestureActionHUD';
import SupportedGesturesCard from '../components/SupportedGesturesCard';
import KnowledgeQuestionPopup from '../../component-02-knowledge-graph-question-system/components/Popup/KnowledgeQuestionPopup';
import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';
import LessonCard from '../../../components/layout/Dashboard/LessonCard';
import VideoPanel from '../../../components/layout/Dashboard/VideoPanel';
import WebcamPanel from '../../../components/layout/Dashboard/WebcamPanel';
import TranscriptPanel from '../../../components/layout/Dashboard/TranscriptPanel';
import ConceptCard from '../../../components/layout/Dashboard/ConceptCard';
import PopupHistoryCard from '../../../components/layout/Dashboard/PopupHistoryCard';
import TimelinePanel from '../../../components/layout/Dashboard/TimelinePanel';

const formatClock = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const findTimelineSegment = (timeline = [], currentTime = 0) => {
  if (!timeline?.length) return null;
  const exact = timeline.find((segment) => currentTime >= segment.startTime && currentTime <= segment.endTime);
  if (exact) return exact;
  const preceding = timeline.filter((segment) => segment.startTime <= currentTime);
  if (preceding.length > 0) return preceding[preceding.length - 1];
  return timeline[0];
};

const resolveConceptForTime = (timeline, concepts, currentTime) => {
  const segment = findTimelineSegment(timeline?.timeline || [], currentTime);
  if (!segment) return null;

  return (
    concepts.find((concept) => concept.conceptId === segment.conceptId) || {
      conceptId: segment.conceptId,
      conceptName: segment.conceptName,
      description: '',
      prerequisites: [],
      relatedConcepts: [],
      difficultyLevel: 'medium',
      keywords: [],
    }
  );
};

const StudentView = () => {
  const [videos, setVideos] = useState([]);
  const [transcript, setTranscript] = useState(null);
  const [missedSegments, setMissedSegments] = useState([]);
  const [popupAnswerHistory, setPopupAnswerHistory] = useState([]);
  const [knowledgeGraph, setKnowledgeGraph] = useState([]);
  const [lessonTimeline, setLessonTimeline] = useState(null);
  const [activeKnowledgePopup, setActiveKnowledgePopup] = useState(null);
  const [isPopupSubmitting, setIsPopupSubmitting] = useState(false);
  const [currentLearningConcept, setCurrentLearningConcept] = useState(null);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(0);
  const [isLessonPlaying, setIsLessonPlaying] = useState(false);
  const [distractionAlert, setDistractionAlert] = useState(null);
  const [activeGesture, setActiveGesture] = useState(null);

  // ── Curriculum & Syllabus Filters ──────────────────────────────────────────
  const [curriculumGrade, setCurriculumGrade] = useState('ALL'); // 'ALL' | 'Grade 10' | 'Grade 11'
  const [curriculumUnit, setCurriculumUnit] = useState('ALL'); // 'ALL' | 1 | 2 | 3 ...
  const [syllabusTaxonomy, setSyllabusTaxonomy] = useState(null);

  const videoRef = useRef(null);
  const requestedPopupCheckpointsRef = useRef(new Set());
  const pendingPopupCheckpointsRef = useRef(new Set());
  const distractionTimerRef = useRef({ startTime: null, seconds: 0 });
  const lastGestureTimeRef = useRef(0);

  const {
    currentVideo,
    setCurrentVideo,
    userId,
    sessionId,
    setActivePopup,
    activePopup,
    attentionStatus,
    attentionDetail,
    gestureAction,
    emotion,
    emotionConfidence,
    activeSyllabus,
    recommendedIntervention,
  } = useStore();
  const popupStudentId = userId || 'student_demo_123';

  const handleSelectVideo = async (video) => {
    setCurrentVideo(video);
    try {
      const ts = await getTranscript(video.id);
      setTranscript(ts);
    } catch (e) {
      console.log('No transcript yet', e);
      setTranscript(null);
    }
    setActiveKnowledgePopup(null);
    setActivePopup(null);
    setCurrentLearningConcept(null);
    setCurrentPlaybackTime(0);
    setLessonTimeline(null);
    setIsLessonPlaying(false);
    requestedPopupCheckpointsRef.current = new Set();
    pendingPopupCheckpointsRef.current = new Set();
  };

  // Load syllabus taxonomy on mount
  useEffect(() => {
    getSyllabusTaxonomy()
      .then((tax) => setSyllabusTaxonomy(tax))
      .catch((err) => console.error('Failed to load syllabus taxonomy', err));
  }, []);

  // Fetch videos filtered by Grade and Unit
  useEffect(() => {
    let isMounted = true;

    const loadFilteredVideos = async () => {
      try {
        const unitParam = curriculumUnit === 'ALL' ? null : Number(curriculumUnit);
        const data = await getVideos(curriculumGrade, unitParam);
        if (!isMounted) return;
        setVideos(data);
        if (data.length > 0) {
          // If current video doesn't match new filter, switch to first result
          if (!currentVideo || !data.some((v) => v.id === currentVideo.id)) {
            setCurrentVideo(data[0]);
            try {
              const ts = await getTranscript(data[0].id);
              if (isMounted) setTranscript(ts);
            } catch (err) {
              if (isMounted) setTranscript(null);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load videos', error);
      }
    };

    const loadKnowledgeGraph = async () => {
      try {
        const data = await getKnowledgeGraph();
        if (isMounted) {
          setKnowledgeGraph(data.concepts || []);
        }
      } catch (error) {
        console.error('Failed to load knowledge graph', error);
      }
    };

    loadFilteredVideos();
    loadKnowledgeGraph();

    return () => {
      isMounted = false;
    };
  }, [curriculumGrade, curriculumUnit, setCurrentVideo]);

  useEffect(() => {
    let isMounted = true;
    const unitParam = curriculumUnit === 'ALL' ? null : Number(curriculumUnit);

    const refreshVideos = async () => {
      try {
        const data = await getVideos(curriculumGrade, unitParam);
        if (isMounted) setVideos(data);
      } catch (error) {
        console.error('Failed to refresh videos', error);
      }
    };

    const handleWindowFocus = () => {
      refreshVideos();
    };

    const intervalId = window.setInterval(refreshVideos, 15000);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [curriculumGrade, curriculumUnit]);


  useEffect(() => {
    let interval;
    if (currentVideo && !transcript) {
      interval = setInterval(async () => {
        try {
          const ts = await getTranscript(currentVideo.id);
          setTranscript(ts);
          getVideos().then((data) => setVideos(data));
        } catch (error) {
          console.debug('Transcript is still processing', error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [currentVideo, transcript]);

  useEffect(() => {
    let isMounted = true;

    const fetchPopupAnswerHistory = async () => {
      try {
        const history = await getStudentPopupAnswers(popupStudentId);
        if (isMounted) {
          setPopupAnswerHistory(history);
        }
      } catch (error) {
        console.error('Failed to load popup answer history', error);
      }
    };

    fetchPopupAnswerHistory();

    return () => {
      isMounted = false;
    };
  }, [popupStudentId]);

  useEffect(() => {
    let isMounted = true;

    const loadLessonTimelineAndGraph = async () => {
      if (!currentVideo?.id) {
        if (isMounted) {
          setLessonTimeline(null);
        }
        return;
      }

      try {
        const [timeline, graphData] = await Promise.allSettled([
          getLessonTimeline(currentVideo.id),
          getKnowledgeGraph(currentVideo.id),
        ]);

        if (isMounted) {
          if (timeline.status === 'fulfilled') {
            setLessonTimeline(timeline.value);
          } else {
            setLessonTimeline(null);
          }
          if (graphData.status === 'fulfilled' && graphData.value?.concepts?.length) {
            setKnowledgeGraph(graphData.value.concepts);
          }
        }
      } catch (error) {
        console.error('Failed to load lesson timeline or video knowledge graph', error);
        if (isMounted) {
          setLessonTimeline(null);
        }
      }
    };

    loadLessonTimelineAndGraph();

    return () => {
      isMounted = false;
    };
  }, [currentVideo?.id]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsLessonPlaying(true);
    const handlePause = () => setIsLessonPlaying(false);
    const handleEnded = () => setIsLessonPlaying(false);

    setIsLessonPlaying(!videoElement.paused && !videoElement.ended);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, [currentVideo?.id]);

  useEffect(() => {
    const concept = resolveConceptForTime(lessonTimeline, knowledgeGraph, currentPlaybackTime);
    if (!concept) return;
    if (concept.conceptId === currentLearningConcept?.conceptId) return;
    setCurrentLearningConcept(concept);
  }, [currentLearningConcept?.conceptId, currentPlaybackTime, knowledgeGraph, lessonTimeline]);

  useEffect(() => {
    if (!currentVideo || !isLessonPlaying || activeKnowledgePopup || activePopup) return;

    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    let isCancelled = false;
    let popupInterval = null;

    const runPopupCheck = async () => {
      if (isCancelled || videoElement.paused || videoElement.ended) return;

      const elapsedSeconds = Math.floor(videoElement.currentTime);
      if (elapsedSeconds < 30) return;

      const checkpointSecond = Math.floor(elapsedSeconds / 30) * 30;
      const checkpointKey = `${currentVideo.id}:${checkpointSecond}`;
      if (
        requestedPopupCheckpointsRef.current.has(checkpointKey) ||
        pendingPopupCheckpointsRef.current.has(checkpointKey)
      ) {
        return;
      }

      pendingPopupCheckpointsRef.current.add(checkpointKey);
      try {
        const popup = await getPopupQuestion(popupStudentId, currentVideo.id, checkpointSecond);
        if (isCancelled) return;

        if (popup?.currentConcept) {
          setCurrentLearningConcept(popup.currentConcept);
        }
        if (popup?.question) {
          requestedPopupCheckpointsRef.current.add(checkpointKey);
          videoElement.pause();
          setIsLessonPlaying(false);
          setActiveKnowledgePopup(popup);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to fetch popup question', error);
        }
      } finally {
        pendingPopupCheckpointsRef.current.delete(checkpointKey);
      }
    };

    runPopupCheck();
    popupInterval = window.setInterval(runPopupCheck, 1000);

    return () => {
      isCancelled = true;
      if (popupInterval) {
        window.clearInterval(popupInterval);
      }
    };
  }, [activeKnowledgePopup, activePopup, currentVideo, isLessonPlaying, popupStudentId]);

  const handleSubmitPopupAnswer = async (question, selectedAnswer) => {
    setIsPopupSubmitting(true);

    try {
        const savedAnswer = await submitPopupAnswer({
        studentId: popupStudentId,
        lessonId: currentVideo?.id || 'lesson_ol_ict_001',
        conceptId: question.conceptId,
        questionId: question.questionId,
        selectedAnswer,
      });

      setPopupAnswerHistory((previousHistory) => [
        savedAnswer,
        ...previousHistory.filter((item) => item.questionId !== savedAnswer.questionId),
      ]);

      return savedAnswer;
    } finally {
      setIsPopupSubmitting(false);
    }
  };

  const handleContinueLesson = () => {
    setActiveKnowledgePopup(null);
    const playPromise = videoRef.current?.play?.();
    if (playPromise?.catch) {
      playPromise.catch(() => {});
    }
  };

  // ── Smart Lesson: Webcam Hand Gesture Video Navigation ─────────────────────
  useEffect(() => {
    if (!gestureAction || !videoRef.current) return;
    const now = Date.now();
    if (now - lastGestureTimeRef.current < 1400) return; // 1.4s cooldown

    const videoEl = videoRef.current;
    const duration = Number.isFinite(videoEl.duration) && videoEl.duration > 0
      ? videoEl.duration
      : (currentVideo?.duration_seconds || 9999);

    if (gestureAction === 'SKIP_FORWARD_10S') {
      lastGestureTimeRef.current = now;
      const targetTime = Math.min(Math.max(0, duration - 1), (videoEl.currentTime || 0) + 10);
      videoEl.currentTime = targetTime;
      setCurrentPlaybackTime(targetTime);
      setActiveGesture({ action: 'SKIP_FORWARD_10S', label: '+10s Skipped' });
    } else if (gestureAction === 'SKIP_BACKWARD_10S') {
      lastGestureTimeRef.current = now;
      const targetTime = Math.max(0, (videoEl.currentTime || 0) - 10);
      videoEl.currentTime = targetTime;
      setCurrentPlaybackTime(targetTime);
      setActiveGesture({ action: 'SKIP_BACKWARD_10S', label: '-10s Rewound' });
    } else if (gestureAction === 'PLAY_VIDEO') {
      lastGestureTimeRef.current = now;
      videoEl.play?.().catch(() => {});
      setIsLessonPlaying(true);
      setActiveGesture({ action: 'PLAY_VIDEO', label: '▶️ Play Video' });
    } else if (gestureAction === 'PAUSE_VIDEO') {
      lastGestureTimeRef.current = now;
      videoEl.pause?.();
      setIsLessonPlaying(false);
      setActiveGesture({ action: 'PAUSE_VIDEO', label: '⏸️ Video Stopped' });
    } else if (gestureAction === 'TOGGLE_PLAY_PAUSE') {
      lastGestureTimeRef.current = now;
      if (videoEl.paused || videoEl.ended) {
        videoEl.play?.().catch(() => {});
        setIsLessonPlaying(true);
        setActiveGesture({ action: 'PLAY_VIDEO', label: '▶️ Play Video' });
      } else {
        videoEl.pause?.();
        setIsLessonPlaying(false);
        setActiveGesture({ action: 'PAUSE_VIDEO', label: '⏸️ Video Paused' });
      }
    }

    const timer = setTimeout(() => {
      setActiveGesture(null);
      useStore.setState({ gestureAction: null });
    }, 2000);
    return () => clearTimeout(timer);
  }, [gestureAction, currentVideo?.duration_seconds]);

  const attentionStatusRef = useRef(attentionStatus);
  attentionStatusRef.current = attentionStatus;
  const attentionDetailRef = useRef(attentionDetail);
  attentionDetailRef.current = attentionDetail;
  const activeKnowledgePopupRef = useRef(activeKnowledgePopup);
  activeKnowledgePopupRef.current = activeKnowledgePopup;
  const activePopupRef = useRef(activePopup);
  activePopupRef.current = activePopup;
  const distractionAlertRef = useRef(distractionAlert);
  distractionAlertRef.current = distractionAlert;
  const transcriptRef = useRef(transcript);
  transcriptRef.current = transcript;
  const cooldownUntilRef = useRef(0);

  const getMissedText = (time) => {
    const currentTs = transcriptRef.current || transcript;
    const segments = currentTs?.segments || [];
    if (!segments.length) {
      return 'Computer — An electronic device for processing, storing, and retrieving digital data.';
    }
    const seg = segments.find((s) => {
      const start = s.start_time ?? s.start ?? 0;
      const end = s.end_time ?? s.end ?? 0;
      return time >= start && time <= end;
    });
    if (seg?.text) return seg.text;
    const closest = segments.reduce((prev, curr) => {
      const prevStart = prev.start_time ?? prev.start ?? 0;
      const currStart = curr.start_time ?? curr.start ?? 0;
      return Math.abs(currStart - time) < Math.abs(prevStart - time) ? curr : prev;
    }, segments[0]);
    return closest?.text || 'Computer — An electronic device for processing, storing, and retrieving digital data.';
  };

  // ── Smart Lesson: 10-20s Distraction Auto-Stop & Smart Rewind ─────────────
  const distractionTrackerRef = useRef({
    inattentiveSeconds: 0,
    distractionStartVideoTime: null,
    attentiveGraceCount: 0,
  });

  useEffect(() => {
    const checkDistraction = () => {
      // Cooldown after user closes popup or rewinds
      if (Date.now() < cooldownUntilRef.current) return;

      const videoEl = videoRef.current;
      const isPlaying = videoEl && !videoEl.paused && !videoEl.ended;

      if (!isPlaying || activeKnowledgePopupRef.current || activePopupRef.current || distractionAlertRef.current) {
        distractionTrackerRef.current = {
          inattentiveSeconds: 0,
          distractionStartVideoTime: null,
          attentiveGraceCount: 0,
        };
        return;
      }

      if (attentionStatusRef.current === 'not_attentive') {
        if (distractionTrackerRef.current.distractionStartVideoTime === null) {
          distractionTrackerRef.current.distractionStartVideoTime = videoEl.currentTime || 0;
        }
        distractionTrackerRef.current.inattentiveSeconds += 0.5;
        distractionTrackerRef.current.attentiveGraceCount = 0;

        // Auto-pause upon reaching 10 seconds of inattention (10-20s window)
        if (distractionTrackerRef.current.inattentiveSeconds >= 10) {
          const startVideoTime = distractionTrackerRef.current.distractionStartVideoTime ?? (videoEl.currentTime || 0);
          const duration = Math.round(distractionTrackerRef.current.inattentiveSeconds);

          videoEl.pause?.();
          setIsLessonPlaying(false);

          const missedText = getMissedText(startVideoTime);

          const currentSyllabus = activeSyllabus || {
            grade: currentVideo?.grade || 'Grade 10',
            unit_number: currentVideo?.unit_number || 1,
            unit_title: currentVideo?.unit_title || 'Introduction to ICT',
            topic: currentVideo?.topic || 'Data & Information',
            subtopic_title: currentLearningConcept?.conceptName || currentVideo?.topic,
            summary_hint: currentLearningConcept?.description || currentVideo?.topic,
            key_terms: currentLearningConcept?.keywords || [],
          };
          const currentEmotion = emotion || 'not_attentive';

          // Trigger the centered distraction popup modal with syllabus context
          setDistractionAlert({
            startTime: startVideoTime,
            duration: duration,
            reason: attentionDetailRef.current?.reason || 'Looking away from lecture',
            emotion: currentEmotion,
            missedText,
            syllabusContext: currentSyllabus,
            summaryHint: currentSyllabus.summary_hint,
          });

          distractionTrackerRef.current = {
            inattentiveSeconds: 0,
            distractionStartVideoTime: null,
            attentiveGraceCount: 0,
          };

        }
      } else {
        // Tolerant grace period: only reset distraction if student stays attentive for 3 continuous cycles (1.5s)
        distractionTrackerRef.current.attentiveGraceCount += 1;
        if (distractionTrackerRef.current.attentiveGraceCount >= 3) {
          distractionTrackerRef.current = {
            inattentiveSeconds: 0,
            distractionStartVideoTime: null,
            attentiveGraceCount: 0,
          };
        }
      }
    };

    const intervalId = setInterval(checkDistraction, 500);
    return () => clearInterval(intervalId);
  }, []); // Run continuous timer unaffected by re-renders

  const handleRewindDistraction = (startTime) => {
    cooldownUntilRef.current = Date.now() + 4000;
    distractionTrackerRef.current = {
      inattentiveSeconds: 0,
      distractionStartVideoTime: null,
      attentiveGraceCount: 0,
    };
    setDistractionAlert(null);

    const videoEl = videoRef.current;
    if (videoEl) {
      const targetTime = Math.max(0, Number(startTime) || 0);
      videoEl.currentTime = targetTime;
      const playPromise = videoEl.play?.();
      if (playPromise?.catch) playPromise.catch(() => {});
    }
    setIsLessonPlaying(true);
  };

  const handleContinueDistraction = () => {
    cooldownUntilRef.current = Date.now() + 4000;
    distractionTrackerRef.current = {
      inattentiveSeconds: 0,
      distractionStartVideoTime: null,
      attentiveGraceCount: 0,
    };
    setDistractionAlert(null);

    const videoEl = videoRef.current;
    if (videoEl) {
      const playPromise = videoEl.play?.();
      if (playPromise?.catch) playPromise.catch(() => {});
    }
    setIsLessonPlaying(true);
  };

  const handleTimeUpdate = (currentTime) => {
    setCurrentPlaybackTime(currentTime);
  };

  useEffect(() => {
    requestedPopupCheckpointsRef.current = new Set();
    pendingPopupCheckpointsRef.current = new Set();
    setActivePopup(null);
  }, [currentVideo?.id, setActivePopup]);

  const currentLessonTitle = currentVideo?.title || 'ICT Sign language for deaf Student';

  const featuredConcepts = useMemo(() => {
    if (knowledgeGraph.length === 0) return [];
    const activeId = currentLearningConcept?.conceptId;
    const activeConcept = knowledgeGraph.find((concept) => concept.conceptId === activeId);
    const activeRelated = activeConcept?.relatedConcepts || [];

    const ranked = [...knowledgeGraph].sort((a, b) => {
      const aScore = a.conceptId === activeId ? 3 : activeRelated.includes(a.conceptId) ? 2 : 1;
      const bScore = b.conceptId === activeId ? 3 : activeRelated.includes(b.conceptId) ? 2 : 1;
      return bScore - aScore;
    });

    return ranked.slice(0, 3).map((concept, index) => ({
      ...concept,
      match: [85, 72, 65][index] || 60,
    }));
  }, [knowledgeGraph, currentLearningConcept]);

  const heroStats = useMemo(() => {
    const readyVideos = videos.filter((video) => video.status === 'ready').length;
    return [
      {
        icon: BookOpen,
        label: 'Lessons',
        value: videos.length,
        description: 'Video modules connected to the AI lesson engine.',
      },
      {
        icon: BrainCircuit,
        label: 'Concept',
        value: currentLearningConcept?.conceptName || 'Introduction to ICT',
        description: 'The graph follows playback time and the active topic.',
      },
      {
        icon: Play,
        label: 'Ready',
        value: readyVideos,
        description: 'Lessons available for instant playback and checkpoints.',
      },
    ];
  }, [videos, currentLearningConcept]);

  const transcriptSegments = useMemo(() => {
    const rawSegments = transcript?.segments || [];
    const processed = [];

    for (const seg of rawSegments) {
      // Extract label from [LABEL] or topic prefix before em-dash '—'
      let segLabel = seg.label;
      let segText = seg.text || '';

      const bracketMatch = segText.match(/^\[([A-Z\s_]+)\]/);
      if (bracketMatch) {
        segLabel = bracketMatch[1].trim();
        segText = segText.replace(/^\[[A-Z\s_]+\]\s*/, '');
      } else {
        const prefixMatch = segText.match(/^([A-Za-z\s]{3,18})\s*[—\-]/);
        if (prefixMatch) {
          segLabel = prefixMatch[1].trim().toUpperCase();
        }
      }

      if (!segLabel) {
        segLabel = currentLearningConcept?.conceptName?.toUpperCase() || 'LESSON';
      }

      // Filter out duplicate consecutive text entries
      if (processed.length > 0 && processed[processed.length - 1].text === segText) {
        processed[processed.length - 1].end_time = seg.end_time;
      } else {
        processed.push({
          ...seg,
          label: segLabel,
          text: segText,
        });
      }
    }

    return processed;
  }, [transcript, currentLearningConcept]);

  const timelineSegments = useMemo(
    () =>
      (transcript?.segments || []).slice(0, 6).map((segment) => {
        let state = 'pending';
        if (currentPlaybackTime >= segment.end_time) state = 'completed';
        else if (
          currentPlaybackTime >= segment.start_time &&
          currentPlaybackTime <= segment.end_time
        ) {
          state = 'current';
        }

        return {
          ...segment,
          state,
        };
      }),
    [transcript, currentPlaybackTime]
  );

  const timelineDuration = useMemo(() => {
    const segments = transcript?.segments || [];
    if (currentVideo?.duration_seconds) return currentVideo.duration_seconds;
    if (segments.length > 0) return segments[segments.length - 1].end_time;
    return 0;
  }, [currentVideo, transcript]);

  const timelineProgress = timelineDuration
    ? Math.min((currentPlaybackTime / timelineDuration) * 100, 100)
    : 0;

  const latestHistory = popupAnswerHistory.slice(0, 3);

  const attentionState = {
    label:
      attentionStatus === 'attentive'
        ? 'Attentive'
        : attentionStatus === 'not_attentive'
          ? 'Distracted'
          : 'Calibrating',
    tone:
      attentionStatus === 'attentive'
        ? 'font-semibold text-success'
        : 'font-semibold text-warning',
  };

  const videoChips = [
    {
      icon: GraduationCap,
      label: currentVideo?.grade ? `${currentVideo.grade} • Unit ${currentVideo.unit_number || 1}` : 'Grade 10 ICT',
      accent: true,
    },
    {
      icon: BrainCircuit,
      label: activeSyllabus?.subtopic_title || currentLearningConcept?.conceptName || 'Concept Checkpoints',
    },
    {
      icon: Clock,
      label: timelineDuration ? `${Math.floor(timelineDuration)}s Duration` : 'Timeline syncing',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="dashboard-shell lesson-dashboard-shell"
    >
      <KnowledgeQuestionPopup
        key={activeKnowledgePopup?.question?.questionId || 'knowledge-popup'}
        popupSession={activeKnowledgePopup}
        isSubmitting={isPopupSubmitting}
        onSubmitAnswer={handleSubmitPopupAnswer}
        onContinue={handleContinueLesson}
      />

      <DistractionAlertModal
        isOpen={Boolean(distractionAlert)}
        alertData={distractionAlert}
        onRewind={handleRewindDistraction}
        onContinue={handleContinueDistraction}
      />

      <div className="dashboard-layout">
        <div className="dashboard-stack">
          <VideoPanel
            icon={Radar}
            title={currentLessonTitle}
            description="Interactive lesson playback with transcript sync, concept diagrams, and adaptive popup questions."
            chips={videoChips}
            stats={heroStats}
            media={
              <div className="dashboard-media-frame relative flex flex-col gap-2">
                {/* Real-Time Syllabus Topic & Facial Emotion Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-black/40 border border-white/10 px-4 py-2 text-xs backdrop-blur-md">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-extrabold uppercase tracking-wider text-emerald-400">
                      {currentVideo?.grade || 'Grade 10'} ICT
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="font-semibold text-slate-200">
                      Unit {currentVideo?.unit_number || 1}: {currentVideo?.unit_title || 'Curriculum Module'}
                    </span>
                    {activeSyllabus?.subtopic_title && (
                      <>
                        <span className="text-white/30">›</span>
                        <span className="text-amber-300 font-medium">
                          {activeSyllabus.subtopic_title}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* <span className="text-slate-400 text-[11px]">Facial Emotion:</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${
                        emotion === 'confused'
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40'
                          : emotion === 'frustrated'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : emotion === 'drowsy'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : emotion === 'confident'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {emotion}
                    </span> */}
                  </div>
                </div>

                <GestureActionHUD activeGesture={activeGesture} />
                <VideoPlayer
                  key={currentVideo?.id || 'video-player-top'}
                  video={currentVideo}
                  transcript={transcript}
                  videoRef={videoRef}
                  onTimeUpdate={handleTimeUpdate}
                />
              </div>
            }
          />

          {/* Smart Lesson Hand Gestures Horizontal Bar */}
          <SupportedGesturesCard />

          <TranscriptPanel
            icon={BookOpen}
            title="Live Transcript"
            description="Transcript markers and lesson flow stay aligned with the current playback position."
            segments={transcriptSegments}
            currentPlaybackTime={currentPlaybackTime}
            formatClock={formatClock}
          />

          <TimelinePanel
            icon={Sparkles}
            title="Lesson Flow"
            description="The timeline tracks playback progress and transcript checkpoints as the lesson moves forward."
            currentPlaybackTime={currentPlaybackTime}
            timelineDuration={formatClock(timelineDuration)}
            timelineProgress={timelineProgress}
            segments={timelineSegments}
          />

          {/* Attention Heatmap — maps distraction events to video timeline */}
          <DashboardPanel>
            <Header
              label="Analytics"
              icon={BarChart2}
              title="Attention Heatmap"
              description="Session distraction events mapped to the video timeline. Green = focused, orange = distracted, amber = drowsy."
            />
            <div className="mt-4">
              <AttentionHeatmap videoDuration={timelineDuration} />
            </div>
          </DashboardPanel>
        </div>

        <div className="dashboard-stack">
          <LessonCard
            icon={Play}
            title="Current Lesson"
            description="The active lesson card stays in sync with playback, transcript, and popup checkpoints."
            lessonTitle={currentLessonTitle}
            status={currentVideo?.status || 'ready'}
            duration={timelineDuration ? `${Math.floor(timelineDuration)}s` : '--'}
          />

          <WebcamPanel
            icon={Eye}
            title="Live Webcam"
            description="A responsive monitoring panel tracks student attention while the lesson is running."
            status={attentionState}
            media={<WebcamFeed videoRef={videoRef} compact />}
          />

          {/* Attention Stats Panel */}
          <DashboardPanel>
            <Header
              label="Attention"
              icon={Activity}
              title="Attention Analytics"
              description="Real-time engagement score, drowsiness (PERCLOS), gaze direction, and blink rate."
            />
            <div className="mt-4">
              <AttentionStatsPanel />
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <Header
              label="Concepts"
              icon={BrainCircuit}
              title="Concept Cards"
              description="Relevant concepts rise to the top based on the current learning checkpoint."
            />

            <div className="mt-6 grid gap-3">
              {featuredConcepts.length === 0 ? (
                <div className="rounded-[20px] bg-black/20 px-5 py-8 text-sm text-text-muted">
                  Concepts will appear once the lesson syncs with the knowledge graph.
                </div>
              ) : (
                featuredConcepts.map((concept, index) => (
                  <ConceptCard
                    key={concept.conceptId}
                    concept={concept}
                    isActive={index === 0}
                  />
                ))
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <Header
              label="History"
              icon={CheckCircle2}
              title="Popup Feedback"
              description="The latest knowledge checks are stored here with answer results and explanation support."
            />

            <div className="mt-6 grid gap-3">
              {latestHistory.length === 0 ? (
                <div className="rounded-[20px] bg-black/20 px-5 py-8 text-sm text-text-muted">
                  The popup history will appear after the first knowledge checkpoint.
                </div>
              ) : (
                latestHistory.map((answer) => (
                  <PopupHistoryCard key={answer.id} answer={answer} />
                ))
              )}
            </div>

            {videos.length > 0 && (
              <div className="mt-6 rounded-[20px] bg-black/18 p-4">
                <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  <div className="inline-flex items-center gap-2">
                    <Video size={12} />
                    Syllabus Video Library ({videos.length})
                  </div>
                </div>

                {/* Grade 10 / 11 Filter Tabs */}
                <div className="mb-3 flex items-center gap-1.5 rounded-xl bg-white/[0.04] p-1 border border-white/[0.08]">
                  {['ALL', 'Grade 10', 'Grade 11'].map((g) => (
                    <button
                      key={g}
                      onClick={() => {
                        setCurriculumGrade(g);
                        setCurriculumUnit('ALL');
                      }}
                      className={`flex-1 rounded-lg py-1.5 text-center text-xs font-bold transition cursor-pointer ${
                        curriculumGrade === g
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {g === 'ALL' ? 'All Grades' : g}
                    </button>
                  ))}
                </div>

                {/* Unit Filter Bar when Grade selected */}
                {curriculumGrade !== 'ALL' && (
                  <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    <button
                      onClick={() => setCurriculumUnit('ALL')}
                      className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                        curriculumUnit === 'ALL'
                          ? 'bg-primary/20 text-primary border border-primary/40'
                          : 'bg-white/[0.04] text-slate-400 hover:text-white'
                      }`}
                    >
                      All Units
                    </button>
                    {(curriculumGrade === 'Grade 10' ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [1, 2, 3, 4, 5]).map((u) => (
                      <button
                        key={u}
                        onClick={() => setCurriculumUnit(u)}
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                          curriculumUnit === u
                            ? 'bg-primary/20 text-primary border border-primary/40'
                            : 'bg-white/[0.04] text-slate-400 hover:text-white'
                        }`}
                      >
                        Unit {u}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid gap-2 max-h-72 overflow-y-auto pr-1">
                  {videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleSelectVideo(video)}
                      className={`flex flex-col gap-1 rounded-2xl px-4 py-3 text-left transition cursor-pointer ${
                        currentVideo?.id === video.id
                          ? 'bg-primary/15 text-white border border-primary/30 font-medium'
                          : 'bg-white/[0.03] text-text-muted hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold text-white">{video.title}</span>
                        <span className="shrink-0 text-xs font-mono text-slate-400">
                          {video.duration_seconds ? `${Math.floor(video.duration_seconds)}s` : '--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 font-bold text-emerald-300">
                          {video.grade || 'Grade 10'}
                        </span>
                        <span>Unit {video.unit_number || 1}</span>
                        <span className="truncate text-slate-400">• {video.topic || 'Fundamentals'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </DashboardPanel>
        </div>
      </div>
    </motion.div>
  );
};

export default StudentView;
