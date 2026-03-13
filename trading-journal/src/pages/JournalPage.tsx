import JournalWorkspace from './JournalWorkspace'

type JournalPageProps = {
  userId: string
}

function JournalPage({ userId }: JournalPageProps) {
  return <JournalWorkspace userId={userId} initialSection="log-trade" showStandaloneHeader={false} />
}

export default JournalPage
