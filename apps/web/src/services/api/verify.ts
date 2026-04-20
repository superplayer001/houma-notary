import { client } from '../request'
import {
  normalizeCertificateStatus,
  type CertificateStatus,
} from '../adapters/caseAdapter'

export interface VerifyResult {
  certificateNo: string
  verifyCode: string
  bizType: string
  status: CertificateStatus
  issuedAt: string
  voidedAt: string
  voidReason: string
  caseNo: string
  result: string
  acceptedAt: string
  completedAt: string
}

interface RawVerifyResponse {
  certificate_no?: string
  certificateNo?: string
  verify_code?: string
  verifyCode?: string
  biz_type?: string
  bizType?: string
  status?: string
  issued_at?: string
  issuedAt?: string
  voided_at?: string
  voidedAt?: string
  void_reason?: string
  voidReason?: string
  case_no?: string
  caseNo?: string
  result?: string
  accepted_at?: string
  acceptedAt?: string
  completed_at?: string
  completedAt?: string
  [key: string]: unknown
}

export async function verifyCertificate(verifyCode: string): Promise<VerifyResult> {
  const res = await client.get<RawVerifyResponse>(`/verify/${verifyCode}`)
  const d = res.data
  return {
    certificateNo: d.certificate_no ?? d.certificateNo ?? '',
    verifyCode: d.verify_code ?? d.verifyCode ?? '',
    bizType: d.biz_type ?? d.bizType ?? '',
    status: normalizeCertificateStatus(d.status ?? 'ISSUED'),
    issuedAt: d.issued_at ?? d.issuedAt ?? '',
    voidedAt: d.voided_at ?? d.voidedAt ?? '',
    voidReason: d.void_reason ?? d.voidReason ?? '',
    caseNo: d.case_no ?? d.caseNo ?? '',
    result: d.result ?? '',
    acceptedAt: d.accepted_at ?? d.acceptedAt ?? '',
    completedAt: d.completed_at ?? d.completedAt ?? '',
  }
}
