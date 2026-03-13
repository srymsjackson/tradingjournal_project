import JournalWorkspace from './JournalWorkspace'

type DashboardPageProps = {
  userId: string
}

function DashboardPage({ userId }: DashboardPageProps) {
  return <JournalWorkspace userId={userId} initialSection="dashboard" showStandaloneHeader={false} />
}

export default DashboardPage
