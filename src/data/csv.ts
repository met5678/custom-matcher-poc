export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"'
        i += 1
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      row.push(current)
      current = ''
      continue
    }

    if (char === '\n') {
      row.push(current)
      rows.push(row)
      row = []
      current = ''
      continue
    }

    if (char === '\r') {
      continue
    }

    current += char
  }

  row.push(current)
  rows.push(row)

  return rows.filter((item) => item.length > 1 || item[0] !== '')
}

export function csvToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length === 0) return []
  const headers = rows[0].map((header) => header.trim())
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      record[header] = row[index]?.trim() ?? ''
    })
    return record
  })
}
