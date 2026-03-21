export type PropAccountRecord = {
  id: string
  userId: string
  accountName: string
  firm: string
  accountSize: number
  startingBalance: number
  currentBalance: number
  trailingDrawdownType: string
  maxDrawdown: number
  dailyLossLimit: number
  profitTarget: number
  minPayoutDays: number
  payoutProfitDayThreshold: number
  payoutDaysCompleted: number
  status: 'ACTIVE' | 'PAUSED' | 'PASSED' | 'FAILED'
  createdAt: string
  updatedAt: string
}

export type PropAccountInput = Omit<PropAccountRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>

export const emptyPropAccountInput = (): PropAccountInput => ({
  accountName: '',
  firm: '',
  accountSize: 50000,
  startingBalance: 50000,
  currentBalance: 50000,
  trailingDrawdownType: 'EOD',
  maxDrawdown: 2500,
  dailyLossLimit: 1000,
  profitTarget: 3000,
  minPayoutDays: 10,
  payoutProfitDayThreshold: 150,
  payoutDaysCompleted: 0,
  status: 'ACTIVE',
})

export type PropDerived = {
  distanceToDrawdown: number
  amountToTarget: number
  payoutEligibilityProgress: number
  safetyBuffer: number
  mode: 'DEFENSIVE' | 'NORMAL'
}

export const derivePropAccountStats = (account: PropAccountRecord): PropDerived => {
  const distanceToDrawdown = account.currentBalance - (account.startingBalance - account.maxDrawdown)
  const amountToTarget = Math.max(0, account.profitTarget - (account.currentBalance - account.startingBalance))
  const payoutEligibilityProgress = Math.min(100, (account.payoutDaysCompleted / Math.max(1, account.minPayoutDays)) * 100)
  const safetyBuffer = Math.max(0, distanceToDrawdown - account.dailyLossLimit)
  const mode: 'DEFENSIVE' | 'NORMAL' = safetyBuffer <= account.dailyLossLimit * 0.5 ? 'DEFENSIVE' : 'NORMAL'

  return {
    distanceToDrawdown,
    amountToTarget,
    payoutEligibilityProgress,
    safetyBuffer,
    mode,
  }
}
