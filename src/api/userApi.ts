import { api } from "./axios";

export interface UserEdit {
  name?: string;
  email?: string;
  role?: string;
  company?: string;
  phone?: string;
  isApproved?: boolean;
  description?: string;
  productsServices?: string;
}

export const userApi = {
  getUsers: (role?: string) =>
    api.get("/users", { params: role ? { role } : {} }),
  getUser: (id: string) => api.get(`/users/${id}`),
  updateUser: (id: string, data: UserEdit) => api.put(`/users/${id}`, data),
};
