import { apiClient } from '@/services/api/client'

export const projectsService = {
  getAll: () => apiClient.get('/projects'),
  getById: (projectId) => apiClient.get(`/projects/${projectId}`),
  create: (nombre, descripcion) =>
    apiClient.post('/projects', { nombre, descripcion }),
  update: (projectId, nombre, descripcion) =>
    apiClient.put(`/projects/${projectId}`, { nombre, descripcion }),
  remove: (projectId) => apiClient.delete(`/projects/${projectId}`),
}