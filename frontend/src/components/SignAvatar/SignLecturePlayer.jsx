import { useMemo, useState } from 'react';
import { BrainCircuit, Pause, Play, RotateCcw, Send, SkipBack, SkipForward, Sparkles } from 'lucide-react';


import { generateSignAvatarSequence } from '../../modules/component-04-sign-avatar-lecture-generator/services/signAvatarApi';
import processLessonTextToSigns from '../../utils/textToSignProcessor';
import AvatarAnimationController from './AvatarAnimationController';

const DEFAULT_LESSON_TEXT =
  'Use a computer with a keyboard and mouse. Connect to the internet over a network to send an email. Store data on the cloud. Run a program to process information.';

const SignLecturePlayer = ({
  userId,
  currentTopic = 'General O/L ICT',
  learningState = 'understanding',
}) => {
  const [lessonText, setLessonText] = useState(DEFAULT_LESSON_TEXT);
  const [sequencePayload, setSequencePayload] = useState(() => processLessonTextToSigns(DEFAULT_LESSON_TEXT));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackReset, setPlaybackReset] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusNote, setStatusNote] = useState('Paste lesson notes and generate a sign sequence.');
  const [sourceType, setSourceType] = useState('LOCAL_KEYWORD_MATCHER');
  const [llmAssisted, setLlmAssisted] = useState(false);
  const [wlaslModelMeta, setWlaslModelMeta] = useState(null);
  const [wlaslEnrichedCount, setWlaslEnrichedCount] = useState(0);


  const activeItem = sequencePayload.avatarAnimationSequence?.[currentIndex] || null;
  const fallbackCount = useMemo(
    () =>
      (sequencePayload.avatarAnimationSequence || []).filter((item) => item.isFallback).length,
    [sequencePayload.avatarAnimationSequence]
  );

  const handleGenerate = async () => {
    const trimmedText = lessonText.trim();
    if (!trimmedText || isGenerating) return;

    setIsGenerating(true);
    setStatusNote('Generating sign-ready keyword sequence...');

    try {
      const response = await generateSignAvatarSequence({
        lessonText: trimmedText,
        studentId: userId || 'guest_student',
        currentTopic,
        currentLearningState: learningState,
        selectedLanguage: 'English',
      });

      setSequencePayload({
        keywords: response.keywords || [],
        simplifiedText: response.simplifiedText || trimmedText,
        avatarAnimationSequence: response.avatarAnimationSequence || [],
        subtitleSegments: response.subtitleSegments || [],
      });
      setSourceType(response.sourceType || 'LOCAL_KEYWORD_MATCHER');
      setLlmAssisted(Boolean(response.llmAssisted));
      setWlaslModelMeta(response.wlaslModelMeta || null);
      setWlaslEnrichedCount(response.wlaslEnrichedCount || 0);

      setCurrentIndex(0);
      setIsPlaying(true);
      setStatusNote(
        response.sourceType === 'LLM_KEYWORD_EXTRACTION'
          ? 'Sequence generated with LLM-assisted keyword extraction.'
          : 'Sequence generated from the local ICT sign dictionary.'
      );
    } catch (error) {
      console.error('Falling back to local text-to-sign processor', error);
      const localPayload = processLessonTextToSigns(trimmedText);
      setSequencePayload(localPayload);
      setSourceType('LOCAL_KEYWORD_MATCHER');
      setLlmAssisted(false);
      setCurrentIndex(0);
      setIsPlaying(true);
      setStatusNote('Backend sequence API is unavailable. Using local keyword matching.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePauseToggle = () => {
    if (!sequencePayload.avatarAnimationSequence?.length) return;
    setIsPlaying((previous) => !previous);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
    setPlaybackReset((value) => value + 1);
  };

  const handleNext = () => {
    if (!sequencePayload.avatarAnimationSequence?.length) return;
    setCurrentIndex((previous) =>
      previous + 1 >= sequencePayload.avatarAnimationSequence.length ? 0 : previous + 1
    );
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (!sequencePayload.avatarAnimationSequence?.length) return;
    setCurrentIndex((previous) =>
      previous - 1 < 0 ? sequencePayload.avatarAnimationSequence.length - 1 : previous - 1
    );
    setIsPlaying(true);
  };

  return (
    <div className="sign-lecture-player">
      <div className="sign-lecture-player__grid">
        <div className="sign-lecture-player__panel">
          <div className="sign-lecture-player__panel-head">
            <div>
              <div className="sign-lecture-player__eyebrow">Lesson Notes</div>
              <h3 className="sign-lecture-player__title">Generate a keyword-based sign sequence</h3>
            </div>
            <span className="sign-lecture-player__chip">
              <Sparkles size={14} />
              {llmAssisted ? 'LLM keyword assist' : 'Local keyword matching'}
            </span>
          </div>

          <textarea
            value={lessonText}
            onChange={(event) => setLessonText(event.target.value)}
            className="sign-lecture-player__textarea"
            placeholder="Type or paste O/L ICT lesson notes here..."
          />

          <div className="sign-lecture-player__actions">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !lessonText.trim()}
              className="sign-lecture-player__primary"
            >
              <Send size={15} />
              {isGenerating ? 'Generating...' : 'Generate Sign Sequence'}
            </button>
            <button type="button" onClick={handlePauseToggle} className="sign-lecture-player__secondary">
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button type="button" onClick={handleStop} className="sign-lecture-player__secondary">
              <RotateCcw size={15} />
              Stop
            </button>
            <button type="button" onClick={handlePrevious} className="sign-lecture-player__secondary">
              <SkipBack size={15} />
              Previous Sign
            </button>
            <button type="button" onClick={handleNext} className="sign-lecture-player__secondary">
              <SkipForward size={15} />
              Next Sign
            </button>
          </div>

          <div className="sign-lecture-player__note">{statusNote}</div>

          <div className="sign-lecture-player__stats">
            <div className="sign-lecture-player__stat">
              <span className="sign-lecture-player__stat-label">Detected keywords</span>
              <strong>{sequencePayload.keywords?.length || 0}</strong>
            </div>
            <div className="sign-lecture-player__stat">
              <span className="sign-lecture-player__stat-label">Fallback signs</span>
              <strong>{fallbackCount}</strong>
            </div>
            <div className="sign-lecture-player__stat">
              <span className="sign-lecture-player__stat-label">Source</span>
              <strong>{sourceType === 'LLM_KEYWORD_EXTRACTION' ? 'LLM' : 'Dataset'}</strong>
            </div>
            {wlaslModelMeta?.modelReady && (
              <div className="sign-lecture-player__stat sign-lecture-player__stat--wlasl">
                <span className="sign-lecture-player__stat-label">
                  <BrainCircuit size={12} style={{ display: 'inline', marginRight: 4 }} />
                  BiLSTM Model
                </span>
                <strong title={`${wlaslModelMeta.architecture} · ${wlaslModelMeta.classCount} classes · val_acc ${(wlaslModelMeta.valAccuracy * 100).toFixed(1)}%`}>
                  {wlaslEnrichedCount} / {sequencePayload.keywords?.length || 0} signs
                </strong>
              </div>
            )}
          </div>


          <div className="sign-lecture-player__simplified">
            <div className="sign-lecture-player__eyebrow">Sign-friendly summary</div>
            <p>{sequencePayload.simplifiedText}</p>
          </div>
        </div>

        <div className="sign-lecture-player__panel is-stage">
          <AvatarAnimationController
            sequence={sequencePayload.avatarAnimationSequence || []}
            isPlaying={isPlaying}
            currentIndex={currentIndex}
            onCurrentIndexChange={setCurrentIndex}
            onSequenceComplete={() => setIsPlaying(false)}
            resetToken={playbackReset}
          />

          <div className="sign-lecture-player__current">
            <div className="sign-lecture-player__eyebrow">Subtitle</div>
            <div className="sign-lecture-player__subtitle">
              {activeItem?.subtitle || 'Avatar is ready.'}
            </div>
          </div>
        </div>
      </div>

      <div className="sign-lecture-player__timeline">
        {(sequencePayload.avatarAnimationSequence || []).map((item, index) => (
          <button
            key={`${item.keyword}-${index}`}
            type="button"
            onClick={() => {
              setCurrentIndex(index);
              setIsPlaying(true);
            }}
            className={`sign-lecture-player__timeline-item ${currentIndex === index ? 'is-active' : ''} ${item.isFallback ? 'is-fallback' : ''} ${item.wlaslModelClass ? 'is-wlasl' : ''}`}
            title={item.wlaslModelClass ? `WLASL BiLSTM model · ${item.wlaslArchitecture} · ${((item.wlaslValAccuracy || 0) * 100).toFixed(1)}% acc` : undefined}
          >
            <span className="sign-lecture-player__timeline-word">
              {item.keyword}
              {item.wlaslModelClass && (
                <BrainCircuit size={10} className="sign-lecture-player__wlasl-icon" />
              )}
            </span>
            <span className="sign-lecture-player__timeline-meta">
              {item.wlaslModelClass
                ? `BiLSTM · ${((item.wlaslValAccuracy || 0) * 100).toFixed(0)}%`
                : item.isFallback
                ? `Fallback: ${item.fallbackGesture}`
                : item.animationName}
            </span>
          </button>

        ))}
      </div>
    </div>
  );
};

export default SignLecturePlayer;
