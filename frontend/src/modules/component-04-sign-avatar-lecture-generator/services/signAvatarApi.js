import axios from 'axios';

const SIGN_AVATAR_API_BASE = '/api/sign-avatar';
const SIGN_LECTURE_API_BASE = '/api/sign-lecture';

export const generateSignAvatar = async (payload) => {
  const response = await axios.post(`${SIGN_AVATAR_API_BASE}/generate`, payload);
  return response.data;
};

export const generateSignAvatarSequence = async (payload) => {
  const response = await axios.post(`${SIGN_AVATAR_API_BASE}/generate-sequence`, payload);
  return response.data;
};

export const getSignGestures = async () => {
  const response = await axios.get(`${SIGN_AVATAR_API_BASE}/gestures`);
  return response.data;
};

export const saveLearnedSignPattern = async (payload) => {
  const response = await axios.post(`${SIGN_AVATAR_API_BASE}/learned-patterns`, payload);
  return response.data;
};

export const getLearnedSignPatterns = async () => {
  const response = await axios.get(`${SIGN_AVATAR_API_BASE}/learned-patterns`);
  return response.data;
};

export const getSignAvatarHistory = async (studentId) => {
  const response = await axios.get(`${SIGN_AVATAR_API_BASE}/history/${studentId}`);
  return response.data;
};

export const clearSignAvatarHistory = async (studentId) => {
  const response = await axios.delete(`${SIGN_AVATAR_API_BASE}/history/${studentId}`);
  return response.data;
};

export const markMissedSignSegment = async (payload) => {
  const response = await axios.post(`${SIGN_AVATAR_API_BASE}/missed-segment`, payload);
  return response.data;
};

export const generateSignLecture = async (payload) => {
  const response = await axios.post(`${SIGN_LECTURE_API_BASE}/generate`, payload);
  return response.data;
};

export const getSignLecture = async (lectureId) => {
  const response = await axios.get(`${SIGN_LECTURE_API_BASE}/${lectureId}`);
  return response.data;
};

export const getSignLectureList = async (teacherId) => {
  const response = await axios.get(`${SIGN_LECTURE_API_BASE}/list/${teacherId}`);
  return response.data;
};

export const saveSignLecture = async (payload) => {
  const response = await axios.post(`${SIGN_LECTURE_API_BASE}/save`, payload);
  return response.data;
};

export const deleteSignLecture = async (lectureId) => {
  const response = await axios.delete(`${SIGN_LECTURE_API_BASE}/${lectureId}`);
  return response.data;
};

// ── Feature: ASL Fingerspelling Engine ──
export const getFingerspellingAlphabet = async () => {
  const response = await axios.get(`${SIGN_AVATAR_API_BASE}/fingerspelling/alphabet`);
  return response.data;
};

export const decomposeFingerspellingText = async (payload) => {
  const response = await axios.post(`${SIGN_AVATAR_API_BASE}/fingerspelling/decompose`, payload);
  return response.data;
};

