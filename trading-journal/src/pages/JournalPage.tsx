import JournalWorkspace from './JournalWorkspace'

type JournalPageProps = {
  userId: string
  userEmail: string
  onSignOut: () => Promise<void>
}

function JournalPage({ userId, userEmail, onSignOut }: JournalPageProps) {
  return <JournalWorkspace userId={userId} userEmail={userEmail} onSignOut={onSignOut} initialSection="log-trade" showStandaloneHeader={false} />
}

export default JournalPage
