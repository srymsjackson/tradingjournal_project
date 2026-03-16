import { useCallback } from 'react'
import type { Trade } from '../types'
import { getJournalStorageKeys, normalizeSetups, normalizeSymbols } from '../utils/tradeUtils'
import { saveUserTradesToCloud } from '../lib/trades'

type UseJournalPersistenceArgs = {
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>
  setSavedSymbols: React.Dispatch<React.SetStateAction<string[]>>
  setSavedSetups: React.Dispatch<React.SetStateAction<string[]>>
  userId?: string
}

export const useJournalPersistence = ({ setTrades, setSavedSymbols, setSavedSetups, userId }: UseJournalPersistenceArgs) => {
  const { tradesKey, symbolsKey, setupsKey } = getJournalStorageKeys(userId)

  const persistTrades = useCallback(
    (nextTrades: Trade[]) => {
      setTrades(nextTrades)
      localStorage.setItem(tradesKey, JSON.stringify(nextTrades))

      if (userId) {
        void saveUserTradesToCloud(userId, nextTrades).catch((error) => {
          console.warn('cloud sync failed, local copy retained', error)
        })
      }
    },
    [setTrades, tradesKey, userId],
  )

  const persistSymbols = useCallback(
    (nextSymbols: string[]) => {
      const normalized = normalizeSymbols(nextSymbols)
      setSavedSymbols(normalized)
      localStorage.setItem(symbolsKey, JSON.stringify(normalized))
    },
    [setSavedSymbols, symbolsKey],
  )

  const persistSetups = useCallback(
    (nextSetups: string[]) => {
      const normalized = normalizeSetups(nextSetups)
      setSavedSetups(normalized)
      localStorage.setItem(setupsKey, JSON.stringify(normalized))
    },
    [setSavedSetups, setupsKey],
  )

  const clearPersistedData = useCallback(() => {
    localStorage.removeItem(tradesKey)
    localStorage.removeItem(symbolsKey)
    localStorage.removeItem(setupsKey)
  }, [setupsKey, symbolsKey, tradesKey])

  return {
    persistTrades,
    persistSymbols,
    persistSetups,
    clearPersistedData,
  }
}