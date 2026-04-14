import client from './client'
import type { LoginRequest, LoginResponse, Application, Case } from '../types'

export const authApi = {
  login: (data: LoginRequest) => client.post<LoginResponse>('/auth/login', data),
}

export const userApi = {
  listApplications: () => client.get<Application[]>('/user/applications'),
  getApplication: (id: string) => client.get<Application>(`/user/applications/${id}`),
  createApplication: (data: Partial<Application>) => client.post<Application>('/user/applications', data),
  uploadMaterial: (applicationId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post(`/user/applications/${applicationId}/materials`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const staffApi = {
  listTodos: () => client.get<Application[]>('/staff/todos'),
  getApplication: (id: string) => client.get<Application>(`/staff/applications/${id}`),
  listCases: () => client.get<Case[]>('/staff/cases'),
  getCase: (id: string) => client.get<Case>(`/staff/cases/${id}`),
  assignCase: (applicationId: string) => client.post<Case>(`/staff/applications/${applicationId}/assign`),
  completeCase: (id: string, result: string) => client.post<Case>(`/staff/cases/${id}/complete`, { result }),
}
