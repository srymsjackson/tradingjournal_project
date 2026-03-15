import JournalWorkspace from './JournalWorkspace'

type DashboardPageProps = {
  userId: string
  userEmail: string
  onSignOut: () => Promise<void>
}

function DashboardPage({ userId, userEmail, onSignOut }: DashboardPageProps) {
  return <JournalWorkspace userId={userId} userEmail={userEmail} onSignOut={onSignOut} initialSection="dashboard" showStandaloneHeader={false} />
}

export default DashboardPage
