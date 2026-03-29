import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const login = async (email, password) => {
  const res = await api.post("/api/auth/login", { email, password });
  return res.data;
};

export const getMeasurements = async (limit = 100) => {
  const res = await api.get(`/api/data?limit=${limit}`);
  return res.data;
};

export const getLatestMeasurement = async () => {
  const res = await api.get("/api/data/latest");
  return res.data;
};

export const getAlerts = async () => {
  const res = await api.get("/api/data/alerts");
  return res.data;
};

export const getGateways = async () => {
  const res = await api.get("/api/gateway");
  return res.data;
};

export const dismissAlert = async (id) => {
  const res = await api.patch(`/api/data/${id}/dismiss`);
  return res.data;
};

export default api;