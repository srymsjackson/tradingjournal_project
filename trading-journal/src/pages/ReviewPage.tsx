import JournalWorkspace from './JournalWorkspace'

type ReviewPageProps = {
  userId: string
}

function ReviewPage({ userId }: ReviewPageProps) {
  return <JournalWorkspace userId={userId} initialSection="trade-history" showStandaloneHeader={false} />
}

export default ReviewPage
