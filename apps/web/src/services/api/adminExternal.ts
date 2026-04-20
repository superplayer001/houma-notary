import { client } from '../request'
import {
  toRawSendRequest,
  normalizeSendResponse,
  normalizeEnforcementQuery,
  type SendEnforcementRequest,
  type SendEnforcementResponse,
  type EnforcementQueryResponse,
  type RawSendEnforcementResponse,
  type RawEnforcementQueryResponse,
} from '../adapters/externalAdapter'

export interface SendExternalRequest {
  sourceSystem: string
  externalRequestNo?: string
  caseDescription: string
  applicantName: string
  applicantIdNo: string
}

export async function sendEnforcementApplication(
  data: SendExternalRequest
): Promise<SendEnforcementResponse> {
  const { sourceSystem, ...rest } = data
  const raw = toRawSendRequest(rest)
  const res = await client.post<RawSendEnforcementResponse>(
    '/external/enforcement/applications',
    raw,
    {
      headers: {
        'X-Source-System': sourceSystem,
      },
    }
  )
  return normalizeSendResponse(res.data)
}

export async function queryEnforcementApplication(
  requestNo: string,
  sourceSystem: string
): Promise<EnforcementQueryResponse> {
  const res = await client.get<RawEnforcementQueryResponse>(
    `/external/enforcement/applications/${requestNo}`,
    {
      headers: {
        'X-Source-System': sourceSystem,
      },
    }
  )
  return normalizeEnforcementQuery(res.data)
}
