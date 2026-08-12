import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to inject token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("milkflow_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  ownerLogin: async (phone, passcode) => {
    const res = await apiClient.post("/auth/owner-login", { phone, passcode });
    if (res.data.token) {
      localStorage.setItem("milkflow_token", res.data.token);
      localStorage.setItem("milkflow_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },
  
  requestOtp: async (phone) => {
    const res = await apiClient.post("/auth/request-otp", { phone });
    return res.data;
  },

  verifyOtp: async (phone, otp) => {
    const res = await apiClient.post("/auth/verify-otp", { phone, otp });
    if (res.data.token) {
      localStorage.setItem("milkflow_token", res.data.token);
      localStorage.setItem("milkflow_user", JSON.stringify(res.data.user));
    }
    return res.data;
  },

  logout: () => {
    localStorage.removeItem("milkflow_token");
    localStorage.removeItem("milkflow_user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("milkflow_user");
    return userStr ? JSON.parse(userStr) : null;
  },
  
  getToken: () => {
    return localStorage.getItem("milkflow_token");
  }
};

export const userService = {
  getAll: async () => {
    const res = await apiClient.get("/users");
    return res.data;
  },

  getById: async (id) => {
    const res = await apiClient.get(`/users/${id}`);
    return res.data;
  },

  create: async (userData) => {
    const res = await apiClient.post("/users", userData);
    return res.data;
  },

  update: async (id, userData) => {
    const res = await apiClient.put(`/users/${id}`, userData);
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },
};

export const milkService = {
  getAll: async (params) => {
    const res = await apiClient.get("/milk", { params });
    return res.data;
  },

  create: async (recordData) => {
    const res = await apiClient.post("/milk", recordData);
    return res.data;
  },

  update: async (id, recordData) => {
    const res = await apiClient.put(`/milk/${id}`, recordData);
    return res.data;
  },

  delete: async (id) => {
    const res = await apiClient.delete(`/milk/${id}`);
    return res.data;
  },
};

export const paymentService = {
  getCycleSummary: async (personId, year, month) => {
    const res = await apiClient.get("/payments/cycle-summary", {
      params: { personId, year, month },
    });
    return res.data;
  },

  payCycle: async (paymentData) => {
    const res = await apiClient.post("/payments/pay", paymentData);
    return res.data;
  },

  unpayCycle: async (paymentData) => {
    const res = await apiClient.post("/payments/unpay", paymentData);
    return res.data;
  },
};

export default apiClient;
