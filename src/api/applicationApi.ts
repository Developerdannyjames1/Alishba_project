import { api } from "./axios";

export const applicationApi = {
  apply: (expoId: string, data: { companyName?: string; productsServices?: string; documents?: { name: string; url: string }[] }) =>
    api.post(`/applications/${expoId}`, data),
  getMyApplications: () => api.get("/applications/my"),
  getExpoApplications: (expoId: string) => api.get(`/applications/expo/${expoId}`),
  getAllPending: () => api.get("/applications/all-pending"),
  approve: (id: string) => api.put(`/applications/${id}/approve`),
  reject: (id: string, notes?: string) => api.put(`/applications/${id}/reject`, { notes }),
};
