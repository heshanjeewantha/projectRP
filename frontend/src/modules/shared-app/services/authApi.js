import axios from 'axios';

const API_HOST = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
const API_BASE = `http://${API_HOST}:8000/api/auth`;

export const signupUser = async (payload) => {
  const response = await axios.post(`${API_BASE}/signup`, payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await axios.post(`${API_BASE}/login`, payload);
  return response.data;
};
