import { api } from "./axios";

export const bookmarkApi = {
  getMyBookmarks: () => api.get("/bookmarks"),
  bookmarkSession: (sessionId: string) => api.post(`/bookmarks/session/${sessionId}`),
  removeBookmark: (sessionId: string) => api.delete(`/bookmarks/session/${sessionId}`),
};
