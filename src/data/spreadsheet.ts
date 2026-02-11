import { csvToObjects, parseCsv } from './csv'
import type { Category, Choice, Cell } from '../types/types'

const defaultCsvUrl = `${import.meta.env.BASE_URL}data/emily.csv`

type SheetData = {
  categories: Category[]
  choices: Choice[]
}

function sanitize(value: string | undefined) {
  return (value ?? '').trim()
}

export async function loadSheetData(
  csvUrl: string = defaultCsvUrl
): Promise<SheetData> {
  const response = await fetch(csvUrl)
  if (!response.ok) {
    throw new Error(`Sheet fetch failed: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  const rows = parseCsv(text)
  const objects = csvToObjects(rows)

  if (rows.length === 0) {
    return { categories: [], choices: [] }
  }

  const headerRow = rows[0].map((value) => sanitize(value)).filter(Boolean)
  const categories: Category[] = headerRow.map((name, index) => ({
    id: `cat-${index}`,
    name
  }))

  const choices: Choice[] = []
  objects.forEach((row, rowIndex) => {
    categories.forEach((category, columnIndex) => {
      const value = row[category.name]
      const name = sanitize(value)
      if (!name) return
      choices.push({
        id: `choice-${columnIndex}-${rowIndex}`,
        name,
        categoryId: category.id
      })
    })
  })

  return { categories, choices }
}

function hashSeed(seed: string) {
  let hash = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  let t = seed
  return () => {
    t += 0x6d2b79f5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export function buildGrid(choices: Choice[], size: number, seed?: string): Cell[] {
  const shuffled = [...choices]
  const rand = seed ? mulberry32(hashSeed(seed)) : Math.random
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }

  const grid: Cell[] = Array.from({ length: size }, (_, index) => {
    return shuffled[index] ?? null
  })

  return grid
}
