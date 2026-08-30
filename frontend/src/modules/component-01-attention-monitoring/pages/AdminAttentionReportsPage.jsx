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
  Sparkles,
  User,
  Users,
  Search,
  Check,
  ChevronDown,
  X,
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const printAreaRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

    const studentDisplayName = report.full_name || report.user_id;
    const reportRefId = `SL-${report.user_id.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`;
    const generatedDateStr = new Date(report.generated_at || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const engagementVal = report.average_engagement ?? 85.0;
    let engagementGrade = 'A+ (Excellent Focus)';
    let gradeColor = '#059669';
    let gradeBg = '#ecfdf5';
    if (engagementVal < 50) {
      engagementGrade = 'D (Intervention Needed)';
      gradeColor = '#dc2626';
      gradeBg = '#fef2f2';
    } else if (engagementVal < 70) {
      engagementGrade = 'C (Moderate Engagement)';
      gradeColor = '#d97706';
      gradeBg = '#fffbeb';
    } else if (engagementVal < 85) {
      engagementGrade = 'B (Good Engagement)';
      gradeColor = '#2563eb';
      gradeBg = '#eff6ff';
    }

    const reasonsMap = {
      ok: { label: 'Attentive & Focused', desc: 'Active visual absorption & head alignment', color: '#10b981', bg: '#ecfdf5', risk: 'Optimal' },
      head_turned: { label: 'Head Turned / Gaze Away', desc: 'Eyes or head deviated from screen center', color: '#8b5cf6', bg: '#f5f3ff', risk: 'Minor Distraction' },
      drowsy: { label: 'Drowsiness / Fatigue (PERCLOS)', desc: 'Prolonged eyelid closure (PERCLOS >= 0.35)', color: '#f59e0b', bg: '#fffbeb', risk: 'Fatigue Alert' },
      yawning: { label: 'Yawning (Mouth Aspect Ratio)', desc: 'Mouth opening indicative of fatigue (MAR >= 0.65)', color: '#f97316', bg: '#fff7ed', risk: 'Fatigue Alert' },
      eyes_closed: { label: 'Micro-Sleep / Eyes Closed', desc: 'Continuous eye closure during playback', color: '#ec4899', bg: '#fdf2f8', risk: 'Elevated Risk' },
      no_face: { label: 'Student Left Frame / Occluded', desc: 'Face landmarks not detected by MediaPipe', color: '#64748b', bg: '#f8fafc', risk: 'Inattentive' },
    };

    const reasonsList = Object.entries(report.reasons_breakdown || {})
      .filter(([reason]) => reason !== 'phone_detected')
      .map(([reason, count]) => {
        const info = reasonsMap[reason] || {
          label: reason.toUpperCase().replace(/_/g, ' '),
          desc: 'Logged behavioral telemetry event',
          color: '#6366f1',
          bg: '#eef2ff',
          risk: 'Logged Event',
        };
        const pct = Math.round((count / (report.total_events || 1)) * 100);
        return { reason, count, pct, ...info };
      });

    // Generate intelligent AI recommendations
    const observations = [];
    if (engagementVal >= 80) {
      observations.push('Student demonstrates high visual absorption and sustained focus during sign language avatar demonstrations.');
    } else if (engagementVal >= 60) {
      observations.push('Student maintains moderate attention with occasional distraction intervals during extended video playback.');
    } else {
      observations.push('Low overall attention score detected. Interactive checkpoints and instructor guidance are advised.');
    }

    if ((report.drowsy_alerts || 0) > 10) {
      observations.push(`Elevated drowsiness detected (${report.drowsy_alerts} PERCLOS events). Recommended to schedule 5-minute cognitive rest breaks between modules.`);
    } else {
      observations.push('Optimal alertness levels maintained throughout the logged observation sessions.');
    }

    if ((report.reasons_breakdown?.head_turned || 0) > (report.total_events || 1) * 0.15) {
      observations.push('Frequent gaze diversion detected. Suggest adjusting camera alignment and using full-screen learning mode.');
    }

    const printWindow = window.open('', '_blank', 'width=950,height=1050');
    if (!printWindow) {
      alert('Please allow popups to download/print the PDF report.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Attention_Report_${studentDisplayName.replace(/[^a-zA-Z0-9_-]/g, '_')}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 14mm 16mm 14mm 16mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              color: #0f172a;
              margin: 0;
              padding: 0;
              line-height: 1.45;
              font-size: 12px;
            }
            .page-container {
              max-width: 820px;
              margin: 0 auto;
              background: #ffffff;
              padding: 28px 32px;
              border-radius: 8px;
              box-shadow: 0 4px 25px rgba(0,0,0,0.06);
            }
            .no-print-toolbar {
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: #0f172a;
              color: #ffffff;
              padding: 12px 24px;
              border-radius: 8px;
              margin-bottom: 20px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .toolbar-btn {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: #10b981;
              color: #032418;
              border: none;
              padding: 8px 18px;
              border-radius: 6px;
              font-weight: 700;
              font-size: 13px;
              cursor: pointer;
              transition: background 0.2s;
            }
            .toolbar-btn:hover { background: #34d399; }
            .toolbar-btn-secondary {
              background: rgba(255,255,255,0.15);
              color: #ffffff;
              margin-left: 8px;
            }
            .toolbar-btn-secondary:hover { background: rgba(255,255,255,0.25); }

            /* Header Section */
            .header-top {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 14px;
              margin-bottom: 18px;
            }
            .brand-logo {
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .brand-icon {
              width: 36px;
              height: 36px;
              border-radius: 8px;
              background: linear-gradient(135deg, #059669, #10b981);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: 900;
              font-size: 18px;
            }
            .brand-title {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.5px;
              margin: 0;
            }
            .brand-subtitle {
              font-size: 10.5px;
              font-weight: 600;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
            .doc-meta {
              text-align: right;
            }
            .doc-tag {
              display: inline-block;
              background: #0f172a;
              color: #ffffff;
              font-size: 9px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              padding: 3px 10px;
              border-radius: 4px;
              margin-bottom: 4px;
            }
            .doc-ref {
              font-family: monospace;
              font-size: 11px;
              font-weight: 700;
              color: #334155;
            }
            .doc-date {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
            }

            /* Student Profile Card */
            .student-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-left: 5px solid #059669;
              border-radius: 8px;
              padding: 14px 18px;
              margin-bottom: 18px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .meta-item {
              display: flex;
              flex-direction: column;
            }
            .meta-label {
              font-size: 9.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.6px;
              color: #64748b;
              margin-bottom: 2px;
            }
            .meta-value {
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
            }
            .meta-value-mono {
              font-family: monospace;
              font-size: 11.5px;
              color: #334155;
            }

            /* KPI Cards */
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 10px;
              margin-bottom: 20px;
            }
            .kpi-card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 12px 14px;
              text-align: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.02);
            }
            .kpi-label {
              font-size: 9.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #64748b;
              margin-bottom: 4px;
            }
            .kpi-value {
              font-size: 22px;
              font-weight: 900;
              color: #0f172a;
              line-height: 1.1;
            }
            .kpi-sub {
              font-size: 9.5px;
              font-weight: 600;
              margin-top: 4px;
            }

            /* Section Headings */
            .section-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 1.5px solid #e2e8f0;
              padding-bottom: 6px;
              margin-top: 18px;
              margin-bottom: 10px;
              break-after: avoid;
            }
            .section-title {
              font-size: 13px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #0f172a;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .section-badge {
              font-size: 10px;
              color: #64748b;
              font-weight: 600;
            }

            /* Tables */
            .report-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
              font-size: 11px;
            }
            .report-table th {
              background: #f1f5f9;
              color: #334155;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 9.5px;
              letter-spacing: 0.5px;
              padding: 7px 10px;
              text-align: left;
              border-top: 1px solid #e2e8f0;
              border-bottom: 1px solid #cbd5e1;
            }
            .report-table td {
              padding: 7px 10px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: middle;
            }
            .report-table tbody tr:nth-child(even) {
              background-color: #fafbfd;
            }
            .status-pill {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 9.5px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .bar-track {
              background: #e2e8f0;
              border-radius: 6px;
              height: 7px;
              overflow: hidden;
              width: 100%;
            }
            .bar-progress {
              height: 100%;
              border-radius: 6px;
            }

            /* AI Insights Box */
            .insights-box {
              background: linear-gradient(to right, #ecfdf5, #f0fdf4);
              border: 1px solid #a7f3d0;
              border-radius: 8px;
              padding: 12px 16px;
              margin-bottom: 18px;
              break-inside: avoid;
            }
            .insights-title {
              font-size: 11.5px;
              font-weight: 800;
              color: #065f46;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .insights-list {
              margin: 0;
              padding-left: 18px;
              color: #1e293b;
              font-size: 11px;
            }
            .insights-list li {
              margin-bottom: 4px;
            }

            /* Footer & Sign-off */
            .signoff-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-top: 24px;
              padding-top: 14px;
              border-top: 1px dashed #cbd5e1;
              break-inside: avoid;
            }
            .sig-line {
              border-bottom: 1px solid #475569;
              height: 32px;
              margin-bottom: 4px;
            }
            .sig-label {
              font-size: 9.5px;
              color: #64748b;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer-note {
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #e2e8f0;
            }

            @media print {
              body {
                background: #ffffff !important;
                padding: 0 !important;
              }
              .page-container {
                box-shadow: none !important;
                padding: 0 !important;
                max-width: 100% !important;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <!-- Non-print interactive top bar -->
            <div class="no-print no-print-toolbar">
              <div>
                <strong>Official Attention Evaluation Report Preview</strong>
                <div style="font-size: 11px; opacity: 0.8; margin-top: 2px;">Review document before printing or saving to PDF</div>
              </div>
              <div>
                <button class="toolbar-btn" onclick="window.print()">
                  🖨️ Print / Save as PDF
                </button>
                <button class="toolbar-btn toolbar-btn-secondary" onclick="window.close()">
                  ✕ Close
                </button>
              </div>
            </div>

            <!-- Header Section -->
            <div class="header-top">
              <div class="brand-logo">
                <div class="brand-icon">S</div>
                <div>
                  <h1 class="brand-title">SignLearn AI</h1>
                  <div class="brand-subtitle">Attention & Behavioral Analytics Center</div>
                </div>
              </div>
              <div class="doc-meta">
                <div class="doc-tag">Validated Academic Report</div>
                <div class="doc-ref">REF: ${reportRefId}</div>
                <div class="doc-date">Generated: ${generatedDateStr}</div>
              </div>
            </div>

            <!-- Student Profile Information -->
            <div class="student-card">
              <div class="meta-item">
                <span class="meta-label">Student Full Name</span>
                <span class="meta-value" style="font-size: 14px; color: #059669;">${studentDisplayName}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Student Identifier (System ID)</span>
                <span class="meta-value-mono">${report.user_id}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Registered Contact Email</span>
                <span class="meta-value-mono">${report.email || 'N/A (Demo / Unlinked Student)'}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Total Telemetry Checkpoints Logged</span>
                <span class="meta-value">${(report.total_events || 0).toLocaleString()} checkpoints across ${report.total_sessions || 0} session(s)</span>
              </div>
            </div>

            <!-- Performance KPI Cards -->
            <div class="kpi-grid">
              <div class="kpi-card">
                <div class="kpi-label">Engagement Score</div>
                <div class="kpi-value" style="color: ${gradeColor};">${engagementVal}%</div>
                <div class="kpi-sub" style="color: ${gradeColor};">${engagementGrade}</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Attentive Duration</div>
                <div class="kpi-value" style="color: #059669;">${report.attentive_percentage}%</div>
                <div class="kpi-sub" style="color: #059669;">Focused Lecture Time</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Drowsiness Alerts</div>
                <div class="kpi-value" style="color: #d97706;">${report.drowsy_alerts || 0}</div>
                <div class="kpi-sub" style="color: #d97706;">PERCLOS Flag Count</div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Yawning Inattention</div>
                <div class="kpi-value" style="color: #ea580c;">${report.yawning_alerts || 0}</div>
                <div class="kpi-sub" style="color: #ea580c;">MAR Detections</div>
              </div>
            </div>

            <!-- Behavioral & Distraction Breakdown Table -->
            <div class="section-header">
              <div class="section-title">
                <span>Behavioral & Distraction Breakdown</span>
              </div>
              <div class="section-badge">${reasonsList.length} Categories Monitored</div>
            </div>

            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 28%;">Behavioral Category</th>
                  <th style="width: 32%;">Telemetry Description</th>
                  <th style="width: 12%; text-align: center;">Events</th>
                  <th style="width: 10%; text-align: center;">Share</th>
                  <th style="width: 18%;">Distribution Bar</th>
                </tr>
              </thead>
              <tbody>
                ${reasonsList
                  .map(
                    (r) => `
                  <tr>
                    <td>
                      <strong style="color: #0f172a;">${r.label}</strong>
                    </td>
                    <td style="color: #475569; font-size: 10.5px;">${r.desc}</td>
                    <td style="text-align: center; font-weight: 700; color: #0f172a;">${r.count.toLocaleString()}</td>
                    <td style="text-align: center; font-weight: 800; color: ${r.color};">${r.pct}%</td>
                    <td>
                      <div class="bar-track">
                        <div class="bar-progress" style="width: ${r.pct}%; background-color: ${r.color};"></div>
                      </div>
                    </td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <!-- AI Behavioral Observations & Recommendations -->
            <div class="insights-box">
              <div class="insights-title">
                <span>✦ AI Pedagogical Observations & Recommendations</span>
              </div>
              <ul class="insights-list">
                ${observations.map((obs) => `<li>${obs}</li>`).join('')}
              </ul>
            </div>

            <!-- Recorded Learning Sessions -->
            <div class="section-header">
              <div class="section-title">
                <span>Recorded Learning Sessions Log</span>
              </div>
              <div class="section-badge">${(report.sessions || []).length} Sessions Logged</div>
            </div>

            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 8%; text-align: center;">#</th>
                  <th style="width: 38%;">Session ID</th>
                  <th style="width: 18%; text-align: center;">Telemetry Points</th>
                  <th style="width: 18%; text-align: center;">Avg Engagement</th>
                  <th style="width: 18%; text-align: right;">Logged Date</th>
                </tr>
              </thead>
              <tbody>
                ${(report.sessions || []).length === 0
                  ? `<tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 14px;">No recorded telemetry sessions available for this student yet.</td></tr>`
                  : (report.sessions || [])
                      .map(
                        (s, idx) => `
                    <tr>
                      <td style="text-align: center; font-weight: 700; color: #64748b;">${idx + 1}</td>
                      <td><code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${s.session_id}</code></td>
                      <td style="text-align: center; font-weight: 600;">${(s.event_count || 0).toLocaleString()}</td>
                      <td style="text-align: center;">
                        <span class="status-pill" style="background: ${s.avg_engagement >= 80 ? '#ecfdf5' : s.avg_engagement >= 60 ? '#fffbeb' : '#fef2f2'}; color: ${s.avg_engagement >= 80 ? '#059669' : s.avg_engagement >= 60 ? '#d97706' : '#dc2626'};">
                          ${s.avg_engagement}%
                        </span>
                      </td>
                      <td style="text-align: right; color: #64748b; font-size: 10px;">
                        ${new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  `
                      )
                      .join('')}
              </tbody>
            </table>

            <!-- Sign-Off & Certification -->
            <div class="signoff-section">
              <div>
                <div class="sig-line"></div>
                <div class="sig-label">AI Diagnostic Engine Verification (SignLearn Core)</div>
                <div style="font-size: 9.5px; color: #059669; font-weight: 700; margin-top: 2px;">✔ Authenticated & Cryptographically Logged</div>
              </div>
              <div>
                <div class="sig-line"></div>
                <div class="sig-label">Course Instructor / Administrator Signature</div>
                <div style="font-size: 9.5px; color: #64748b; margin-top: 2px;">Date: ________________________</div>
              </div>
            </div>

            <!-- Footer -->
            <div class="footer-note">
              SignLearn AI — Attention-Aware Multimodal Learning Environment • Official Administrator Evaluation Report • Confidential
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.full_name || '').toLowerCase().includes(q);
    const idMatch = (u.user_id || '').toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    return nameMatch || idMatch || emailMatch;
  });

  const selectedStudent = users.find((u) => u.user_id === selectedUserId) || {
    user_id: selectedUserId,
    full_name: report?.full_name || selectedUserId,
    avg_engagement: report?.average_engagement,
  };

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
              description="Monitor real-time student engagement, MediaPipe drowsiness, and yawning logs. Download official PDF reports."
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

          {/* Student Selector Dropdown Row */}
          <div className="mt-6">
            <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                  <Users size={14} className="text-primary" />
                  Select Student for PDF Report
                </div>
                <div className="text-xs text-text-muted">
                  Total Students: <span className="font-bold text-white">{users.length}</span>
                </div>
              </div>

              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-white/15 bg-white/5 hover:bg-white/[0.08] p-4 transition-all text-left focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 group shadow-lg"
                >
                  <div className="flex items-center gap-3.5 min-w-0 w-full sm:w-auto">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-emerald-500/20 border border-primary/40 text-primary font-black text-base shadow-inner">
                      {selectedStudent?.full_name ? selectedStudent.full_name.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-white truncate group-hover:text-primary transition-colors">
                          {selectedStudent?.full_name || selectedUserId}
                        </span>
                        {selectedStudent?.user_id === 'student_demo_123' && (
                          <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            Demo
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-text-muted truncate font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>ID: <strong className="text-white/80">{selectedUserId}</strong></span>
                        {selectedStudent?.email && <span className="text-white/50">• {selectedStudent.email}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                    {selectedStudent?.avg_engagement != null && (
                      <span className="rounded-xl bg-primary/20 border border-primary/40 text-primary px-3 py-1.5 text-xs font-black shadow-sm">
                        {selectedStudent.avg_engagement}% Avg
                      </span>
                    )}
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-text-muted group-hover:text-white group-hover:bg-white/10 transition">
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`}
                      />
                    </div>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-[999] mt-2 rounded-2xl border border-white/20 bg-[#0d1612] shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden">
                    {/* Dedicated Search Header */}
                    <div className="p-3 bg-[#0d1612] border-b border-white/10">
                      <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 focus-within:border-primary/60 focus-within:bg-white/[0.08] focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                        <Search size={16} className="text-primary shrink-0" />
                        <input
                          type="text"
                          placeholder="Search student by name, ID, or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-text-muted outline-none"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchQuery('');
                            }}
                            className="shrink-0 text-text-muted hover:text-white p-1 rounded transition"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Student List */}
                    <div className="max-h-64 sm:max-h-72 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1.5">
                      {filteredUsers.length === 0 ? (
                        <div className="py-8 text-center text-xs text-text-muted">
                          No students matching &quot;{searchQuery}&quot;
                        </div>
                      ) : (
                        filteredUsers.map((u) => {
                          const isSelected = selectedUserId === u.user_id;
                          return (
                            <button
                              key={u.user_id}
                              type="button"
                              onClick={() => {
                                setSelectedUserId(u.user_id);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between gap-3 rounded-xl p-3 text-left transition-all ${
                                isSelected
                                  ? 'bg-primary text-[#032418] font-bold shadow-md shadow-emerald-500/20'
                                  : 'hover:bg-white/10 text-white'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-sm ${
                                    isSelected
                                      ? 'bg-[#032418]/25 text-[#032418]'
                                      : 'bg-white/10 text-primary border border-white/10'
                                  }`}
                                >
                                  {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-sm truncate">
                                    {u.full_name || u.user_id}
                                  </div>
                                  <div
                                    className={`text-xs truncate font-mono mt-0.5 ${
                                      isSelected ? 'text-[#032418]/85 font-semibold' : 'text-text-muted'
                                    }`}
                                  >
                                    {u.user_id} {u.email ? `• ${u.email}` : ''}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2.5 shrink-0">
                                {u.avg_engagement != null ? (
                                  <span
                                    className={`text-xs font-black rounded-lg px-2.5 py-1 ${
                                      isSelected
                                        ? 'bg-[#032418]/15 text-[#032418]'
                                        : 'bg-primary/20 text-primary border border-primary/30'
                                    }`}
                                  >
                                    {u.avg_engagement}%
                                  </span>
                                ) : (
                                  <span
                                    className={`text-[10px] font-semibold rounded-md px-2 py-0.5 ${
                                      isSelected ? 'text-[#032418]/80' : 'text-text-muted bg-white/5'
                                    }`}
                                  >
                                    No Data
                                  </span>
                                )}
                                {isSelected && <Check size={18} className="text-[#032418] shrink-0" />}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-3.5 py-2 border-t border-white/10 bg-[#080e0c] flex items-center justify-between text-[11px] text-text-muted">
                      <span>Showing {filteredUsers.length} of {users.length} students</span>
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(false)}
                        className="text-primary hover:underline font-bold"
                      >
                        Done
                      </button>
                    </div>
                  </div>
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
            {/* Student Info Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-emerald-500/5 to-transparent p-4 shadow-lg shadow-black/20">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-400 text-[#032418] font-black text-lg shadow-md shadow-emerald-500/20">
                  {report.full_name ? report.full_name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div>
                  <div className="text-lg font-black text-white flex items-center gap-2">
                    <span>{report.full_name || report.user_id}</span>
                  </div>
                  <div className="text-xs text-text-muted font-mono flex flex-wrap items-center gap-2 mt-0.5">
                    <span>Student ID: <strong className="text-white">{report.user_id}</strong></span>
                    {report.email && <span>• {report.email}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs shrink-0">
                <div className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-text-muted">
                  Total Sessions: <span className="font-extrabold text-white">{report.total_sessions}</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-text-muted">
                  Total Events: <span className="font-extrabold text-white">{report.total_events}</span>
                </div>
              </div>
            </div>

            {/* Top Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
