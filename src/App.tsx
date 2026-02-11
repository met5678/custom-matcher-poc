import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import './App.css'
import {
  gameState,
  resetGame,
  selectCell,
  clearSelection,
  incrementMistakes,
  incrementScore
} from './state'
import { buildGrid, loadSheetData } from './data/spreadsheet'
import type { Cell, Choice, ChoiceStack, Category } from './types/types'

const GRID_SIZE = 25
const GRID_COUNT = GRID_SIZE * GRID_SIZE
const STORAGE_KEY = 'matching-game-state-v1'
const GRID_SEED = 'emily-seed-001'

function asStack(cell: Choice | ChoiceStack): ChoiceStack {
  if ('choices' in cell) return cell
  return {
    id: `stack-${cell.id}`,
    categoryId: cell.categoryId,
    choices: [cell]
  }
}

function compactGrid(grid: Cell[], size: number): Cell[] {
  const rows = []
  const rowSize = GRID_SIZE
  const rowCount = Math.ceil(size / rowSize)

  for (let row = 0; row < rowCount; row += 1) {
    const start = row * rowSize
    const slice = grid.slice(start, start + rowSize)
    const compacted = slice.filter((cell) => cell !== null)
    while (compacted.length < rowSize) {
      compacted.push(null)
    }
    rows.push(compacted)
  }

  const nonEmptyRows = rows.filter((row) => row.some((cell) => cell !== null))
  while (nonEmptyRows.length < rowCount) {
    nonEmptyRows.push(Array.from({ length: rowSize }, () => null))
  }

  return nonEmptyRows.flat()
}

function getCategoryName(categoryId: string, categories: readonly Category[]) {
  return categories.find((category) => category.id === categoryId)?.name ?? 'Complete'
}

function formatStackLabel(stack: ChoiceStack) {
  const [first, second] = stack.choices
  const hasMore = stack.choices.length > 2
  return (
    <>
      <div>{first?.name ?? ''}{stack.choices.length > 1 ? ',' : ''}</div>
      {second && (
        <div>
          {second.name},{hasMore ? ' …' : ''}
        </div>
      )}
      <div>[{stack.choices.length}]</div>
    </>
  )
}

function categoryColor(index: number, total: number) {
  if (total <= 1) return 'hsl(0 70% 85%)'
  const start = 0
  const end = 300
  const hue = start + ((end - start) * index) / (total - 1)
  return `hsl(${Math.round(hue)} 70% 85%)`
}

type StoredState = {
  grid: readonly Cell[]
  categories: readonly Category[]
  score: number
  mistakes: number
}

function readStoredState(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredState
    if (!parsed || !Array.isArray(parsed.grid) || !Array.isArray(parsed.categories)) {
      return null
    }
    if (parsed.grid.length !== GRID_COUNT) return null
    return parsed
  } catch {
    return null
  }
}

function writeStoredState(state: StoredState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors (quota/private mode)
  }
}

