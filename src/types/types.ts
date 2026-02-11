export type Category = {
  id: string
  name: string
}

export type Choice = {
  id: string
  name: string
  categoryId: string
}

export type ChoiceStack = {
  id: string
  categoryId: string
  choices: readonly Choice[]
}

export type Cell = Choice | ChoiceStack | null
