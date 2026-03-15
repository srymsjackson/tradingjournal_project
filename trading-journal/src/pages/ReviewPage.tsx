import JournalWorkspace from './JournalWorkspace'

type ReviewPageProps = {
  userId: string
  userEmail: string
  onSignOut: () => Promise<void>
}

function ReviewPage({ userId, userEmail, onSignOut }: ReviewPageProps) {
  return <JournalWorkspace userId={userId} userEmail={userEmail} onSignOut={onSignOut} initialSection="trade-history" showStandaloneHeader={false} />
}

export default ReviewPage