function App() {
  const snap = useSnapshot(gameState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [choices, setChoices] = useState<Choice[]>([])
  const [mistakeFlash, setMistakeFlash] = useState<Set<number>>(new Set())
  const flashTimeouts = useRef<number[]>([])

  useEffect(() => {
    let mounted = true
    loadSheetData()
      .then(({ categories, choices }) => {
        if (!mounted) return
        setChoices(choices)
        const stored = readStoredState()
        if (stored && stored.categories.length === categories.length) {
          resetGame([...stored.grid], [...stored.categories])
          gameState.score = stored.score
          gameState.mistakes = stored.mistakes
        } else {
          const grid = buildGrid(choices, GRID_COUNT, GRID_SEED)
          resetGame(grid, categories)
        }
      })
      .catch((err) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : 'Failed to load data')
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (loading || error) return
    writeStoredState({
      grid: snap.grid,
      categories: snap.categories,
      score: snap.score,
      mistakes: snap.mistakes
    })
  }, [loading, error, snap.grid, snap.categories, snap.score, snap.mistakes])

  useEffect(() => {
    return () => {
      flashTimeouts.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
      flashTimeouts.current = []
    }
  }, [])

  const filledCount = useMemo(
    () => snap.grid.filter((cell) => cell !== null).length,
    [snap.grid]
  )

  function handleCellClick(index: number) {
    const cell = snap.grid[index]
    if (!cell) return

    if (snap.selectedIndex === null) {
      selectCell(index)
      return
    }

    if (snap.selectedIndex === index) {
      clearSelection()
      return
    }

    const firstIndex = snap.selectedIndex
    const firstCell = snap.grid[firstIndex]
    if (!firstCell) {
      clearSelection()
      return
    }

    const firstCategoryId =
      'choices' in firstCell ? firstCell.categoryId : firstCell.categoryId
    const secondCategoryId = 'choices' in cell ? cell.categoryId : cell.categoryId

    if (firstCategoryId === secondCategoryId) {
      const firstStack = asStack(firstCell)
      const secondStack = asStack(cell)
      const combined: ChoiceStack = {
        id: `stack-${secondStack.id}-${Date.now()}`,
        categoryId: secondStack.categoryId,
        choices: [...secondStack.choices, ...firstStack.choices]
      }

      gameState.grid[firstIndex] = null
      gameState.grid[index] = combined
      gameState.grid = compactGrid(gameState.grid, GRID_COUNT)
      incrementScore()
    } else {
      incrementMistakes()
      flashMistake([firstIndex, index])
    }

    clearSelection()
  }

  function handleReset() {
    if (choices.length === 0) return
    const confirmed = window.confirm('Reset the game? This will clear your progress.')
    if (!confirmed) return
    const grid = buildGrid(choices, GRID_COUNT, GRID_SEED)
    resetGame(grid, [...snap.categories])
  }

  function flashMistake(indices: number[]) {
    setMistakeFlash((prev) => {
      const next = new Set(prev)
      indices.forEach((index) => next.add(index))
      return next
    })

    const timeoutId = window.setTimeout(() => {
      setMistakeFlash((prev) => {
        const next = new Set(prev)
        indices.forEach((index) => next.delete(index))
        return next
      })
    }, 2500)

    flashTimeouts.current.push(timeoutId)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-stats">
          <div>
            <strong>Score:</strong> {snap.score}
          </div>
          <div>
            <strong>Mistakes:</strong> {snap.mistakes}
          </div>
          <div>
            <strong>Remaining:</strong> {filledCount}
          </div>
          <div className="app-actions">
            <button type="button" onClick={handleReset}>
              Reset Game
            </button>
          </div>
        </div>
      </header>

      <section className="app-board">
        {loading && <div className="app-status">Loading spreadsheet...</div>}
        {error && <div className="app-status app-error">{error}</div>}
        {!loading && !error && (
          <div className="grid">
            {snap.grid.map((cell, index) => {
              if (!cell) {
                return <div key={`empty-${index}`} className="grid-cell empty" aria-hidden="true" />
              }

              const isSelected = snap.selectedIndex === index
              const isMistake = mistakeFlash.has(index)
              if ('choices' in cell) {
                const isComplete = cell.choices.length === GRID_SIZE
                const label = isComplete
                  ? getCategoryName(cell.categoryId, snap.categories)
                  : formatStackLabel(cell)
                const categoryIndex = snap.categories.findIndex(
                  (category) => category.id === cell.categoryId
                )
                const completeColor =
                  isComplete && categoryIndex >= 0
                    ? categoryColor(categoryIndex, snap.categories.length)
                    : undefined

                return (
                  <button
                    key={cell.id}
                    type="button"
                    className={`grid-cell stack ${isComplete ? 'complete' : ''} ${
                      isSelected ? 'selected' : ''
                    } ${isMistake ? 'mistake' : ''}`}
                    onClick={() => handleCellClick(index)}
                    style={completeColor ? { background: completeColor, borderColor: completeColor } : undefined}
                  >
                    {label}
                  </button>
                )
              }

              return (
                <button
                  key={cell.id}
                  type="button"
                  className={`grid-cell ${isSelected ? 'selected' : ''} ${
                    isMistake ? 'mistake' : ''
                  }`}
                  onClick={() => handleCellClick(index)}
                >
                  {cell.name}
                </button>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

export default App
