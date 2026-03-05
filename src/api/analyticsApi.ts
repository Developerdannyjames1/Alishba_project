import { api } from "./axios";

export const analyticsApi = {
  getDashboard: () => api.get("/analytics/dashboard"),
};
