import { apiClient } from '@/services/api/client'

export const evidencesService = {
  getDriveImageCount: () => apiClient.get('/evidences/drive-image-count'),
  getDriveTree: () => apiClient.get('/evidences/drive-tree'),
  createTeamSubfolder: (teamId, nombre) =>
    apiClient.post(`/evidences/team/${teamId}/subfolders`, { nombre }),
  removeFolder: (folderId) => apiClient.delete(`/evidences/folders/${folderId}`),
}