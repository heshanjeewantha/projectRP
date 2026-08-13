import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookText, BrainCircuit, GraduationCap, Lightbulb } from 'lucide-react';

import { getLessonSummary } from '../services/chatbotApi';
import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';

const LessonSummaryPage = () => {
  const { topicId } = useParams();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadSummary = async () => {
      setIsLoading(true);
      try {
        const response = await getLessonSummary(topicId);
        if (isMounted) {
          setSummary(response);
        }
      } catch (error) {
        console.error('Failed to load lesson summary', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      isMounted = false;
    };
  }, [topicId]);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-stack">
        <DashboardPanel className="dashboard-panel-hero">
          <Header
            label="Summary"
            icon={BookText}
            title={summary?.topicName || 'Lesson Summary'}
            description={
              summary?.summary ||
              'A focused revision summary with prerequisites, key points, and exam-style reminders.'
            }
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/chatbot" className="chatbot-inline-button">
              <ArrowLeft size={14} />
              Back to chatbot
            </Link>
            <Link to="/lesson" className="chatbot-inline-button is-primary">
              Open lesson
              <ArrowRight size={14} />
            </Link>
          </div>
        </DashboardPanel>

        {isLoading ? (
          <DashboardPanel>
            <div className="text-sm text-text-muted">Loading summary...</div>
          </DashboardPanel>
        ) : summary ? (
          <div className="dashboard-layout">
            <div className="dashboard-stack">
              <DashboardPanel>
                <Header
                  label="Key Points"
                  icon={Lightbulb}
                  title="What to remember"
                  description="Use these points as the fast refresh before continuing with the lesson or the chatbot."
                />
                <div className="summary-point-grid">
                  {summary.keyPoints?.map((point) => (
                    <div key={point} className="summary-point-card">
                      <Lightbulb size={16} className="text-primary" />
                      <p className="dashboard-text-wrap text-sm text-white/90">{point}</p>
                    </div>
                  ))}
                </div>
              </DashboardPanel>

              <DashboardPanel>
                <Header
                  label="Practice"
                  icon={BrainCircuit}
                  title="Sample questions"
                  description="Short learner-friendly prompts for review and discussion."
                />
                <div className="summary-question-list">
                  {(summary.sampleQuestions || []).map((item) => (
                    <div key={item} className="summary-question-card">
                      {item}
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            </div>

            <div className="dashboard-stack">
              <DashboardPanel>
                <Header
                  label="Prerequisites"
                  icon={BrainCircuit}
                  title="Previous knowledge"
                  description="Revisit these topics first if the current topic still feels difficult."
                />
                <div className="flex flex-wrap gap-2">
                  {(summary.prerequisites || []).length ? (
                    summary.prerequisites.map((item) => (
                      <span key={item} className="chatbot-topic-tag">
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-text-muted">No prerequisite topics required.</span>
                  )}
                </div>
              </DashboardPanel>

              <DashboardPanel>
                <Header
                  label="Exam Help"
                  icon={GraduationCap}
                  title="Exam-style prompts"
                  description="Use these questions to write shorter, marks-aware answers."
                />
                <div className="summary-question-list">
                  {(summary.examQuestions || []).map((item) => (
                    <div key={item} className="summary-question-card">
                      {item}
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            </div>
          </div>
        ) : (
          <DashboardPanel>
            <div className="text-sm text-text-muted">No summary found for this topic.</div>
          </DashboardPanel>
        )}
      </div>
    </div>
  );
};

export default LessonSummaryPage;
