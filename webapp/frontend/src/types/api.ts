/** Response types — mirror backend routers (auth, drafts, validate). */

// Auth
export type UserRole = 'admin' | 'siswa'

export interface UserOut {
  id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
}

export interface TokenOut {
  access_token: string
  token_type: string
  user: UserOut
}

// Admin API Schemas
export interface AdminStats {
  users: {
    total: number
    by_role: { admin: number; siswa: number }
  }
  drafts: {
    total: number
    by_status: { collecting: number; reviewing: number; ready: number }
  }
  storage: {
    uploads_bytes: number
    uploads_mb: number
    uploads_files: number
    db_bytes: number
    db_mb: number
  }
  system: {
    ai_enabled: boolean
    ai_model: string
    environment: string
  }
}

export interface UserManagementItem {
  id: string
  email: string
  name: string
  role: UserRole
  is_active: boolean
  last_login?: string
  created_at: string
  draft_count: number
}

export interface AdminDraftItem {
  id: string
  user_id: string
  user_name: string
  user_email: string
  title: string
  status: string
  jurusan: string
  created_at: string
  updated_at: string
}

export interface AssetAuditItem {
  filename: string
  relative_path: string
  size_bytes: number
  size_kb: number
  is_orphaned: boolean
}

export interface SystemConfigData {
  school_name: string
  school_name_full?: string
  alamat: string
  kota?: string
  telp?: string
  email?: string
  website?: string
  kop_baris_1?: string
  kop_baris_2?: string
  kop_baris_3?: string
  npsn: string
  nss?: string
  kepala_sekolah: string
  nip_kepala_sekolah: string
  waka_humas: string
  nip_waka_humas: string
  pembimbing_sekolah?: string
  nip_pembimbing_sekolah?: string
  pejabat_jurusan: Record<string, Record<string, string>>
  enable_ai_security_filter?: boolean
  ai_base_url?: string
  ai_model_default: string
  ai_max_tokens_per_req: number
}

export interface AuditLogItem {
  id: string
  actor_id?: string
  actor_email: string
  action: string
  target?: string
  details: Record<string, any>
  ip_address?: string
  created_at: string
}

export interface DebugLogItem {
  id: number
  timestamp: string
  level: 'ERROR' | 'WARNING' | 'INFO' | 'DEBUG'
  category: 'AI_PROVIDER' | 'AUTH' | 'DATABASE' | 'DOCX_ENGINE' | 'HTTP_REQUEST' | 'SECURITY' | 'SYSTEM' | string
  message: string
  detail?: any
  source: string
}

export interface HealthDetailResponse {
  status: string
  python_version: string
  os_platform: string
  libreoffice_available: boolean
  libreoffice_path: string
  disk: {
    total_gb: number
    used_gb: number
    free_gb: number
  }
  env_settings: {
    environment: string
    ai_enabled: boolean
    ai_base_url: string
    ai_model: string
  }
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
