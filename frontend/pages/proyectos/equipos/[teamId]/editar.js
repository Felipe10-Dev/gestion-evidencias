import { useRouter } from 'next/router'
import { EditTeamPage } from '@/features/projects/pages/EditTeamPage'

export default function EditTeamRoute() {
  const router = useRouter()
  const { teamId, projectId } = router.query

  if (!router.isReady) return null

  return <EditTeamPage teamId={teamId} projectId={projectId} />
}
