import { api } from "./axios";

export const attendeeApi = {
  registerForExpo: (expoId: string) =>
    api.post(`/attendees/register/expo/${expoId}`),
  bookSession: (sessionId: string) =>
    api.post(`/attendees/register/session/${sessionId}`),
  getMyRegistrations: () => api.get("/attendees/registrations"),
};
