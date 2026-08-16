import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/wristband';

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
