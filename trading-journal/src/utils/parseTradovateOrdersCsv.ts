type CsvRecord = Record<string, string>

export type TradovateExecution = {
  side: 'BUY' | 'SELL'
  symbol: string
  quantity: number
  fillTime: Date
  fillPrice: number
  rawIndex: number
}

export type ReconstructedTrade = {
  symbol: string
  side: 'LONG' | 'SHORT'
  entry: number
  exit: number
  shares: number
  entryTime: string
  exitTime: string
  durationSeconds: number | null
}

type OpenLot = {
  symbol: string
  side: 'BUY' | 'SELL'
  quantity: number
  fillTime: Date
  fillPrice: number
  rawIndex: number
}

const normalizeHeader = (value: string) => value.trim().replace(/^\uFEFF/, '')

const parseCsvRows = (csvText: string): string[][] => {
  const rows: string[][] = []
  let row: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i]

    if (char === '"') {
      const next = csvText[i + 1]
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(current.trim())
      current = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && csvText[i + 1] === '\n') i += 1
      row.push(current.trim())
      current = ''
      if (row.some((field) => field.length > 0)) rows.push(row)
      row = []
      continue
    }

    current += char
  }

  row.push(current.trim())
  if (row.some((field) => field.length > 0)) rows.push(row)

  return rows
}

const parseSide = (value: string | undefined): 'BUY' | 'SELL' | null => {
  if (!value) return null
  const normalized = value.trim().toUpperCase()
  if (normalized === 'B' || normalized === 'BUY') return 'BUY'
  if (normalized === 'S' || normalized === 'SELL') return 'SELL'
  return null
}

