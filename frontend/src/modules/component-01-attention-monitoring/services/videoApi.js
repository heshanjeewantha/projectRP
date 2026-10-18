import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_ROOT || '/api').replace(/\/+$/, '');
const API_ORIGIN = /^https?:\/\//i.test(API_BASE) ? new URL(API_BASE).origin : '';

export const getVideoUrl = (video) => {
  const filename = video.filename || (video.storage_path ? video.storage_path.replace(/\\/g, '/').split('/').pop() : '');
  return `${API_ORIGIN}/uploads/${encodeURIComponent(filename)}`;
};

export const uploadVideo = async (file, title, syllabusMeta = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);
  if (syllabusMeta.grade) formData.append('grade', syllabusMeta.grade);
  if (syllabusMeta.unit_number) formData.append('unit_number', syllabusMeta.unit_number);
  if (syllabusMeta.unit_title) formData.append('unit_title', syllabusMeta.unit_title);
  if (syllabusMeta.topic) formData.append('topic', syllabusMeta.topic);
  if (syllabusMeta.difficulty) formData.append('difficulty', syllabusMeta.difficulty);

  const response = await axios.post(`${API_BASE}/videos/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getVideos = async (grade = null, unitNumber = null) => {
  const params = {};
  if (grade && grade !== 'ALL') params.grade = grade;
  if (unitNumber && unitNumber > 0) params.unit_number = unitNumber;
  const response = await axios.get(`${API_BASE}/videos`, { params });
  return response.data;
};

export const getSyllabusTaxonomy = async () => {
  const response = await axios.get(`${API_BASE}/videos/syllabus/taxonomy`);
  return response.data;
};

export const updateVideoSyllabus = async (videoId, syllabusData) => {
  const response = await axios.put(`${API_BASE}/videos/${videoId}/syllabus`, syllabusData);
  return response.data;
};

export const getTranscript = async (videoId) => {
  const response = await axios.get(`${API_BASE}/transcripts/${videoId}`);
  return response.data;
};

export const convertSignVideoToTranscript = async (file, title, syllabusMeta = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || 'Sign Language Video');
  if (syllabusMeta.grade) formData.append('grade', syllabusMeta.grade);
  if (syllabusMeta.unit_number) formData.append('unit_number', syllabusMeta.unit_number);
  if (syllabusMeta.unit_title) formData.append('unit_title', syllabusMeta.unit_title);
  if (syllabusMeta.topic) formData.append('topic', syllabusMeta.topic);

  const response = await axios.post(`${API_BASE}/videos/convert-sign-video`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const convertExistingVideo = async (videoId) => {
  const response = await axios.post(`${API_BASE}/videos/${videoId}/convert-transcript`);
  return response.data;
};
