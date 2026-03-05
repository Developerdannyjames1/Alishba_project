import { api } from "./axios";

export const feedbackApi = {
  submit: (data: { type?: string; subject?: string; message: string; email?: string }) =>
    api.post("/feedback", data),
  submitSessionFeedback: (data: { sessionId: string; message: string }) =>
    api.post("/feedback/session", data),
  getAll: () => api.get("/feedback"),
};
