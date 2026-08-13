import { BrainCircuit, Hand, Sparkles } from 'lucide-react';

import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';
import SignLecturePlayer from '../../../components/SignAvatar/SignLecturePlayer';
import useStore from '../../shared-app/utils/useStore';

const deriveLearningState = (attentionStatus) =>
  attentionStatus === 'not_attentive' ? 'distracted' : 'understanding';

const SignAvatarPage = () => {
  const { userId, attentionStatus, currentVideo } = useStore();
  const learningState = deriveLearningState(attentionStatus);
  const currentTopic = currentVideo?.title || 'General O/L ICT';

  return (
    <div className="dashboard-shell sign-avatar-page-shell">
      <div className="dashboard-layout">
        <div className="dashboard-stack">
          <DashboardPanel className="dashboard-panel-hero">
            <Header
              label="Sign Avatar"
              icon={Hand}
              title="Keyword-based sign avatar player"
              description="Paste O/L ICT lesson notes, extract the important keywords, and let the avatar sign them one by one using direct gestures or fallback hand animations."
            />

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="dashboard-chip text-primary">
                <Sparkles size={16} className="text-primary" />
                Both-hand sign playback
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
          </DashboardPanel>

          <DashboardPanel className="sign-avatar-player-shell">
            <SignLecturePlayer
              userId={userId}
              currentTopic={currentTopic}
              learningState={learningState}
            />
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
};

export default SignAvatarPage;
