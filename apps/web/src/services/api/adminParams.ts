import { client } from '../request'
import {
  normalizeSystemParam,
  normalizePaginatedParams,
  type SystemParam,
  type PaginatedParamsResponse,
  type RawPaginatedParamsResponse,
} from '../adapters/paramsAdapter'

export async function listSystemParams(): Promise<PaginatedParamsResponse> {
  const res = await client.get<RawPaginatedParamsResponse>('/admin/system-params')
  return normalizePaginatedParams(res.data)
}
