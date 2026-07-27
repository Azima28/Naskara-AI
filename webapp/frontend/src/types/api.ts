/** Response types — mirror backend routers (auth, drafts, validate). */

// Auth
export interface UserOut {
  id: string
  email: string
  name: string
}

export interface TokenOut {
  access_token: string
  token_type: string
  user: UserOut
}

// Drafts
export interface DraftSummary {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
}

export interface DraftOut {
  id: string
  title: string
  status: string
  data: import('./pkl').PklContext
  created_at: string
  updated_at: string
}

// Validation (sudah ada, ditambahkan di sini juga)
export interface IssueItem {
  field: string
  message: string
}

export interface ValidationResult {
  score: number
  max_score: number
  percent: number
  ready: boolean
  blocking: IssueItem[]
  warnings: string[]
}

export interface BabRecommendation {
  modules: string[]
  reasons: string[]
}

export interface HealthResponse {
  status: string
  app: string
  ai_enabled: boolean
}
