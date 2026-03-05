import { api } from "./axios";

export const exhibitorApi = {
  getPending: () => api.get("/exhibitors/pending"),
  getPendingAll: () => api.get("/exhibitors/pending-all"),
  approve: (id: string) => api.put(`/exhibitors/${id}/approve`),
  allocateBooth: (boothId: string, exhibitorId: string) =>
    api.put(`/exhibitors/booth/${boothId}/allocate`, { exhibitorId }),
  reserveBooth: (boothId: string) =>
    api.put(`/exhibitors/booth/${boothId}/reserve`),
  updateProfile: (data: {
    name?: string;
    company?: string;
    phone?: string;
    description?: string;
    productsServices?: string;
    avatar?: string;
  }) => api.put("/exhibitors/profile", data),
  getMyBooths: () => api.get("/exhibitors/my-booths"),
  updateMyBooth: (boothId: string, data: { description?: string; productsServices?: string; staffInfo?: string }) =>
    api.put(`/exhibitors/booth/${boothId}/update`, data),
};
