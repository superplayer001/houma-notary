import { client } from '../request'
import {
  normalizeCaseDetailResponse,
  type RawCaseDetailResponse,
  type CaseDetail,
} from '../adapters/caseAdapter'

export async function voidCertificate(certificateId: string, comment: string): Promise<CaseDetail> {
  const res = await client.post<RawCaseDetailResponse>(`/staff/certificates/${certificateId}/void`, { comment })
  return normalizeCaseDetailResponse(res.data)
}
