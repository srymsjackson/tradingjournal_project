import { useCallback } from 'react'
import type { Trade } from '../types'
import { normalizeSetups, normalizeSymbols, SETUPS_KEY, STORAGE_KEY, SYMBOLS_KEY } from '../utils/tradeUtils'
import { saveUserTradesToCloud } from '../lib/trades'

type UseJournalPersistenceArgs = {
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>
  setSavedSymbols: React.Dispatch<React.SetStateAction<string[]>>
  setSavedSetups: React.Dispatch<React.SetStateAction<string[]>>
  userId?: string
}

export const useJournalPersistence = ({ setTrades, setSavedSymbols, setSavedSetups, userId }: UseJournalPersistenceArgs) => {
  const persistTrades = useCallback(
    (nextTrades: Trade[]) => {
      setTrades(nextTrades)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTrades))

      if (userId) {
        void saveUserTradesToCloud(userId, nextTrades).catch((error) => {
          console.warn('cloud sync failed, local copy retained', error)
        })
      }
    },
    [setTrades, userId],
  )

  const persistSymbols = useCallback(
    (nextSymbols: string[]) => {
      const normalized = normalizeSymbols(nextSymbols)
      setSavedSymbols(normalized)
      localStorage.setItem(SYMBOLS_KEY, JSON.stringify(normalized))
    },
    [setSavedSymbols],
  )

  const persistSetups = useCallback(
    (nextSetups: string[]) => {
      const normalized = normalizeSetups(nextSetups)
      setSavedSetups(normalized)
      localStorage.setItem(SETUPS_KEY, JSON.stringify(normalized))
    },
    [setSavedSetups],
  )

  const clearPersistedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(SYMBOLS_KEY)
    localStorage.removeItem(SETUPS_KEY)
  }, [])

  return {
    persistTrades,
    persistSymbols,
    persistSetups,
    clearPersistedData,
  }
}