import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartColumnBig, Clock3, ShieldAlert, ShieldCheck, UploadCloud, Video } from 'lucide-react';

import { getVideos } from '../../component-01-attention-monitoring/services/videoApi';
import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';
import AdminUpload from './AdminUpload';

const AdminDashboardPage = () => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadVideos = async () => {
      try {
        const data = await getVideos();
        if (isMounted) {
          setVideos(data || []);
        }
      } catch (error) {
        console.error('Failed to load admin dashboard videos', error);
      }
    };
    loadVideos();
    return () => {
      isMounted = false;
    };
  }, []);

  const readyCount = videos.filter((video) => video.status === 'ready').length;
  const processingCount = videos.filter((video) => video.status === 'processing').length;

  const stats = [
    {
      icon: Video,
      label: 'Uploaded Videos',
      value: videos.length,
      description: 'Lecture videos currently stored in the system.',
    },
    {
      icon: ShieldCheck,
      label: 'Ready Lessons',
      value: readyCount,
      description: 'Lessons that are already available for students.',
    },
    {
      icon: Clock3,
      label: 'Processing',
      value: processingCount,
      description: 'Videos still being prepared by the backend pipeline.',
    },
  ];

  return (
    <div className="dashboard-shell">
      <div className="dashboard-stack">
        <DashboardPanel className="dashboard-panel-hero">
          <Header
            label="Admin"
            icon={ChartColumnBig}
            title="Admin Dashboard"
            description="Manage lesson uploads, monitor content readiness, and control the academic content pipeline from one place."
          />

          <div className="dashboard-stat-grid mt-6">
            {stats.map((item) => (
              <div key={item.label} className="dashboard-stat-card">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <item.icon size={22} />
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  {item.label}
                </div>
                <div className="text-3xl font-black text-white">{item.value}</div>
                <p className="dashboard-text-wrap text-sm text-text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <DashboardPanel className="flex flex-col justify-between">
            <div>
              <Header
                label="Teacher View"
                icon={ChartColumnBig}
                title="Understanding analytics"
                description="Open the teacher dashboard to review topic-wise understanding, quiz progress, and revision recommendations."
              />
            </div>
            <div className="mt-6">
              <Link to="/admin/analytics" className="chatbot-inline-button is-primary w-full justify-center">
                Open analytics dashboard
              </Link>
            </div>
          </DashboardPanel>

          <DashboardPanel className="flex flex-col justify-between">
            <div>
              <Header
                label="Attention Monitoring"
                icon={ChartColumnBig}
                title="Attention Reports"
                description="Generate comprehensive engagement, drowsiness, phone usage, and fatigue reports for students."
              />
            </div>
            <div className="mt-6">
              <Link to="/admin/attention-reports" className="chatbot-inline-button is-primary w-full justify-center">
                Open Attention Reports
              </Link>
            </div>
          </DashboardPanel>

          <DashboardPanel className="flex flex-col justify-between">
            <div>
              <Header
                label="Intervention"
                icon={ShieldAlert}
                title="Repeated query alerts"
                description="Track students struggling with the same concept across multiple chatbot sessions."
              />
            </div>
            <div className="mt-6">
              <Link to="/admin/repeated-alerts" className="chatbot-inline-button w-full justify-center">
                Open alerts page
              </Link>
            </div>
          </DashboardPanel>
        </div>

        <DashboardPanel>
          <Header
            label="Upload"
            icon={UploadCloud}
            title="Lesson Upload Center"
            description="Upload a new lecture video and send it into the transcript, attention-aware, and popup-question pipeline."
          />
          <div className="mt-6">
            <AdminUpload embedded />
          </div>
        </DashboardPanel>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
