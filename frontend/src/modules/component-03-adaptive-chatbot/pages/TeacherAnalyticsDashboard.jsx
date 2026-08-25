import { useEffect, useMemo, useState } from 'react';
import { BarChart3, BrainCircuit, Download, FileDown, Lightbulb, ShieldAlert, TrendingUp } from 'lucide-react';

import { downloadAnalyticsReport, getTeacherDashboard } from '../services/chatbotApi';
import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';

const TeacherAnalyticsDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const response = await getTeacherDashboard();
        if (isMounted) {
          setDashboardData(response);
        }
      } catch (error) {
        console.error('Failed to load teacher analytics dashboard', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const overviewStats = useMemo(() => {
    if (!dashboardData) return [];
    return [
      {
        label: 'Weak Topics',
        value: dashboardData.weakTopics?.length || 0,
        icon: ShieldAlert,
        description: 'Topics currently below the desired understanding threshold.',
      },
      {
        label: 'Micro Challenge Accuracy',
        value: `${dashboardData.microChallengePerformance?.accuracy || 0}%`,
        icon: BrainCircuit,
        description: 'Overall success rate in optional prerequisite checks.',
      },
      {
        label: 'Active Alerts',
        value: dashboardData.repeatedQueryAlerts?.length || 0,
        icon: Lightbulb,
        description: 'Repeated-question alerts requiring teacher attention.',
      },
      {
        label: 'Quiz Entries',
        value: dashboardData.loginQuizResults?.length || 0,
        icon: TrendingUp,
        description: 'Recent forgetting-curve quiz submissions in the dashboard.',
      },
    ];
  }, [dashboardData]);

  const handleDownload = async (format) => {
    try {
      setDownloadingFormat(format);
      const file = await downloadAnalyticsReport({ format });
      const url = window.URL.createObjectURL(file.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file.filename;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(`Failed to download ${format} report`, error);
    } finally {
      setDownloadingFormat('');
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-stack">
        <DashboardPanel className="dashboard-panel-hero">
          <Header
            label="Analytics"
            icon={BarChart3}
            title="Teacher analytics dashboard"
            description="Review understanding scores, repeated query alerts, micro-challenge results, and forgetting-curve quiz performance across the learning platform."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleDownload('pdf')}
              disabled={downloadingFormat !== ''}
              className="chatbot-inline-button is-primary"
            >
              <Download size={14} />
              {downloadingFormat === 'pdf' ? 'Preparing PDF...' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={() => handleDownload('csv')}
              disabled={downloadingFormat !== ''}
              className="chatbot-inline-button"
            >
              <FileDown size={14} />
              {downloadingFormat === 'csv' ? 'Preparing CSV...' : 'Download CSV'}
            </button>
          </div>
        </DashboardPanel>

        {isLoading ? (
          <DashboardPanel>
            <div className="text-sm text-text-muted">Loading analytics dashboard...</div>
          </DashboardPanel>
        ) : (
          <>
            <div className="dashboard-stat-grid">
              {overviewStats.map((item) => (
                <DashboardPanel key={item.label} className="dashboard-stat-card">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <item.icon size={22} />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    {item.label}
                  </div>
                  <div className="text-3xl font-black text-white">{item.value}</div>
                  <p className="dashboard-text-wrap text-sm text-text-muted">{item.description}</p>
                </DashboardPanel>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="dashboard-stack">
                <DashboardPanel>
                  <Header
                    label="Bar Chart"
                    icon={BarChart3}
                    title="Topic-wise understanding"
                    description="Average understanding score by topic."
                  />
                  <div className="analytics-bar-stack">
                    {(dashboardData?.topicBarChart || []).map((item) => (
                      <div key={item.topic} className="analytics-bar-row">
                        <div className="analytics-bar-label">{item.topic}</div>
                        <div className="analytics-bar-track">
                          <div className="analytics-bar-fill" style={{ width: `${Math.max(8, item.score)}%` }} />
                        </div>
                        <div className="analytics-bar-value">{item.score}%</div>
                      </div>
                    ))}
                  </div>
                </DashboardPanel>

                <DashboardPanel>
                  <Header
                    label="Progress"
                    icon={TrendingUp}
                    title="Progress over time"
                    description="Seven-day view based on recent login quiz performance."
                  />
                  <div className="analytics-line-grid">
                    {(dashboardData?.progressLineChart || []).map((item) => (
                      <div key={item.date} className="analytics-line-point">
                        <div className="analytics-line-bar-wrap">
                          <div className="analytics-line-bar" style={{ height: `${Math.max(12, item.score)}%` }} />
                        </div>
                        <div className="analytics-line-value">{item.score}%</div>
                        <div className="analytics-line-label">{item.date.slice(5)}</div>
                      </div>
                    ))}
                  </div>
                </DashboardPanel>
              </div>

              <div className="dashboard-stack">
                <DashboardPanel>
                  <Header
                    label="Learning States"
                    icon={BrainCircuit}
                    title="Learning-state distribution"
                    description="Recent chatbot conversations grouped by detected learning state."
                  />
                  <div className="analytics-pie-list">
                    {(dashboardData?.learningStatePieChart || []).map((item) => (
                      <div key={item.label} className="analytics-pie-item">
                        <div className="analytics-pie-label">
                          <span className="analytics-pie-dot" />
                          {item.label}
                        </div>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </DashboardPanel>

                <DashboardPanel>
                  <Header
                    label="Revision"
                    icon={Lightbulb}
                    title="Recommended revision topics"
                    description="Topics that most likely need teacher follow-up or more reinforcement."
                  />
                  <div className="flex flex-wrap gap-2">
                    {(dashboardData?.recommendedRevisionTopics || []).map((item) => (
                      <span key={item} className="chatbot-topic-tag">
                        {item}
                      </span>
                    ))}
                  </div>
                </DashboardPanel>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <DashboardPanel>
                <Header
                  label="Weak Students"
                  icon={ShieldAlert}
                  title="Students needing attention"
                  description="Lowest current understanding averages and their weak topic areas."
                />
                <div className="analytics-table-wrap custom-scrollbar">
                  <table className="analytics-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Understanding</th>
                        <th>Weak Topics</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(dashboardData?.weakStudents || []).map((item) => (
                        <tr key={item.studentId}>
                          <td>{item.studentName}</td>
                          <td>{item.understandingScore}%</td>
                          <td>{(item.weakTopics || []).join(', ') || 'Stable'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </DashboardPanel>

              <DashboardPanel>
                <Header
                  label="Alerts"
                  icon={ShieldAlert}
                  title="Repeated query alerts"
                  description="Students who asked similar questions enough times to suggest teacher support is needed."
                />
                <div className="analytics-alert-stack">
                  {(dashboardData?.repeatedQueryAlerts || []).map((item) => (
                    <div key={item.id} className="analytics-alert-card">
                      <div className="analytics-alert-title">
                        {item.studentName} - {item.topic}
                      </div>
                      <div className="analytics-alert-copy">
                        Repeated question count: {item.repeatedQuestionCount}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(item.exampleQuestions || []).map((question) => (
                          <span key={question} className="chatbot-topic-tag">
                            {question}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TeacherAnalyticsDashboard;
