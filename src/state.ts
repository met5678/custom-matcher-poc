import { proxy } from 'valtio'
import type { Cell, Category } from './types/types'

export type GameState = {
  grid: Cell[]
  categories: Category[]
  score: number
  mistakes: number
  selectedIndex: number | null
}

export const gameState = proxy<GameState>({
  grid: [],
  categories: [],
  score: 0,
  mistakes: 0,
  selectedIndex: null
})

export function resetGame(grid: Cell[], categories: Category[]) {
  gameState.grid = grid
  gameState.categories = categories
  gameState.score = 0
  gameState.mistakes = 0
  gameState.selectedIndex = null
}

export function selectCell(index: number) {
  gameState.selectedIndex = index
}

export function clearSelection() {
  gameState.selectedIndex = null
}

export function incrementScore() {
  gameState.score += 1
}

export function incrementMistakes() {
  gameState.mistakes += 1
}
