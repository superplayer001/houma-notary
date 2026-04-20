import { client } from '../request'
import {
  normalizeApplication,
  normalizePaginated,
  normalizeMaterial,
  type RawPaginatedResponse,
  type RawApplication,
  type RawMaterial,
  type PaginatedResponse,
} from '../adapters/applicationAdapter'
import type { Application, Material } from '../../types'

export interface CreateApplicationRequest {
  biz_type: 'ENFORCEMENT' | 'DEPOSIT'
  title: string
}

export interface ApplicationDetailResponse extends RawApplication {}

export async function listApplications(params?: { page?: number; page_size?: number }): Promise<PaginatedResponse<Application>> {
  const res = await client.get<RawPaginatedResponse>('/applications', { params })
  return normalizePaginated(res.data, normalizeApplication as (item: unknown) => Application)
}

export async function getApplication(id: string): Promise<Application> {
  const res = await client.get<RawApplication>(`/applications/${id}`)
  return normalizeApplication(res.data)
}

export async function createApplication(data: CreateApplicationRequest): Promise<Application> {
  const res = await client.post<RawApplication>('/applications', data)
  return normalizeApplication(res.data)
}

export async function submitApplication(id: string): Promise<Application> {
  const res = await client.post<RawApplication>(`/applications/${id}/submit`)
  return normalizeApplication(res.data)
}

export async function withdrawApplication(id: string, comment?: string): Promise<void> {
  await client.post(`/applications/${id}/withdraw`, { comment })
}

export async function submitSupplement(id: string, comment?: string): Promise<Application> {
  const res = await client.post<RawApplication>(`/applications/${id}/submit-supplement`, { comment })
  return normalizeApplication(res.data)
}

export async function uploadMaterial(applicationId: string, file: File, materialType: string): Promise<Material> {
  const formData = new FormData()
  formData.append('material_type', materialType)
  formData.append('file', file)
  const res = await client.post(`/applications/${applicationId}/materials`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return normalizeMaterial(res.data as RawMaterial)
}
