import axios from 'axios';

const API_ROOT = import.meta.env.VITE_API_ROOT || '/api';
const API_BASE = `${API_ROOT}/chatbot`;
const REINFORCEMENT_BASE = `${API_ROOT}/reinforcement`;
const CONCEPT_BASE = `${API_ROOT}/concept`;
const REPEATED_QUERY_BASE = `${API_ROOT}/repeated-query`;
const TEACHER_BASE = `${API_ROOT}/teacher`;
const ANALYTICS_BASE = `${API_ROOT}/analytics`;

export const askChatbot = async (payload) => {
  const response = await axios.post(`${API_BASE}/ask`, payload);
  return response.data;
};

export const getMicroChallenge = async (payload) => {
  const response = await axios.post(`${API_BASE}/micro-challenge`, payload);
  return response.data;
};

export const checkMicroChallenge = async (payload) => {
  const response = await axios.post(`${API_BASE}/check-challenge`, payload);
  return response.data;
};

export const getChatbotHistory = async (studentId) => {
  const response = await axios.get(`${API_BASE}/history/${studentId}`);
  return response.data;
};

export const clearChatbotHistory = async (studentId) => {
  const response = await axios.delete(`${API_BASE}/history/${studentId}`);
  return response.data;
};

export const getChatbotTopics = async () => {
  const response = await axios.get(`${API_BASE}/topics`);
  return response.data;
};

export const getLessonSummary = async (topicId) => {
  const response = await axios.get(`${API_BASE}/lesson-summary/${topicId}`);
  return response.data;
};

export const getLoginQuiz = async (studentId) => {
  const response = await axios.get(`${REINFORCEMENT_BASE}/login-quiz/${studentId}`);
  return response.data;
};

export const submitLoginQuiz = async (payload) => {
  const response = await axios.post(`${REINFORCEMENT_BASE}/submit-quiz`, payload);
  return response.data;
};

export const checkConceptReentry = async (payload) => {
  const response = await axios.post(`${CONCEPT_BASE}/reentry-check`, payload);
  return response.data;
};

export const checkRepeatedQuery = async (payload) => {
  const response = await axios.post(`${REPEATED_QUERY_BASE}/check`, payload);
  return response.data;
};

export const getRepeatedQueryAlerts = async () => {
  const response = await axios.get(`${TEACHER_BASE}/repeated-query-alerts`);
  return response.data;
};

export const getStudentAnalytics = async (studentId) => {
  const response = await axios.get(`${ANALYTICS_BASE}/student/${studentId}`);
  return response.data;
};

export const getTopicAnalytics = async (topicId) => {
  const response = await axios.get(`${ANALYTICS_BASE}/topic/${topicId}`);
  return response.data;
};

export const getTeacherDashboard = async () => {
  const response = await axios.get(`${ANALYTICS_BASE}/teacher-dashboard`);
  return response.data;
};

export const downloadAnalyticsReport = async ({ format = 'pdf', studentId, topicId } = {}) => {
  const response = await axios.get(`${ANALYTICS_BASE}/download-report`, {
    params: {
      format,
      studentId,
      topicId,
    },
    responseType: 'blob',
  });

  return {
    blob: response.data,
    filename:
      response.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '') ||
      `analytics-report.${format === 'csv' ? 'csv' : 'pdf'}`,
  };
};

export const getAttentionRecommendations = async (studentId) => {
  const response = await axios.get(`${API_BASE}/attention-recommendations/${studentId}`);
  return response.data;
};

export const getShortNotes = async (topicId) => {
  const response = await axios.get(`${API_BASE}/short-notes/${topicId}`);
  return response.data;
};

export const getKnowledgeGrowth = async (studentId) => {
  const response = await axios.get(`${API_BASE}/knowledge-growth/${studentId}`);
  return response.data;
};

// ── Feature 1: Past Paper Grader ──
export const getPastPaperQuestions = async (topicId) => {
  const url = topicId ? `${API_BASE}/past-paper/questions?topicId=${encodeURIComponent(topicId)}` : `${API_BASE}/past-paper/questions`;
  const response = await axios.get(url);
  return response.data;
};

export const evaluatePastPaperAnswer = async (payload) => {
  const response = await axios.post(`${API_BASE}/past-paper/evaluate`, payload);
  return response.data;
};

// ── Feature 2: Flashcards SM-2 ──
export const getFlashcards = async (topicId, studentId = 'student_demo_123') => {
  const response = await axios.get(`${API_BASE}/flashcards/${topicId}?studentId=${studentId}`);
  return response.data;
};

export const reviewFlashcard = async (payload) => {
  const response = await axios.post(`${API_BASE}/flashcards/review`, payload);
  return response.data;
};

// ── Feature 5: Mock Exam Simulator ──
export const startMockExam = async (studentId = 'student_demo_123', topicId = null) => {
  const url = topicId
    ? `${API_BASE}/mock-exam/start?studentId=${encodeURIComponent(studentId)}&topicId=${encodeURIComponent(topicId)}`
    : `${API_BASE}/mock-exam/start?studentId=${encodeURIComponent(studentId)}`;
  const response = await axios.get(url);
  return response.data;
};


export const submitMockExam = async (payload) => {
  const response = await axios.post(`${API_BASE}/mock-exam/submit`, payload);
  return response.data;
};


