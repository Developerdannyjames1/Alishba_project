import { api } from "./axios";

export const messageApi = {
  send: (data: { toUserId: string; expoId?: string; subject?: string; message: string }) =>
    api.post("/messages", data),
  getContacts: () => api.get("/messages/contacts"),
  getInbox: () => api.get("/messages/inbox"),
  getSent: () => api.get("/messages/sent"),
  markRead: (id: string) => api.put(`/messages/${id}/read`),
  getExpoOrganizer: (expoId: string) => api.get(`/messages/expo/${expoId}/organizer`),
  getExpoExhibitors: (expoId: string) => api.get(`/messages/expo/${expoId}/exhibitors`),
};
