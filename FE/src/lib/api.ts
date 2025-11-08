import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  assignedToId?: string;
  assignedTo?: User;
  createdById: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  assignedToId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: "pending" | "in_progress" | "completed";
  assignedToId?: string;
}

export const authApi = {
  login: (data: LoginDto) => apiClient.post("/auth/login", data),
  register: (data: RegisterDto) => apiClient.post("/auth/register", data),
};

export const usersApi = {
  getProfile: () => apiClient.get("/users/profile"),
  updateProfile: (data: Partial<User>) => apiClient.put("/users/profile", data),
  getAll: () => apiClient.get("/users/list"),
};

export const tasksApi = {
  getAll: () => apiClient.get<Task[]>("/tasks"),
  getOne: (id: string) => apiClient.get<Task>(`/tasks/${id}`),
  create: (data: CreateTaskDto) => apiClient.post<Task>("/tasks", data),
  update: (id: string, data: UpdateTaskDto) =>
    apiClient.patch<Task>(`/tasks/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
};
