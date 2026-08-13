import axios from 'axios';

const API_BASE = 'http://localhost:8000/api/wristband';

export const saveWristbandConfig = async (payload) => {
  const response = await axios.post(`${API_BASE}/config`, payload);
  return response.data;
};

export const getWristbandConfig = async (studentId) => {
  const response = await axios.get(`${API_BASE}/config/${studentId}`);
  return response.data;
};

export const sendWristbandTest = async (payload) => {
  const response = await axios.post(`${API_BASE}/test`, payload);
  return response.data;
};

export const sendWristbandNotification = async (payload) => {
  const response = await axios.post(`${API_BASE}/notify`, payload);
  return response.data;
};

export const getWristbandHistory = async (studentId) => {
  const response = await axios.get(`${API_BASE}/history/${studentId}`);
  return response.data;
};

export const clearWristbandHistory = async (studentId) => {
  const response = await axios.delete(`${API_BASE}/history/${studentId}`);
  return response.data;
};

export const getWristbandDevice = async (studentId) => {
  const response = await axios.get(`${API_BASE}/device/${studentId}`);
  return response.data;
};
