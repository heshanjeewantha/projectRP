import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Award,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  Moon,
  Printer,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  Users,
  Search,
  Check,
} from 'lucide-react';

import { getAdminUsers, getUserAttentionReport } from '../services/adminReportApi';
import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';

const AdminAttentionReportsPage = () => {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('student_demo_123');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const printAreaRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const fetchUsers = async () => {
      try {
        const list = await getAdminUsers();
        if (isMounted) {
          setUsers(list || []);
          if (list.length > 0) {
            setSelectedUserId(list[0].user_id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch admin users:', err);
      }
    };
    fetchUsers();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUserId) return;
    let isMounted = true;
    setLoading(true);

    const fetchReport = async () => {
      try {
        const data = await getUserAttentionReport(selectedUserId);
        if (isMounted) {
          setReport(data);
        }
      } catch (err) {
        console.error('Failed to load user report:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [selectedUserId]);

  const handleDownloadPDF = () => {
    if (!report) return;

    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) {
      alert('Please allow popups to download/print the PDF report.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attention_Report_${report.user_id}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #ffffff; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
            .header { border-bottom: 3px solid #6366f1; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; }
            .subtitle { font-size: 13px; color: #64748b; margin-top: 4px; }
            .badge { background: #e0e7ff; color: #4338ca; font-weight: 700; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
            .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
            .card { background: #f8fafc; border: 1fr solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; }
            .card-val { font-size: 26px; font-weight: 800; color: #0f172a; margin-top: 5px; }
            .card-lbl { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
            .section-title { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 15px; border-left: 4px solid #6366f1; padding-left: 10px; }
            .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .table th, .table td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .table th { background: #f1f5f9; font-weight: 700; color: #475569; }
            .bar-bg { background: #e2e8f0; border-radius: 10px; height: 10px; overflow: hidden; margin-top: 4px; }
            .bar-fill { height: 100%; border-radius: 10px; }
            .footer { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Student Attention Full Report</h1>
              <div class="subtitle">Generated on ${new Date(report.generated_at).toLocaleString()}</div>
            </div>
            <div class="badge">Student: ${report.user_id}</div>
          </div>

          <div class="grid">
            <div class="card">
              <div class="card-lbl">Overall Engagement</div>
              <div class="card-val" style="color: #4338ca;">${report.average_engagement}%</div>
            </div>
            <div class="card">
              <div class="card-lbl">Attentive Time</div>
              <div class="card-val" style="color: #16a34a;">${report.attentive_percentage}%</div>
            </div>
            <div class="card">
              <div class="card-lbl">Drowsy Alerts</div>
              <div class="card-val" style="color: #d97706;">${report.drowsy_alerts}</div>
            </div>
            <div class="card">
              <div class="card-lbl">Phone Usage</div>
              <div class="card-val" style="color: #dc2626;">${report.phone_detections}</div>
            </div>
          </div>

          <div class="section-title">Distraction Breakdown</div>
          <table class="table">
            <thead>
              <tr>
                <th>Behavior Category</th>
                <th>Events Logged</th>
                <th>Percentage</th>
                <th>Distribution Bar</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(report.reasons_breakdown || {})
                .map(([reason, count]) => {
                  const pct = Math.round((count / (report.total_events || 1)) * 100);
                  const color =
                    reason === 'ok'
                      ? '#16a34a'
                      : reason === 'drowsy'
                      ? '#d97706'
                      : reason === 'phone_detected'
                      ? '#dc2626'
                      : '#6366f1';
                  return `
                  <tr>
                    <td><strong>${reason.toUpperCase().replace('_', ' ')}</strong></td>
                    <td>${count}</td>
                    <td>${pct}%</td>
                    <td style="width: 40%;">
                      <div class="bar-bg">
                        <div class="bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
                      </div>
                    </td>
                  </tr>
                `;
                })
                .join('')}
            </tbody>
          </table>

          <div class="section-title">Recorded Sessions</div>
          <table class="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Session ID</th>
                <th>Events Checkpoints</th>
                <th>Average Engagement</th>
                <th>Created Timestamp</th>
              </tr>
            </thead>
            <tbody>
              ${(report.sessions || [])
                .map(
                  (s, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><code>${s.session_id}</code></td>
                  <td>${s.event_count}</td>
                  <td><strong>${s.avg_engagement}%</strong></td>
                  <td>${new Date(s.created_at).toLocaleString()}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <div class="footer">
            Attention-Aware Sign Language AI Learning System — Official Admin Evaluation Report
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredUsers = users.filter((u) =>
    u.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const reasons = report?.reasons_breakdown || {};
  const totalEvts = report?.total_events || 1;

  return (
    <div className="dashboard-shell">
      <div className="dashboard-stack">
        <DashboardPanel className="dashboard-panel-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <Header
              label="Admin Attention Center"
              icon={ShieldCheck}
              title="Student Attention & Behavioral Reports"
              description="Monitor real-time student engagement, MediaPipe drowsiness, yawning, and phone detection logs. Download official PDF reports."
            />
            {report && (
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="self-start lg:self-center flex items-center justify-center gap-2.5 rounded-2xl bg-[linear-gradient(135deg,var(--color-primary),var(--color-accent))] px-6 py-3.5 text-sm font-extrabold text-[#032418] shadow-lg shadow-emerald-500/10 transition-all hover:bg-primary-hover hover:scale-[1.02] active:scale-[0.98]"
              >
                <Printer size={18} />
                <span>Download PDF Report</span>
              </button>
            )}
          </div>

          {/* Student Selector Row */}
          <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(240px,1fr)_minmax(0,2fr)]">
            <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2.5">
                <Search size={14} />
                Search Student
              </div>
              <input
                type="text"
                placeholder="Filter student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-text-muted outline-none transition focus:border-primary/50 focus:bg-white/[0.08]"
              />
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-black/30 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted mb-2.5">
                <Users size={14} />
                Select Student for PDF Report
              </div>
              <div className="flex flex-wrap items-center gap-2 max-h-28 overflow-y-auto pr-1 custom-scrollbar">
                {filteredUsers.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => setSelectedUserId('student_demo_123')}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-2 ${
                      selectedUserId === 'student_demo_123'
                        ? 'bg-primary text-[#032418] shadow-md'
                        : 'border border-white/10 bg-white/5 text-text-muted hover:bg-white/10'
                    }`}
                  >
                    <Check size={12} />
                    student_demo_123 (Demo)
                  </button>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.user_id}
                      type="button"
                      onClick={() => setSelectedUserId(u.user_id)}
                      className={`rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                        selectedUserId === u.user_id
                          ? 'bg-primary text-[#032418] shadow-md font-extrabold'
                          : 'border border-white/10 bg-white/5 text-text-muted hover:border-white/20 hover:text-white'
                      }`}
                    >
                      {selectedUserId === u.user_id && <Check size={12} />}
                      <span>{u.user_id}</span>
                      {u.avg_engagement != null && (
                        <span className="opacity-80">({u.avg_engagement}%)</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </DashboardPanel>

        {loading ? (
          <DashboardPanel className="p-16 text-center text-text-muted">
            <Activity size={32} className="mx-auto mb-3 animate-spin text-primary opacity-70" />
            <p className="text-sm font-semibold text-white">Synthesizing Attention Report...</p>
          </DashboardPanel>
        ) : report ? (
          <div className="grid gap-6" ref={printAreaRef}>
            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DashboardPanel className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                    <Award size={16} />
                    Engagement
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white">{report.average_engagement}%</div>
                </div>
                <div className="text-xs text-text-muted mt-3">Average attention score</div>
              </DashboardPanel>

              <DashboardPanel className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    <CheckCircle size={16} />
                    Attentive Time
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white">{report.attentive_percentage}%</div>
                </div>
                <div className="text-xs text-text-muted mt-3">Focused lecture duration</div>
              </DashboardPanel>

              <DashboardPanel className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                    <Moon size={16} />
                    Drowsiness Alerts
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white">{report.drowsy_alerts}</div>
                </div>
                <div className="text-xs text-text-muted mt-3">Total PERCLOS alerts</div>
              </DashboardPanel>

              <DashboardPanel className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                    <Smartphone size={16} />
                    Phone Detections
                  </div>
                  <div className="text-3xl sm:text-4xl font-black text-white">{report.phone_detections}</div>
                </div>
                <div className="text-xs text-text-muted mt-3">MediaPipe spatial detections</div>
              </DashboardPanel>
            </div>

            {/* Breakdown & Session Log Layout */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Reasons Breakdown */}
              <DashboardPanel>
                <Header
                  label="Behavioral Breakdown"
                  icon={Activity}
                  title="Distraction Reasons"
                  description="Detailed distribution across detected student behaviors."
                />
                <div className="mt-6 flex flex-col gap-4">
                  {[
                    { label: 'Attentive (Focused)', count: reasons.ok || 0, color: '#5fbf97' },
                    { label: 'Looking Away / Head Turned', count: reasons.head_turned || 0, color: '#a78bfa' },
                    { label: 'Drowsy / Sleepy (PERCLOS)', count: reasons.drowsy || 0, color: '#f59e0b' },
                    { label: 'Yawning (MAR)', count: reasons.yawning || 0, color: '#fb923c' },
                    { label: 'Phone in Hand', count: reasons.phone_detected || 0, color: '#ef4444' },
                    { label: 'Eyes Closed', count: reasons.eyes_closed || 0, color: '#e879f9' },
                    { label: 'No Face Visible', count: reasons.no_face || 0, color: '#94a3b8' },
                  ].map((item) => {
                    const pct = Math.round((item.count / totalEvts) * 100);
                    return (
                      <div key={item.label} className="group">
                        <div className="flex justify-between text-xs font-semibold mb-1.5">
                          <span className="text-text-muted group-hover:text-white transition">
                            {item.label}
                          </span>
                          <span style={{ color: item.color }} className="font-bold">
                            {item.count} events ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </DashboardPanel>

              {/* Sessions List */}
              <DashboardPanel>
                <Header
                  label="History Log"
                  icon={Eye}
                  title="Recorded Student Sessions"
                  description="All attention tracking sessions logged for this student."
                />
                <div className="mt-6 flex flex-col gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                  {(report.sessions || []).map((s, idx) => (
                    <div
                      key={s.session_id || idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/[0.06] bg-black/30 p-4 transition hover:border-primary/30 group gap-3"
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2 group-hover:text-primary transition">
                          <User size={14} className="text-primary" />
                          Session #{idx + 1}
                        </div>
                        <div className="text-[11px] text-text-muted mt-1 font-mono break-all">
                          ID: {s.session_id} | Checkpoints: {s.event_count}
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-base font-black text-primary">{s.avg_engagement}%</div>
                        <div className="text-[10px] uppercase tracking-wider text-text-muted">Avg Engagement</div>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminAttentionReportsPage;
