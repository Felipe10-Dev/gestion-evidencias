import { useRouter } from 'next/router'

import { CreateProjectTeamPage } from '@/features/projects/pages/CreateProjectTeamPage'

export default function CreateProjectTeamRoute() {
  const router = useRouter()
  const { projectId } = router.query
  const currentProjectId = Array.isArray(projectId) ? projectId[0] : projectId

  return <CreateProjectTeamPage projectId={currentProjectId} />
}
