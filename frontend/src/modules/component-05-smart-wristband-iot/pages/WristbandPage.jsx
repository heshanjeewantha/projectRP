import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BellRing,
  Cpu,
  Eraser,
  Save,
  Send,
  Settings2,
  SmartphoneCharging,
  Sparkles,
  Watch,
  Wifi,
} from 'lucide-react';

import useStore from '../../shared-app/utils/useStore';
import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';
import WristbandPreview from '../components/Wristband/WristbandPreview';
import {
  clearWristbandHistory,
  getWristbandConfig,
  getWristbandDevice,
  getWristbandHistory,
  saveWristbandConfig,
  sendWristbandTest,
} from '../services/wristbandApi';

const ALERT_PRESETS = [
  {
    alertType: 'Distraction Alert',
    vibrationPattern: 'Long Pulse',
    oledMessage: 'FOCUS BACK',
    intensity: 85,
    duration: 1000,
  },
  {
    alertType: 'Chatbot Reply',
    vibrationPattern: 'Double Pulse',
    oledMessage: 'CHAT REPLY',
    intensity: 60,
    duration: 550,
  },
  {
    alertType: 'Missed Lesson Segment',
    vibrationPattern: 'Short + Long',
    oledMessage: 'MISSED PART',
    intensity: 72,
    duration: 1100,
  },
  {
    alertType: 'Popup Question',
    vibrationPattern: 'Short Pulse',
    oledMessage: 'NEW QUESTION',
    intensity: 58,
    duration: 200,
  },
  {
    alertType: 'Exam Reminder',
    vibrationPattern: 'Repeated Pulse',
    oledMessage: 'EXAM TIP',
    intensity: 78,
    duration: 1400,
  },
  {
    alertType: 'Sign Avatar Replay',
    vibrationPattern: 'Emergency Pulse',
    oledMessage: 'REPLAY SIGN',
    intensity: 88,
    duration: 1800,
  },
  {
    alertType: 'Wrong Sign Alert',
    vibrationPattern: 'Repeated Pulse',
    oledMessage: 'WRONG SIGN',
    intensity: 90,
    duration: 1200,
  },
  {
    alertType: 'Sign Success Alert',
    vibrationPattern: 'Short Pulse',
    oledMessage: 'SIGN PASSED',
    intensity: 50,
    duration: 300,
  },
  {
    alertType: 'Sign Practice Reminder',
    vibrationPattern: 'Double Pulse',
    oledMessage: 'PRACTICE SIGN',
    intensity: 65,
    duration: 600,
  },
];

const VIBRATION_OPTIONS = [
  'Short Pulse',
  'Double Pulse',
  'Long Pulse',
  'Short + Long',
  'Repeated Pulse',
  'Emergency Pulse',
];

const DEFAULT_CONFIG = {
  deviceId: 'band-student_demo_123',
  alertType: 'Distraction Alert',
  vibrationPattern: 'Long Pulse',
  oledMessage: 'FOCUS BACK',
  intensity: 85,
  duration: 1000,
};

const formatTimestamp = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Just now' : date.toLocaleString();
};

