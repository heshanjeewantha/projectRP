const API_BASE_URL = 'http://localhost:8000/api/attention/admin';

export const getAdminUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) {
    throw new Error('Failed to fetch admin users');
  }
  const data = await response.json();
  return data.users || [];
};

export const getUserAttentionReport = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/report/${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch report for user ${userId}`);
  }
  return await response.json();
};
