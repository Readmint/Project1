// src/lib/api/editor.ts
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

const getAuthHeaders = async () => {
  // Replace with your real token getter (Firebase client)
  const token = typeof window !== 'undefined' ? localStorage.getItem('fb_token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchAssigned = async () => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/editor/assigned`, { headers });
  return res.data;
};

export const fetchArticleForEdit = async (id: string) => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/editor/${id}`, { headers });
  return res.data;
};

export const saveDraft = async (id: string, payload: any) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/editor/${id}/save`, payload, { headers });
  return res.data;
};

export const finalizeEdit = async (id: string, payload: any) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/editor/${id}/finalize`, payload, { headers });
  return res.data;
};

export const requestChanges = async (id: string, payload: any) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/editor/${id}/request-changes`, payload, { headers });
  return res.data;
};

export const approveArticle = async (id: string) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/editor/${id}/approve`, {}, { headers });
  return res.data;
};

export const fetchVersions = async (articleId: string) => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/editor/${articleId}/versions`, { headers });
  return res.data;
};

export const fetchVersion = async (versionId: string) => {
  const headers = await getAuthHeaders();
  const res = await axios.get(`${API_BASE}/editor/version/${versionId}`, { headers });
  return res.data;
};

export const restoreVersion = async (versionId: string, payload: any) => {
  const headers = await getAuthHeaders();
  const res = await axios.post(`${API_BASE}/editor/version/${versionId}/restore`, payload, { headers });
  return res.data;
};
