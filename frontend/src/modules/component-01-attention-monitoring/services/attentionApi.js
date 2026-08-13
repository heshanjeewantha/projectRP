import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const logAttentionBatch = async (userId, sessionId, videoId, events) => {
  const payload = {
    user_id: userId,
    session_id: sessionId,
    video_id: videoId,
    events: events,
  };
  const response = await axios.post(`${API_BASE}/attention/log`, payload);
  return response.data;
};
