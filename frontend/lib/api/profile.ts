// src/lib/api/profile.ts
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

const getAuthHeaders = async () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('fb_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getProfile = async () => {
  const headers = await getAuthHeaders();
  const r = await axios.get(`${API_BASE}/editor/profile`, { headers });
  return r.data;
};

export const saveProfile = async (payload: any) => {
  const headers = await getAuthHeaders();
  const r = await axios.post(`${API_BASE}/editor/profile`, payload, { headers });
  return r.data;
};
