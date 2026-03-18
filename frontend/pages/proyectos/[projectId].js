import { useRouter } from 'next/router'

import { ProjectDetailPage } from '@/features/projects/pages/ProjectDetailPage'

export default function ProjectDetailRoute() {
  const router = useRouter()
  const { projectId } = router.query
  const currentProjectId = Array.isArray(projectId) ? projectId[0] : projectId

  return <ProjectDetailPage projectId={currentProjectId} />
}