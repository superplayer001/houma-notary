import { client } from '../request'
import {
  normalizeApplication,
  normalizePaginated,
  normalizeCase,
  type RawPaginatedResponse,
  type RawApplication,
  type RawCase,
  type PaginatedResponse,
} from '../adapters/staffAdapter'
import type { Application, Case } from '../../types'

export interface PaginationParams {
  page?: number
  page_size?: number
}

export async function listTodos(params?: PaginationParams): Promise<PaginatedResponse<Application>> {
  const res = await client.get<RawPaginatedResponse>('/staff/todos', { params })
  return normalizePaginated(res.data, normalizeApplication)
}

export async function getApplication(id: string): Promise<Application> {
  const res = await client.get<RawApplication>(`/staff/applications/${id}`)
  return normalizeApplication(res.data)
}

export async function listCases(params?: PaginationParams): Promise<PaginatedResponse<Case>> {
  const res = await client.get<RawPaginatedResponse>('/staff/cases', { params })
  return normalizePaginated(res.data, normalizeCase)
}

export async function getCase(id: string): Promise<Case> {
  const res = await client.get<RawCase>(`/staff/cases/${id}`)
  return normalizeCase(res.data)
}

export async function assignCase(applicationId: string): Promise<Case> {
  const res = await client.post<RawCase>(`/staff/applications/${applicationId}/assign`)
  return normalizeCase(res.data)
}

export async function supplementApplication(id: string, reason: string): Promise<void> {
  await client.post(`/staff/applications/${id}/supplement`, { reason })
}

export async function rejectApplication(id: string, reason: string): Promise<void> {
  await client.post(`/staff/applications/${id}/reject`, { reason })
}

export async function completeCase(id: string, result: string): Promise<Case> {
  const res = await client.post<RawCase>(`/staff/cases/${id}/complete`, { result })
  return normalizeCase(res.data)
}

export async function voidCase(id: string, reason: string): Promise<Case> {
  const res = await client.post<RawCase>(`/staff/cases/${id}/void`, { reason })
  return normalizeCase(res.data)
}
