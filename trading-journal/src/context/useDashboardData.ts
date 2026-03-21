import { useContext } from 'react'
import { DashboardDataContext } from './dashboardDataContextObject'

export const useDashboardData = () => {
  const context = useContext(DashboardDataContext)
  if (!context) {
    throw new Error('useDashboardData must be used inside DashboardDataProvider')
  }
  return context
}