const WristbandPage = () => {
  const { userId, attentionStatus } = useStore();

  const [device, setDevice] = useState(null);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [history, setHistory] = useState([]);
  const [pageNotice, setPageNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadWristbandData = async () => {
      const [configResult, deviceResult, historyResult] = await Promise.allSettled([
        getWristbandConfig(userId),
        getWristbandDevice(userId),
        getWristbandHistory(userId),
      ]);

      if (!mounted) return;

      if (configResult.status === 'fulfilled') {
        setConfig({
          deviceId: configResult.value.deviceId,
          alertType: configResult.value.alertType,
          vibrationPattern: configResult.value.vibrationPattern,
          oledMessage: configResult.value.oledMessage,
          intensity: configResult.value.intensity,
          duration: configResult.value.duration,
        });
      } else {
        setPageNotice('Backend wristband config is unavailable. You can still preview and prepare a local configuration.');
      }

      if (deviceResult.status === 'fulfilled') {
        setDevice(deviceResult.value);
      }

      if (historyResult.status === 'fulfilled') {
        setHistory(historyResult.value || []);
      }
    };

    loadWristbandData();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const derivedStatus = attentionStatus === 'not_attentive' ? 'Focus Trigger Ready' : 'Monitoring Calm';

  const handleAlertTypeChange = (alertType) => {
    const preset = ALERT_PRESETS.find((item) => item.alertType === alertType) || ALERT_PRESETS[0];
    setConfig((previous) => ({
      ...previous,
      alertType,
      vibrationPattern: preset.vibrationPattern,
      oledMessage: preset.oledMessage,
      intensity: preset.intensity,
      duration: preset.duration,
    }));
  };

  const handleSaveConfig = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const savedConfig = await saveWristbandConfig({
        studentId: userId,
        ...config,
      });
      setConfig({
        deviceId: savedConfig.deviceId,
        alertType: savedConfig.alertType,
        vibrationPattern: savedConfig.vibrationPattern,
        oledMessage: savedConfig.oledMessage,
        intensity: savedConfig.intensity,
        duration: savedConfig.duration,
      });
      setPageNotice('Wristband configuration saved successfully.');
      const refreshedHistory = await getWristbandHistory(userId);
      setHistory(refreshedHistory || []);
    } catch (error) {
      console.error('Failed to save wristband config', error);
      setPageNotice('Could not save the wristband configuration. The preview is still available locally.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestNotification = async () => {
    if (isTesting) return;
    setIsTesting(true);
    try {
      await sendWristbandTest({
        studentId: userId,
        ...config,
      });
      setPageNotice('Test notification sent to the wristband service.');
      const refreshedHistory = await getWristbandHistory(userId);
      setHistory(refreshedHistory || []);
    } catch (error) {
      console.error('Failed to send wristband test', error);
      setPageNotice('Backend test notification failed. The local wristband preview still reflects your current configuration.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearHistory = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await clearWristbandHistory(userId);
      setHistory([]);
      setPageNotice('Wristband event history cleared.');
    } catch (error) {
      console.error('Failed to clear wristband history', error);
      setPageNotice('Could not clear wristband history right now.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="dashboard-shell wristband-page-shell">
      <div className="dashboard-layout">
        <div className="dashboard-stack">
          <DashboardPanel className="dashboard-panel-hero">
            <Header
              label="Wristband"
              icon={Watch}
              title="Smart Haptic Wristband Configuration"
              description="Configure the SignLearn wristband so system alerts can trigger vibration patterns and OLED messages for distraction, popup, chatbot, and sign replay events."
            />

            <div className="mt-5 dashboard-chip-row flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="dashboard-chip">
                  <Wifi size={16} className="text-primary" />
                  Device: {device?.connectionStatus || 'connected'}
                </span>
                <span className="dashboard-chip">
                  <Activity size={16} className="text-primary" />
                  Attention Link: {derivedStatus}
                </span>
                <span className="dashboard-chip">
                  <Cpu size={16} className="text-primary" />
                  ESP32 + OLED + Haptic Motor
                </span>
              </div>

              <Link
                to="/sign-course"
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all"
              >
                <Sparkles size={14} />
                Launch ICT Sign Course & Camera
              </Link>
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <Header
              label="Preview"
              icon={SmartphoneCharging}
              title="3D Wristband Preview"
              description="Preview the OLED text on the device face and the active vibration pattern around the wristband before saving or testing the configuration."
            />

            {pageNotice && (
              <div className="mt-4 rounded-[18px] bg-primary/10 px-4 py-3 text-sm text-primary">
                {pageNotice}
              </div>
            )}

            <div className="wristband-preview-layout mt-6">
              <WristbandPreview
                oledMessage={config.oledMessage}
                vibrationPattern={config.vibrationPattern}
                connectionStatus={device?.connectionStatus || 'connected'}
                intensity={config.intensity}
              />

              <div className="wristband-preview-info-stack">
                <div className="wristband-preview-info-card wristband-oled-card">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    OLED Preview
                  </div>
                  <div className="mt-3 rounded-[18px] bg-[#07120d] px-4 py-5 text-center font-black tracking-[0.18em] text-primary">
                    {config.oledMessage}
                  </div>
                </div>

                <div className="wristband-preview-info-card">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    Active Pattern
                  </div>
                  <p className="mt-3 text-lg font-semibold text-white">{config.vibrationPattern}</p>
                  <p className="mt-2 text-sm text-text-muted">
                    Intensity {config.intensity}% for {config.duration} ms
                  </p>
                </div>

                <div className="wristband-preview-action-grid">
                  <button
                    onClick={handleTestNotification}
                    disabled={isTesting}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-primary px-5 py-3 text-sm font-semibold text-[#032418] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Send size={16} />
                    {isTesting ? 'Sending Test...' : 'Test Notification'}
                  </button>
                  <button
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save size={16} />
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </DashboardPanel>
        </div>

        <div className="dashboard-stack">
          <DashboardPanel>
            <Header
              label="Config"
              icon={Settings2}
              title="Alert Mapping"
              description="Choose the event type, vibration pattern, and OLED wording that should be sent to the student wristband."
            />

            <div className="mt-6 grid gap-4">
              <div className="wristband-config-card">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Alert Type
                </div>
                <div className="grid gap-3">
                  {ALERT_PRESETS.map((preset) => (
                    <button
                      key={preset.alertType}
                      onClick={() => handleAlertTypeChange(preset.alertType)}
                      className={`wristband-option-card ${config.alertType === preset.alertType ? 'is-active' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-white">{preset.alertType}</span>
                        <span className="rounded-full bg-white/[0.05] px-3 py-1 text-xs text-text-muted">
                          {preset.oledMessage}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-text-muted">{preset.vibrationPattern}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="wristband-config-card">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Vibration Pattern
                </div>
                <select
                  value={config.vibrationPattern}
                  onChange={(event) => setConfig((previous) => ({ ...previous, vibrationPattern: event.target.value }))}
                  className="w-full rounded-[16px] border border-white/[0.06] bg-[#0a1410] px-4 py-3 text-sm text-white outline-none"
                >
                  {VIBRATION_OPTIONS.map((pattern) => (
                    <option key={pattern} value={pattern}>
                      {pattern}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="wristband-config-card">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    OLED Message
                  </div>
                  <input
                    value={config.oledMessage}
                    onChange={(event) =>
                      setConfig((previous) => ({
                        ...previous,
                        oledMessage: event.target.value.toUpperCase().slice(0, 18),
                      }))
                    }
                    className="w-full rounded-[16px] border border-white/[0.06] bg-[#0a1410] px-4 py-3 text-sm tracking-[0.14em] text-white outline-none"
                  />
                </div>

                <div className="wristband-config-card">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    Device ID
                  </div>
                  <input
                    value={config.deviceId}
                    onChange={(event) => setConfig((previous) => ({ ...previous, deviceId: event.target.value }))}
                    className="w-full rounded-[16px] border border-white/[0.06] bg-[#0a1410] px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="wristband-config-card">
                  <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    <span>Intensity</span>
                    <span>{config.intensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={config.intensity}
                    onChange={(event) => setConfig((previous) => ({ ...previous, intensity: Number(event.target.value) }))}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </label>

                <label className="wristband-config-card">
                  <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                    <span>Duration</span>
                    <span>{config.duration} ms</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="5000"
                    step="50"
                    value={config.duration}
                    onChange={(event) => setConfig((previous) => ({ ...previous, duration: Number(event.target.value) }))}
                    className="w-full accent-[var(--color-primary)]"
                  />
                </label>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <Header
              label="Device"
              icon={Wifi}
              title={device?.deviceName || 'Smart Wristband'}
              description="Live summary of the configured wristband device and how it connects to the SignLearn notification flow."
            />

            <div className="mt-6 grid gap-4">
              <div className="wristband-device-card">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-white">Connection</span>
                  <span className={`wristband-status-pill ${device?.connectionStatus === 'connected' ? 'is-online' : ''}`}>
                    {device?.connectionStatus || 'connected'}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-text-muted">
                  <div>Device ID: <span className="text-white">{device?.deviceId || config.deviceId}</span></div>
                  <div>Battery: <span className="text-white">{device?.batteryLevel || 82}%</span></div>
                  <div>Firmware: <span className="text-white">{device?.firmwareVersion || '0.1.0-prototype'}</span></div>
                  <div>Last Seen: <span className="text-white">{formatTimestamp(device?.lastSeenAt)}</span></div>
                </div>
              </div>

              <div className="wristband-device-card">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                  Integration Examples
                </div>
                <ul className="mt-3 grid gap-2 text-sm text-text-muted">
                  <li className="dashboard-text-wrap">Distraction detection can trigger <span className="text-white">FOCUS BACK</span> with a long pulse.</li>
                  <li className="dashboard-text-wrap">Popup questions can trigger <span className="text-white">NEW QUESTION</span> with a short pulse.</li>
                  <li className="dashboard-text-wrap">Chatbot replies can trigger <span className="text-white">CHAT REPLY</span> with a double pulse.</li>
                  <li className="dashboard-text-wrap">Sign-avatar replay prompts can trigger <span className="text-white">REPLAY SIGN</span> with an emergency pulse.</li>
                </ul>
              </div>
            </div>
          </DashboardPanel>

          <DashboardPanel>
            <Header
              label="History"
              icon={BellRing}
              title="Event History"
              description="Saved config changes, test sends, and notification events for the current wristband device."
            />

            <div className="mt-6 overflow-hidden rounded-[20px] bg-black/18">
              <div className="custom-scrollbar overflow-x-auto">
                <table className="wristband-history-table">
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Alert</th>
                      <th>Pattern</th>
                      <th>OLED</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="wristband-history-empty">
                          No wristband event history is available yet.
                        </td>
                      </tr>
                    ) : (
                      history.slice(0, 12).map((event) => (
                        <tr key={event.id}>
                          <td>{event.eventType.replaceAll('_', ' ')}</td>
                          <td>{event.alertType || '-'}</td>
                          <td>{event.vibrationPattern || '-'}</td>
                          <td>{event.oledMessage || '-'}</td>
                          <td>
                            <span className={`wristband-status-pill ${event.status === 'queued' || event.status === 'saved' ? 'is-online' : ''}`}>
                              {event.status}
                            </span>
                          </td>
                          <td>{formatTimestamp(event.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              onClick={handleClearHistory}
              disabled={isClearing || history.length === 0}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-[16px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-medium text-danger transition hover:bg-danger/16 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Eraser size={16} />
              {isClearing ? 'Clearing...' : 'Clear History'}
            </button>
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
};

export default WristbandPage;
