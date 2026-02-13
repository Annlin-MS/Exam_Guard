import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const loginUser = async (username, password) => {
  const response = await api.post("/api/login/", {
    username,
    password,
  });

  return response.data;
};

export default api;
