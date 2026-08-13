import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const getKnowledgeGraph = async () => {
  const response = await axios.get(`${API_BASE}/knowledge-graph`);
  return response.data;
};

export const getLessonTimeline = async (lessonId) => {
  const response = await axios.get(`${API_BASE}/lesson-timeline`, {
    params: { lessonId },
  });
  return response.data;
};

export const getPopupQuestion = async (studentId, lessonId, currentTime) => {
  const response = await axios.get(`${API_BASE}/popup-question`, {
    params: { studentId, lessonId, currentTime },
  });
  return response.data;
};

export const submitPopupAnswer = async (payload) => {
  const response = await axios.post(`${API_BASE}/submit-popup-answer`, payload);
  return response.data;
};

export const getStudentPopupAnswers = async (studentId) => {
  const response = await axios.get(`${API_BASE}/student-popup-answers/${studentId}`);
  return response.data;
};
