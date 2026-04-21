import axios from "axios";

/**
 * Centralized Axios instance.
 *
 * In production (EC2), set VITE_API_URL to your EC2 public IP:
 *   VITE_API_URL=http://<EC2-PUBLIC-IP>:5000
 *
 * In local development, leave VITE_API_URL unset and Vite's proxy
 * will forward /api → http://localhost:5000/api automatically.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach JWT token to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("lab_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
