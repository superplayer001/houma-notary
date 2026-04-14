import { client } from '../request'
import {
  normalizeStaffApplication,
  normalizePaginated,
  normalizeMaterial,
  type RawPaginatedResponse,
  type RawStaffApplication,
  type PaginatedResponse,
} from '../adapters/staffApplicationAdapter'
import type { Material } from '../../types'

export interface PaginationParams {
  page?: number
  page_size?: number
}

export interface StaffApplicationDetail {
  id: string
  applicationNo: string
  userId: string
  status: string
  bizType: string
  title: string
  description: string
  submittedAt: string
  createdAt: string
  updatedAt: string
  materials: Material[]
  supplementReason?: string
  reviewComment?: string
  timeline: TimelineEvent[]
}

export interface TimelineEvent {
  id: string
  event: string
  operator?: string
  comment?: string
  createdAt: string
}

export interface PendingApplication {
  id: string
  applicationNo: string
  bizType: string
  title: string
  status: string
  submittedAt: string
  createdAt: string
}

export async function listPendingApplications(
  params?: PaginationParams
): Promise<PaginatedResponse<PendingApplication>> {
  const res = await client.get<RawPaginatedResponse>('/staff/applications/pending', { params })
  return normalizePaginated(res.data, normalizeStaffApplication)
}

export async function getApplicationDetail(
  id: string
): Promise<StaffApplicationDetail> {
  const res = await client.get<RawStaffApplication>(`/staff/applications/${id}`)
  return normalizeStaffApplication(res.data) as StaffApplicationDetail
}

export async function requireSupplement(
  id: string,
  comment: string
): Promise<void> {
  await client.post(`/staff/applications/${id}/require-supplement`, { comment })
}

export async function rejectApplication(
  id: string,
  comment: string
): Promise<void> {
  await client.post(`/staff/applications/${id}/reject`, { comment })
}

export async function acceptApplication(
  id: string,
  comment: string
): Promise<void> {
  await client.post(`/staff/applications/${id}/accept`, { comment })
}
