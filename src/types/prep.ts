export type PrepCategory =
  | 'opener'
  | 'behavioral'
  | 'technical'
  | 'project'
  | 'metrics'
  | 'situational'

export interface PrepDeepDive {
  title: string
  content: string
}

export interface PrepMetric {
  value: string
  label: string
}

export interface PrepFollowUp {
  question: string
  answer: string
}

export interface PrepCard {
  id: string
  category: PrepCategory
  title: string
  tags: string[]

  script?: string
  warning?: string
  followUps?: PrepFollowUp[]
  deepDives?: PrepDeepDive[]
  metrics?: PrepMetric[]
  tableData?: {
    headers: string[]
    rows: string[][]
  }
}
