import client from './client'
import type { LoginRequest, LoginResponse, Application, Case, PaginationParams, PaginatedResponse } from '../types'

export const authApi = {
  login: (data: LoginRequest) => client.post<LoginResponse>('/auth/login', data),
}

export const userApi = {
  listApplications: (params?: PaginationParams) => client.get<PaginatedResponse<Application>>('/user/applications', { params }),
  getApplication: (id: string) => client.get<Application>(`/user/applications/${id}`),
  createApplication: (data: { bizType: string; title: string; description: string }) =>
    client.post<Application>('/user/applications', data),
  submitApplication: (id: string) => client.post<Application>(`/user/applications/${id}/submit`),
  withdrawApplication: (id: string) => client.post<void>(`/user/applications/${id}/withdraw`),
  submitSupplement: (id: string) => client.post<Application>(`/user/applications/${id}/submit-supplement`),
  uploadMaterial: (applicationId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post(`/user/applications/${applicationId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const staffApi = {
  listTodos: (params?: PaginationParams) => client.get<PaginatedResponse<Application>>('/staff/todos', { params }),
  getApplication: (id: string) => client.get<Application>(`/staff/applications/${id}`),
  listCases: (params?: PaginationParams) => client.get<PaginatedResponse<Case>>('/staff/cases', { params }),
  getCase: (id: string) => client.get<Case>(`/staff/cases/${id}`),
  getCaseByVerifyCode: (code: string) => client.get<Case>(`/verify/${code}`),
  assignCase: (applicationId: string) => client.post<Case>(`/staff/applications/${applicationId}/assign`),
  supplementApplication: (id: string, reason: string) => client.post<void>(`/staff/applications/${id}/supplement`, { reason }),
  rejectApplication: (id: string, reason: string) => client.post<void>(`/staff/applications/${id}/reject`, { reason }),
  completeCase: (id: string, result: string) => client.post<Case>(`/staff/cases/${id}/complete`, { result }),
  voidCase: (id: string, reason: string) => client.post<Case>(`/staff/cases/${id}/void`, { reason }),
}

export interface VideoSession {
  id: string
  caseId: string
  roomId: string
  status: 'waiting' | 'in_progress' | 'completed' | 'aborted'
  participants: string[]
  startedAt?: string
  completedAt?: string
  recordingUrl?: string
}

export const videoApi = {
  getSession: (caseId: string) => client.get<VideoSession>(`/video/sessions/${caseId}`),
  startSession: (caseId: string) => client.post<VideoSession>(`/video/sessions/${caseId}/start`),
  completeSession: (caseId: string) => client.post<VideoSession>(`/video/sessions/${caseId}/complete`),
  abortSession: (caseId: string, reason: string) => client.post<VideoSession>(`/video/sessions/${caseId}/abort`, { reason }),
}

export interface ExternalDebugRequest {
  requestNo?: string
  stage?: string
  requestData?: string
}

export const externalApi = {
  sendRequest: (data: ExternalDebugRequest) => client.post('/external/send', data),
  queryRequest: (requestNo: string) => client.get(`/external/query/${requestNo}`),
}
