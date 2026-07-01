import { useParams, useSearchParams } from 'react-router-dom'
import PlannerPage from './Planner'
import ChatView from './ChatView'

export default function AiPage() {
  const params = useParams<{ mode?: string }>()
  const [search] = useSearchParams()

  const chatMode = params.mode === 'chat'

  const pendingText = search.get('q')

  if (chatMode) {
    return (
      <div className="relative w-full h-full min-h-[100dvh] bg-bg">
        <ChatView pendingText={pendingText} />
      </div>
    )
  }

  return <PlannerPage />
}
