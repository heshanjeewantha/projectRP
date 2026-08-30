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
} from 'lucide-react';
import { motion } from 'framer-motion';

import { getVideos, getTranscript } from '../services/videoApi';
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

  useEffect(() => {
    let isMounted = true;

    const loadVideos = async () => {
      try {
        const data = await getVideos();
        if (!isMounted) return;
        setVideos(data);
        if (data.length > 0) {
          setCurrentVideo(data[0]);
          try {
            const ts = await getTranscript(data[0].id);
            if (isMounted) {
              setTranscript(ts);
            }
          } catch (error) {
            console.log('No transcript yet', error);
            if (isMounted) {
              setTranscript(null);
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

    loadVideos();
    loadKnowledgeGraph();

    return () => {
      isMounted = false;
    };
  }, [setCurrentVideo]);

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
    if (now - lastGestureTimeRef.current < 1600) return; // 1.6s cooldown

    const videoEl = videoRef.current;
    if (gestureAction === 'SKIP_FORWARD_10S') {
      lastGestureTimeRef.current = now;
      const targetTime = Math.min(videoEl.duration || 9999, videoEl.currentTime + 10);
      videoEl.currentTime = targetTime;
      setActiveGesture({ action: 'SKIP_FORWARD_10S', label: '+10s Skipped' });
    } else if (gestureAction === 'SKIP_BACKWARD_10S') {
      lastGestureTimeRef.current = now;
      const targetTime = Math.max(0, videoEl.currentTime - 10);
      videoEl.currentTime = targetTime;
      setActiveGesture({ action: 'SKIP_BACKWARD_10S', label: '-10s Rewound' });
    } else if (gestureAction === 'PLAY_VIDEO') {
      lastGestureTimeRef.current = now;
      videoEl.play?.();
      setIsLessonPlaying(true);
      setActiveGesture({ action: 'PLAY_VIDEO', label: '▶️ Play Video' });
    } else if (gestureAction === 'PAUSE_VIDEO') {
      lastGestureTimeRef.current = now;
      videoEl.pause?.();
      setIsLessonPlaying(false);
      setActiveGesture({ action: 'PAUSE_VIDEO', label: '⏸️ Video Paused' });
    } else if (gestureAction === 'TOGGLE_PLAY_PAUSE') {
      lastGestureTimeRef.current = now;
      if (videoEl.paused) {
        videoEl.play?.();
        setIsLessonPlaying(true);
        setActiveGesture({ action: 'PLAY_VIDEO', label: '▶️ Play Video' });
      } else {
        videoEl.pause?.();
        setIsLessonPlaying(false);
        setActiveGesture({ action: 'PAUSE_VIDEO', label: '⏸️ Video Paused' });
      }
    }

    const timer = setTimeout(() => setActiveGesture(null), 2500);
    return () => clearTimeout(timer);
  }, [gestureAction]);

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

          // Trigger the centered distraction popup modal
          setDistractionAlert({
            startTime: startVideoTime,
            duration: duration,
            reason: attentionDetailRef.current?.reason || 'Looking away from lecture',
            missedText,
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
    { icon: BrainCircuit, label: 'Concept popups', accent: true },
    {
      icon: Clock,
      label: timelineDuration ? `${Math.floor(timelineDuration)} seconds ready` : 'Timeline syncing',
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
              <div className="dashboard-media-frame relative">
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

            {videos.length > 1 && (
              <div className="mt-6 rounded-[20px] bg-black/18 p-4">
                <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-text-muted">
                  <Video size={12} />
                  Library
                </div>
                <div className="grid gap-2">
                  {videos.slice(0, 4).map((video) => (
                    <button
                      key={video.id}
                      onClick={() => handleSelectVideo(video)}
                      className={`flex min-w-0 items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition ${
                        currentVideo?.id === video.id
                          ? 'bg-primary/10 text-white'
                          : 'bg-white/[0.03] text-text-muted hover:bg-white/[0.05]'
                      }`}
                    >
                      <span className="truncate">{video.title}</span>
                      <span className="shrink-0 text-xs">
                        {video.duration_seconds ? `${Math.floor(video.duration_seconds)}s` : '--'}
                      </span>
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
