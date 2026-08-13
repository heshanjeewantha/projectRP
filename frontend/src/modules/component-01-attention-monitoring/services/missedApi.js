import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const computeMissedSegments = async (userId, videoId, sessionId) => {
  const response = await axios.post(`${API_BASE}/missed/compute`, {
    user_id: userId,
    video_id: videoId,
    session_id: sessionId
  });
  return response.data;
};

export const getMissedSegments = async (userId, videoId) => {
  const response = await axios.get(`${API_BASE}/missed/${userId}/${videoId}`);
  return response.data;
};

export const getMissedHistory = async (userId) => {
  const response = await axios.get(`${API_BASE}/missed/history/${userId}`);
  return response.data;
};

export const markReviewed = async (docId) => {
  const response = await axios.patch(`${API_BASE}/missed/${docId}/reviewed`);
  return response.data;
};
