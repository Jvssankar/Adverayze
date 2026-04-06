import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'https://adverayze.onrender.com';
const API = "https://adverayze.onrender.com/api/messages";

export const fetchMessages = (username) =>
  axios.get(`${API}?username=${username}`);

export const sendMessage = (username, content) =>
  axios.post(API, { username, content });

export const deleteForMe = (id, username) =>
  axios.delete(`${API}/${id}/me`, { data: { username } });

export const deleteForEveryone = (id) =>
  axios.delete(`${API}/${id}/everyone`);

export const togglePin = (id) =>
  axios.patch(`${API}/${id}/pin`);
