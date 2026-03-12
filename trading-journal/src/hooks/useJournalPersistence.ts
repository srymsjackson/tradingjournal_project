import { useCallback } from 'react'
import type { Trade } from '../types'
import { normalizeSetups, normalizeSymbols, SETUPS_KEY, STORAGE_KEY, SYMBOLS_KEY } from '../utils/tradeUtils'

type UseJournalPersistenceArgs = {
  setTrades: React.Dispatch<React.SetStateAction<Trade[]>>
  setSavedSymbols: React.Dispatch<React.SetStateAction<string[]>>
  setSavedSetups: React.Dispatch<React.SetStateAction<string[]>>
}

export const useJournalPersistence = ({ setTrades, setSavedSymbols, setSavedSetups }: UseJournalPersistenceArgs) => {
  const persistTrades = useCallback(
    (nextTrades: Trade[]) => {
      setTrades(nextTrades)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTrades))
    },
    [setTrades],
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