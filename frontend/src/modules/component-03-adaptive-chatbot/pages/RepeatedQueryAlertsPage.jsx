import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

import { getRepeatedQueryAlerts } from '../services/chatbotApi';
import DashboardPanel from '../../../components/layout/Dashboard/DashboardPanel';
import Header from '../../../components/layout/Dashboard/Header';

const RepeatedQueryAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadAlerts = async () => {
      setIsLoading(true);
      try {
        const response = await getRepeatedQueryAlerts();
        if (isMounted) {
          setAlerts(response || []);
        }
      } catch (error) {
        console.error('Failed to load repeated query alerts', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="dashboard-shell">
      <div className="dashboard-stack">
        <DashboardPanel className="dashboard-panel-hero">
          <Header
            label="Alerts"
            icon={ShieldAlert}
            title="Repeated query alerts"
            description="Students who are revisiting the same concept repeatedly are listed here so teachers can step in with support."
          />
        </DashboardPanel>

        <DashboardPanel>
          {isLoading ? (
            <div className="text-sm text-text-muted">Loading alerts...</div>
          ) : alerts.length === 0 ? (
            <div className="text-sm text-text-muted">No repeated query alerts yet.</div>
          ) : (
            <div className="analytics-table-wrap custom-scrollbar">
              <table className="analytics-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Topic</th>
                    <th>Count</th>
                    <th>Example Questions</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.studentName}</td>
                      <td>{alert.topic}</td>
                      <td>{alert.repeatedQuestionCount}</td>
                      <td>{(alert.exampleQuestions || []).join(' | ')}</td>
                      <td>{alert.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
};

export default RepeatedQueryAlertsPage;