const parseNumber = (value: string | undefined): number => {
  if (!value) return Number.NaN
  const cleaned = value.replace(/,/g, '').trim()
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

const parseFillTime = (record: CsvRecord): Date | null => {
  const fillTimeRaw = record['Fill Time'] || record.fillTime || ''
  const timestampRaw = record.Timestamp || record.timestamp || ''
  const dateRaw = record.Date || record.date || ''

  const fromFillTime = new Date(fillTimeRaw)
  if (fillTimeRaw && !Number.isNaN(fromFillTime.getTime())) return fromFillTime

  const fromTimestamp = new Date(timestampRaw)
  if (timestampRaw && !Number.isNaN(fromTimestamp.getTime())) return fromTimestamp

  if (dateRaw && fillTimeRaw) {
    const combined = new Date(`${dateRaw} ${fillTimeRaw}`)
    if (!Number.isNaN(combined.getTime())) return combined
  }

  return null
}

const pickStatus = (record: CsvRecord): string => (record.Status || record.status || '').trim().toLowerCase()

const toExecution = (record: CsvRecord, rawIndex: number): TradovateExecution | null => {
  const status = pickStatus(record)
  if (status !== 'filled') return null

  const side = parseSide(record['B/S'] || record.bs || record.side)
  const symbol = (record.Contract || record.contract || '').trim().toUpperCase()
  const quantity = parseNumber(record.filledQty || record.qty || record.Quantity)
  const fillPrice = parseNumber(record['Avg Fill Price'] || record.avgFillPrice || record.fillPrice)
  const fillTime = parseFillTime(record)

  if (!side || !symbol || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(fillPrice) || !fillTime) {
    return null
  }

  return {
    side,
    symbol,
    quantity,
    fillTime,
    fillPrice,
    rawIndex,
  }
}

const toIso = (date: Date) => date.toISOString()

const toDurationSeconds = (entryTime: Date, exitTime: Date): number | null => {
  const diff = Math.floor((exitTime.getTime() - entryTime.getTime()) / 1000)
  return Number.isFinite(diff) && diff >= 0 ? diff : null
}

const reconstructTrades = (executions: TradovateExecution[]) => {
  const grouped = new Map<string, TradovateExecution[]>()

  for (const execution of executions) {
    const list = grouped.get(execution.symbol) ?? []
    list.push(execution)
    grouped.set(execution.symbol, list)
  }

  const completedTrades: ReconstructedTrade[] = []
  const unmatchedLots: OpenLot[] = []

  for (const [symbol, symbolExecutions] of grouped.entries()) {
    symbolExecutions.sort((a, b) => a.fillTime.getTime() - b.fillTime.getTime() || a.rawIndex - b.rawIndex)

    const openLongs: OpenLot[] = []
    const openShorts: OpenLot[] = []

    for (const execution of symbolExecutions) {
      let remaining = execution.quantity

      if (execution.side === 'BUY') {
        while (remaining > 0 && openShorts.length > 0) {
          const shortLot = openShorts[0]
          const matchedShares = Math.min(remaining, shortLot.quantity)

          completedTrades.push({
            symbol,
            side: 'SHORT',
            entry: shortLot.fillPrice,
            exit: execution.fillPrice,
            shares: matchedShares,
            entryTime: toIso(shortLot.fillTime),
            exitTime: toIso(execution.fillTime),
            durationSeconds: toDurationSeconds(shortLot.fillTime, execution.fillTime),
          })

          shortLot.quantity -= matchedShares
          remaining -= matchedShares
          if (shortLot.quantity <= 0) openShorts.shift()
        }

        if (remaining > 0) {
          openLongs.push({
            symbol,
            side: 'BUY',
            quantity: remaining,
            fillTime: execution.fillTime,
            fillPrice: execution.fillPrice,
            rawIndex: execution.rawIndex,
          })
        }
      }

      if (execution.side === 'SELL') {
        while (remaining > 0 && openLongs.length > 0) {
          const longLot = openLongs[0]
          const matchedShares = Math.min(remaining, longLot.quantity)

          completedTrades.push({
            symbol,
            side: 'LONG',
            entry: longLot.fillPrice,
            exit: execution.fillPrice,
            shares: matchedShares,
            entryTime: toIso(longLot.fillTime),
            exitTime: toIso(execution.fillTime),
            durationSeconds: toDurationSeconds(longLot.fillTime, execution.fillTime),
          })

          longLot.quantity -= matchedShares
          remaining -= matchedShares
          if (longLot.quantity <= 0) openLongs.shift()
        }

        if (remaining > 0) {
          openShorts.push({
            symbol,
            side: 'SELL',
            quantity: remaining,
            fillTime: execution.fillTime,
            fillPrice: execution.fillPrice,
            rawIndex: execution.rawIndex,
          })
        }
      }
    }

    unmatchedLots.push(...openLongs, ...openShorts)
  }

  return { completedTrades, unmatchedLots }
}

const toRecords = (csvText: string): CsvRecord[] => {
  const rows = parseCsvRows(csvText)
  if (rows.length <= 1) return []

  const headers = rows[0].map(normalizeHeader)

  return rows.slice(1).map((values) => {
    const record: CsvRecord = {}
    headers.forEach((header, index) => {
      record[header] = values[index] ?? ''
    })
    return record
  })
}

export const parseTradovateOrdersCsvText = (csvText: string): ReconstructedTrade[] => {
  const records = toRecords(csvText)

  const executions = records
    .map((record, index) => toExecution(record, index))
    .filter((execution): execution is TradovateExecution => Boolean(execution))
    .sort((a, b) => a.symbol.localeCompare(b.symbol) || a.fillTime.getTime() - b.fillTime.getTime() || a.rawIndex - b.rawIndex)

  const { completedTrades, unmatchedLots } = reconstructTrades(executions)

  console.debug('[tradovate orders csv] parsed filled executions', executions)
  console.debug('[tradovate orders csv] matched completed trades', completedTrades)
  console.debug('[tradovate orders csv] unmatched executions', unmatchedLots)

  return completedTrades
}

export const parseTradovateOrdersCsvFile = async (file: File): Promise<ReconstructedTrade[]> => {
  const text = await file.text()
  return parseTradovateOrdersCsvText(text)
}
