import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const uploadVideo = async (file, title) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  const response = await axios.post(`${API_BASE}/videos/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getVideos = async () => {
  const response = await axios.get(`${API_BASE}/videos`);
  return response.data;
};

export const getTranscript = async (videoId) => {
  const response = await axios.get(`${API_BASE}/transcripts/${videoId}`);
  return response.data;
};

export const convertSignVideoToTranscript = async (file, title) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title || 'Sign Language Video');

  const response = await axios.post(`${API_BASE}/videos/convert-sign-video`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const convertExistingVideo = async (videoId) => {
  const response = await axios.post(`${API_BASE}/videos/${videoId}/convert-transcript`);
  return response.data;
};
