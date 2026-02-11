import { csvToObjects, parseCsv } from './csv'

const defaultCsvUrl = '/data/emily.csv'
const defaultSheetId = '1DivkkqCfLKrkckF0bydK1tpjhktIZOtqgzaMokkhxVs'
const defaultGid = '0'

function resolveSheetConfig() {
  const env = import.meta.env
  const csvUrl = env.VITE_SHEET_CSV_URL || defaultCsvUrl

  if (csvUrl !== defaultCsvUrl) {
    return { csvUrl }
  }

  if (env.VITE_SHEET_ID) {
    const sheetId = env.VITE_SHEET_ID || defaultSheetId
    const gid = env.VITE_SHEET_GID || defaultGid
    return {
      csvUrl: `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`
    }
  }

  return { csvUrl }
}

export async function fetchSheetRows(): Promise<Record<string, string>[]> {
  const { csvUrl } = resolveSheetConfig()
  const response = await fetch(csvUrl)
  if (!response.ok) {
    throw new Error(`Sheet fetch failed: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  const rows = parseCsv(text)
  return csvToObjects(rows)
}
