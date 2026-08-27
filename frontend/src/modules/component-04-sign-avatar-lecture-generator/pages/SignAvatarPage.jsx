import { useState } from 'react';
import { BrainCircuit, Film, Hand, Layers, Sparkles, Video } from 'lucide-react';

import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';
import SignLecturePlayer from '../../../components/SignAvatar/SignLecturePlayer';
import FingerspellingStudio from '../components/SignAvatar/FingerspellingStudio';
import useStore from '../../shared-app/utils/useStore';

const deriveLearningState = (attentionStatus) =>
  attentionStatus === 'not_attentive' ? 'distracted' : 'understanding';

const SignAvatarPage = () => {
  const { userId, attentionStatus, currentVideo } = useStore();
  const [activeTab, setActiveTab] = useState('fingerspelling'); // 'fingerspelling' | 'lecture'
  const learningState = deriveLearningState(attentionStatus);
  const currentTopic = currentVideo?.title || 'General O/L ICT';

  return (
    <div className="dashboard-shell sign-avatar-page-shell">
      <div className="dashboard-stack">
        <DashboardPanel className="dashboard-panel-hero">
          <Header
            label="Sign Avatar"
            icon={Hand}
            title="Interactive Sign Avatar &amp; ASL Fingerspelling Studio"
            description="Explore 26-letter ASL manual alphabet gestures, decompose ICT lesson notes into fingerspelled words, preview 3D articulated avatar hands, and download sign video footage."
          />

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="dashboard-chip text-primary">
                <Sparkles size={16} className="text-primary" />
                Articulated 3D Hand Rig
              </span>
              <span className="dashboard-chip">
                <BrainCircuit size={16} className="text-primary" />
                State: {learningState.replaceAll('_', ' ')}
              </span>
              <span className="dashboard-chip">
                <Hand size={16} className="text-primary" />
                Topic: {currentTopic}
              </span>
            </div>

            {/* Mode Tab Switcher */}
            <div className="flex items-center gap-2 rounded-2xl bg-black/40 p-1.5 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('fingerspelling')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'fingerspelling'
                    ? 'bg-primary text-slate-950 shadow-lg shadow-primary/25'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Layers size={15} />
                <span>ASL Fingerspelling Studio</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('lecture')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition-all cursor-pointer ${
                  activeTab === 'lecture'
                    ? 'bg-primary text-slate-950 shadow-lg shadow-primary/25'
                    : 'text-text-muted hover:text-white'
                }`}
              >
                <Film size={15} />
                <span>Keyword Lecture Player</span>
              </button>
            </div>
          </div>
        </DashboardPanel>

        {activeTab === 'fingerspelling' ? (
          <FingerspellingStudio />
        ) : (
          <DashboardPanel className="sign-avatar-player-shell">
            <SignLecturePlayer
              userId={userId}
              currentTopic={currentTopic}
              learningState={learningState}
            />
          </DashboardPanel>
        )}
      </div>
    </div>
  );
};

export default SignAvatarPage;

