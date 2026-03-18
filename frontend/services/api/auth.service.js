import { apiClient } from '@/services/api/client'

export const authService = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  register: (nombre, email, password, rol) =>
    apiClient.post('/auth/register', { nombre, email, password, rol }),
  getUsers: () => apiClient.get('/auth/users'),
  updateUser: (id, payload) => apiClient.put(`/auth/users/${id}`, payload),
  removeUser: (id) => apiClient.delete(`/auth/users/${id}`),
}