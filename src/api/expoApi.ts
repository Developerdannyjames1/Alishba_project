import { api } from "./axios";

export interface Expo {
  _id: string;
  title: string;
  description?: string;
  date: string;
  endDate?: string;
  location: string;
  theme?: string;
  status: string;
  maxBooths?: number;
  maxAttendees?: number;
}

export const expoApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get("/expos", { params }),
  getOne: (id: string) => api.get(`/expos/${id}`),
  create: (data: Partial<Expo>) => api.post("/expos", data),
  update: (id: string, data: Partial<Expo>) => api.put(`/expos/${id}`, data),
  delete: (id: string) => api.delete(`/expos/${id}`),
  getBooths: (expoId: string) => api.get(`/expos/${expoId}/booths`),
  getSessions: (expoId: string) => api.get(`/expos/${expoId}/sessions`),
  createBooth: (expoId: string, data: object) =>
    api.post(`/expos/${expoId}/booths`, data),
  createBoothsBulk: (expoId: string, booths: object[]) =>
    api.post(`/expos/${expoId}/booths/bulk`, { booths }),
  updateBooth: (expoId: string, boothId: string, data: object) =>
    api.put(`/expos/${expoId}/booths/${boothId}`, data),
  deleteBooth: (expoId: string, boothId: string) =>
    api.delete(`/expos/${expoId}/booths/${boothId}`),
  createSession: (expoId: string, data: object) =>
    api.post(`/expos/${expoId}/sessions`, data),
  updateSession: (expoId: string, sessionId: string, data: object) =>
    api.put(`/expos/${expoId}/sessions/${sessionId}`, data),
  deleteSession: (expoId: string, sessionId: string) =>
    api.delete(`/expos/${expoId}/sessions/${sessionId}`),
};
