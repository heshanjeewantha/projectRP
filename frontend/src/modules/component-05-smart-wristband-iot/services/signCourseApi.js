import axios from 'axios';

const API_HOST = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const API_BASE = `http://${API_HOST}:8000/api/wristband`;

export const getSignCourseModules = async () => {
  const response = await axios.get(`${API_BASE}/course/modules`);
  return response.data;
};

export const getStudentSignProgress = async (studentId) => {
  const response = await axios.get(`${API_BASE}/course/progress/${studentId}`);
  return response.data;
};

export const evaluateSignAttempt = async (payload) => {
  const response = await axios.post(`${API_BASE}/course/evaluate`, payload);
  return response.data;
};

export const completeCourseKeyword = async (payload) => {
  const response = await axios.post(`${API_BASE}/course/complete-keyword`, payload);
  return response.data;
};

export const resetSignCourseProgress = async (studentId) => {
  const response = await axios.post(`${API_BASE}/course/reset-progress`, { studentId });
  return response.data;
};

export const getSignLearningPlan = async (studentId, gradeFocus = 'ALL') => {
  const response = await axios.get(`${API_BASE}/course/learning-plan/${studentId}`, {
    params: { grade_focus: gradeFocus },
  });
  return response.data;
};

export const generateSignLearningPlan = async (payload) => {
  const response = await axios.post(`${API_BASE}/course/generate-plan`, payload);
  return response.data;
};

