import { useRouter } from 'next/router'

import { EditProjectPage } from '@/features/projects/pages/EditProjectPage'

export default function EditProjectRoute() {
  const router = useRouter()
  const { projectId } = router.query
  const currentProjectId = Array.isArray(projectId) ? projectId[0] : projectId

  return <EditProjectPage projectId={currentProjectId} />
}