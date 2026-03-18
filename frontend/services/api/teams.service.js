import { apiClient } from '@/services/api/client'

export const teamsService = {
  getAll: () => apiClient.get('/teams'),
  getById: (id) => apiClient.get(`/teams/${id}`),
  getByProject: (projectId) => apiClient.get(`/teams?projectId=${projectId}`),
  create: (nombre, projectId) => apiClient.post('/teams', { nombre, projectId }),
  update: (id, nombre) => apiClient.put(`/teams/${id}`, { nombre }),
  remove: (id) => apiClient.delete(`/teams/${id}`),
}