export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  userType: 'user' | 'staff'
  userId: string
  username: string
}

export interface Application {
  id: string
  userId: string
  status: 'draft' | 'pending' | 'processing' | 'completed' | 'rejected'
  type: string
  description: string
  createdAt: string
  updatedAt: string
  materials?: Material[]
}

export interface Material {
  id: string
  name: string
  url: string
  type: string
  uploadedAt: string
}

export interface Case {
  id: string
  applicationId: string
  staffId: string
  status: 'assigned' | 'in_progress' | 'completed'
  result?: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}
