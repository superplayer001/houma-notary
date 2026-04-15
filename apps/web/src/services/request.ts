import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios'
import { message } from 'antd'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const MOCK_DELAY = 300

const MOCK_STAFF_PENDING = [
  { id: 'APP-001', applicationNo: 'A001', userId: 'U001', status: 'SUBMITTED', bizType: 'property', title: '房产继承公证', description: '父亲去世，需要办理房产继承公证', submittedAt: '2024-01-15 11:00:00', createdAt: '2024-01-15 10:30:00', updatedAt: '2024-01-15 10:30:00', materials: [], timeline: [] },
  { id: 'APP-003', applicationNo: 'A003', userId: 'U001', status: 'SUBMITTED', bizType: 'ENFORCEMENT', title: '强制执行公证', description: '借款合同赋予强制执行效力', submittedAt: '2024-01-14 15:00:00', createdAt: '2024-01-14 14:20:00', updatedAt: '2024-01-14 14:20:00', materials: [], timeline: [] },
  { id: 'APP-005', applicationNo: 'A005', userId: 'U002', status: 'SUBMITTED', bizType: 'will', title: '遗嘱公证', description: '本人自愿订立遗嘱公证', submittedAt: '2024-01-16 09:00:00', createdAt: '2024-01-16 08:00:00', updatedAt: '2024-01-16 08:00:00', materials: [], timeline: [] },
]

const MOCK_STAFF_APP_DETAIL: Record<string, { id: string; applicationNo: string; userId: string; status: string; bizType: string; title: string; description: string; submittedAt: string; createdAt: string; updatedAt: string; materials: unknown[]; timeline: unknown[]; supplementReason?: string; reviewComment?: string }> = {
  'APP-001': { id: 'APP-001', applicationNo: 'A001', userId: 'U001', status: 'SUBMITTED', bizType: 'property', title: '房产继承公证', description: '父亲去世，需要办理房产继承公证', submittedAt: '2024-01-15 11:00:00', createdAt: '2024-01-15 10:30:00', updatedAt: '2024-01-15 10:30:00', materials: [{ id: 'M001', name: '身份证.pdf', url: '#', type: 'id_card', uploadedAt: '2024-01-15 10:35:00' }], timeline: [{ id: 'T1', event: '用户提交申请', operator: 'U001', createdAt: '2024-01-15 11:00:00' }] },
  'APP-003': { id: 'APP-003', applicationNo: 'A003', userId: 'U001', status: 'SUBMITTED', bizType: 'ENFORCEMENT', title: '强制执行公证', description: '借款合同赋予强制执行效力', submittedAt: '2024-01-14 15:00:00', createdAt: '2024-01-14 14:20:00', updatedAt: '2024-01-14 14:20:00', materials: [], timeline: [{ id: 'T2', event: '用户提交申请', operator: 'U001', createdAt: '2024-01-14 15:00:00' }] },
}

const MOCK_STAFF_CASES = [
  { id: 'CASE-001', caseNo: 'C001', applicationId: 'APP-002', staffId: 'S001', status: 'COMPLETED', bizType: 'will', result: '遗嘱公证办理完成', certificateNo: 'GZ-2024-001', verifyCode: 'VERIFY001', certificateStatus: 'ISSUED', issuedAt: '2024-01-12 16:00:00', acceptedAt: '2024-01-11 09:00:00', completedAt: '2024-01-12 16:00:00', createdAt: '2024-01-10 09:00:00', updatedAt: '2024-01-12 16:00:00' },
  { id: 'CASE-002', caseNo: 'C002', applicationId: 'APP-001', staffId: 'S001', status: 'UNDER_REVIEW', bizType: 'property', acceptedAt: '2024-01-15 10:30:00', createdAt: '2024-01-15 10:30:00', updatedAt: '2024-01-16 08:00:00' },
  { id: 'CASE-003', caseNo: 'C003', applicationId: 'APP-003', staffId: 'S001', status: 'APPROVED', bizType: 'ENFORCEMENT', acceptedAt: '2024-01-14 14:20:00', createdAt: '2024-01-14 14:20:00', updatedAt: '2024-01-17 10:00:00' },
]

const MOCK_CASE_DETAIL: Record<string, { case: Record<string, unknown>; application: Record<string, unknown>; materials: unknown[]; timeline: unknown[]; certificate: Record<string, unknown> }> = {
  'CASE-001': {
    case: { id: 'CASE-001', caseNo: 'C001', applicationId: 'APP-002', staffId: 'S001', status: 'COMPLETED', bizType: 'will', result: '遗嘱公证办理完成', certificateNo: 'GZ-2024-001', verifyCode: 'VERIFY001', certificateStatus: 'ISSUED', issuedAt: '2024-01-12 16:00:00', acceptedAt: '2024-01-11 09:00:00', completedAt: '2024-01-12 16:00:00', createdAt: '2024-01-10 09:00:00', updatedAt: '2024-01-12 16:00:00' },
    application: { id: 'APP-002', applicationNo: 'A002', userId: 'U001', bizType: 'will', title: '遗嘱公证', description: '本人自愿订立遗嘱公证', createdAt: '2024-01-10 09:00:00', updatedAt: '2024-01-12 16:00:00', materials: [] },
    materials: [],
    timeline: [
      { id: 'T1', event: '案件创建', operator: 'S001', createdAt: '2024-01-10 09:00:00' },
      { id: 'T2', event: '案件受理', operator: 'S001', createdAt: '2024-01-11 09:00:00' },
      { id: 'T3', event: '审查完成', operator: 'S001', createdAt: '2024-01-12 15:00:00' },
      { id: 'T4', event: '出证完成', operator: 'S001', createdAt: '2024-01-12 16:00:00' },
    ],
    certificate: { id: 'CERT-001', certificateNo: 'GZ-2024-001', verifyCode: 'VERIFY001', status: 'ISSUED', issuedAt: '2024-01-12 16:00:00', bizType: 'will' },
  },
  'CASE-002': {
    case: { id: 'CASE-002', caseNo: 'C002', applicationId: 'APP-001', staffId: 'S001', status: 'UNDER_REVIEW', bizType: 'property', acceptedAt: '2024-01-15 10:30:00', createdAt: '2024-01-15 10:30:00', updatedAt: '2024-01-16 08:00:00' },
    application: { id: 'APP-001', applicationNo: 'A001', userId: 'U001', bizType: 'property', title: '房产继承公证', description: '父亲去世，需要办理房产继承公证', createdAt: '2024-01-15 10:30:00', updatedAt: '2024-01-15 10:30:00', materials: [{ id: 'M001', name: '身份证.pdf', url: '#', type: 'id_card', uploadedAt: '2024-01-15 10:35:00' }] },
    materials: [{ id: 'M001', name: '身份证.pdf', url: '#', type: 'id_card', uploadedAt: '2024-01-15 10:35:00' }],
    timeline: [
      { id: 'T1', event: '案件创建', operator: 'S001', createdAt: '2024-01-15 10:30:00' },
      { id: 'T2', event: '进入审查阶段', operator: 'S001', comment: '材料齐全，开始审查', createdAt: '2024-01-16 08:00:00' },
    ],
    certificate: { id: 'CERT-002', certificateNo: '', verifyCode: '', status: 'ISSUED', bizType: 'property' },
  },
  'CASE-003': {
    case: { id: 'CASE-003', caseNo: 'C003', applicationId: 'APP-003', staffId: 'S001', status: 'APPROVED', bizType: 'ENFORCEMENT', acceptedAt: '2024-01-14 14:20:00', createdAt: '2024-01-14 14:20:00', updatedAt: '2024-01-17 10:00:00' },
    application: { id: 'APP-003', applicationNo: 'A003', userId: 'U001', bizType: 'ENFORCEMENT', title: '强制执行公证', description: '借款合同赋予强制执行效力', createdAt: '2024-01-14 14:20:00', updatedAt: '2024-01-14 14:20:00', materials: [] },
    materials: [],
    timeline: [
      { id: 'T1', event: '案件创建', operator: 'S001', createdAt: '2024-01-14 14:20:00' },
    ],
    certificate: { id: 'CERT-003', certificateNo: '', verifyCode: '', status: 'ISSUED', bizType: 'ENFORCEMENT' },
  },
}

const MOCK_VERIFY_RESPONSES: Record<string, Record<string, unknown>> = {
  'VERIFY001': { certificateNo: 'GZ-2024-001', verifyCode: 'VERIFY001', bizType: 'will', status: 'ISSUED', issuedAt: '2024-01-12 16:00:00', caseNo: 'C001', result: '遗嘱公证办理完成', acceptedAt: '2024-01-11 09:00:00', completedAt: '2024-01-12 16:00:00' },
  'VERIFY002': { certificateNo: 'GZ-2024-002', verifyCode: 'VERIFY002', bizType: 'property', status: 'VOIDED', issuedAt: '2024-01-10 10:00:00', voidedAt: '2024-01-15 10:00:00', voidReason: '证书依法作废', caseNo: 'C002', result: '房产继承公证', acceptedAt: '2024-01-09 09:00:00', completedAt: '2024-01-10 10:00:00' },
}

const MOCK_EXTERNAL_SEND_RESPONSES: Record<string, { request_no: string; external_request_no: string; source_system: string; biz_type: string; status: string; current_stage: string; application_id?: string }> = {}
const MOCK_EXTERNAL_QUERY_RESPONSES: Record<string, Record<string, unknown>> = {
  'EXT-001': { request_no: 'EXT-001', external_request_no: 'OUT-20260415-0001', source_system: 'LOAN_SYSTEM', biz_type: 'ENFORCEMENT', status: 'PROCESSING', current_stage: 'APPLICATION_CREATED', application_id: 'APP-EXT-001' },
  'EXT-002': { request_no: 'EXT-002', external_request_no: 'OUT-20260415-0002', source_system: 'LOAN_SYSTEM', biz_type: 'ENFORCEMENT', status: 'COMPLETED', current_stage: 'CERTIFICATE_ISSUED', application_id: 'APP-EXT-002', certificate: { id: 'CERT-EXT-001', certificate_no: 'GZ-2024-EXT-001', verify_code: 'VERIFY-EXT-001', verify_url: 'https://verify.example.com/VERIFY-EXT-001', status: 'ISSUED', issued_at: '2024-04-15 14:00:00', digest: 'abc123digest' } },
}

const MOCK_AUDIT_LOGS = [
  { id: 'AUD-001', entity_type: 'user', entity_id: 'U001', action: 'LOGIN', operator_type: 'USER', operator_id: 'U001', operator_name: '张三', ip: '192.168.1.1', created_at: '2024-01-16 10:00:00', detail_json: { browser: 'Chrome', os: 'Windows' } },
  { id: 'AUD-002', entity_type: 'application', entity_id: 'APP-001', action: 'SUBMIT', operator_type: 'USER', operator_id: 'U001', operator_name: '张三', ip: '192.168.1.1', created_at: '2024-01-16 11:00:00', detail_json: { bizType: 'property' } },
  { id: 'AUD-003', entity_type: 'application', entity_id: 'APP-001', action: 'ACCEPT', operator_type: 'STAFF', operator_id: 'S001', operator_name: '公证员01', ip: '192.168.1.10', created_at: '2024-01-16 14:00:00', detail_json: { comment: '材料齐全，准予受理' } },
  { id: 'AUD-004', entity_type: 'case', entity_id: 'CASE-001', action: 'ISSUE', operator_type: 'STAFF', operator_id: 'S001', operator_name: '公证员01', ip: '192.168.1.10', created_at: '2024-01-17 09:00:00', detail_json: { certificateNo: 'GZ-2024-001' } },
  { id: 'AUD-005', entity_type: 'case', entity_id: 'CASE-002', action: 'VOID', operator_type: 'STAFF', operator_id: 'S001', operator_name: '公证员01', ip: '192.168.1.10', created_at: '2024-01-17 10:00:00', detail_json: { reason: '证书依法作废' } },
  { id: 'AUD-006', entity_type: 'system_param', entity_id: 'CASE_EXPIRY_DAYS', action: 'UPDATE', operator_type: 'ADMIN', operator_id: 'A001', operator_name: '系统管理员', ip: '192.168.1.100', created_at: '2024-01-15 09:00:00', detail_json: { oldValue: '15', newValue: '30' } },
]

const MOCK_SYSTEM_PARAMS = [
  { key: 'CASE_EXPIRY_DAYS', value: '30', type: 'number', description: '案件从受理到完成的允许天数', updated_at: '2024-01-15 09:00:00' },
  { key: 'MAX_MATERIAL_SIZE_MB', value: '20', type: 'number', description: '单次上传材料文件大小上限（MB）', updated_at: '2024-01-10 10:00:00' },
  { key: 'ALLOW_WITHDRAW_AFTER_SUBMIT', value: 'false', type: 'boolean', description: '申请提交后是否允许用户撤回', updated_at: '2024-01-08 11:00:00' },
  { key: 'REQUIRE_VIDEO_FOR_TYPES', value: 'will,property', type: 'string', description: '逗号分隔，需要双录公证的业务类型', updated_at: '2024-01-05 08:00:00' },
  { key: 'CERTIFICATE_VALIDITY_YEARS', value: '永久', type: 'string', description: '公证证书的有效期限', updated_at: '2024-01-01 00:00:00' },
]

const client: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  if (USE_MOCK) {
    const url = config.url ?? ''

    if (url === '/staff/applications/pending') {
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: { items: MOCK_STAFF_PENDING, page: 1, page_size: 10, total: MOCK_STAFF_PENDING.length }, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+$/) && config.method === 'get') {
      const segments = url.split('/')
      const id = segments[3]
      const app = MOCK_STAFF_APP_DETAIL[id] ?? MOCK_STAFF_APP_DETAIL['APP-001']
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: app, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/require-supplement$/)) {
      const segments = url.split('/')
      const id = segments[3]
      const app = MOCK_STAFF_APP_DETAIL[id] ?? MOCK_STAFF_APP_DETAIL['APP-001']
      const updated = { ...app, status: 'SUPPLEMENT_REQUIRED', supplementReason: '请补充身份证正反面' }
      MOCK_STAFF_APP_DETAIL[id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/reject$/)) {
      const segments = url.split('/')
      const id = segments[3]
      const app = MOCK_STAFF_APP_DETAIL[id] ?? MOCK_STAFF_APP_DETAIL['APP-001']
      const updated = { ...app, status: 'REJECTED' }
      MOCK_STAFF_APP_DETAIL[id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+$/) && config.method === 'get') {
      const id = url.split('/')[3]
      const detail = MOCK_CASE_DETAIL[id] ?? MOCK_CASE_DETAIL['CASE-001']
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: detail, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+\/advance-status$/)) {
      const id = url.split('/')[3]
      const detail = MOCK_CASE_DETAIL[id] ?? MOCK_CASE_DETAIL['CASE-001']
      const body = (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) as { to_status?: string; comment?: string }
      const nextStatus = body?.to_status ?? 'UNDER_REVIEW'
      const updated = { ...detail, case: { ...detail.case, status: nextStatus }, timeline: [...(detail.timeline ?? []), { id: `T${Date.now()}`, event: `推进至${nextStatus}`, comment: body?.comment ?? '', operator: 'S001', createdAt: new Date().toLocaleString() }] }
      MOCK_CASE_DETAIL[id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+\/issue$/)) {
      const id = url.split('/')[3]
      const detail = MOCK_CASE_DETAIL[id] ?? MOCK_CASE_DETAIL['CASE-001']
      const certNo = `GZ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
      const vCode = `VERIFY${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`
      const updated = {
        ...detail,
        case: { ...detail.case, status: 'ISSUED' },
        certificate: { ...detail.certificate, status: 'ISSUED', certificateNo: certNo, verifyCode: vCode, issuedAt: new Date().toLocaleString() },
        timeline: [...(detail.timeline ?? []), { id: `T${Date.now()}`, event: '出证完成', operator: 'S001', createdAt: new Date().toLocaleString() }],
      }
      MOCK_CASE_DETAIL[id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+\/void$/)) {
      const id = url.split('/')[3]
      const detail = MOCK_CASE_DETAIL[id] ?? MOCK_CASE_DETAIL['CASE-001']
      const body = (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) as { comment?: string }
      const updated = {
        ...detail,
        case: { ...detail.case, status: 'VOIDED' },
        timeline: [...(detail.timeline ?? []), { id: `T${Date.now()}`, event: '案件作废', comment: body?.comment ?? '', operator: 'S001', createdAt: new Date().toLocaleString() }],
      }
      MOCK_CASE_DETAIL[id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/certificates\/[^/]+\/void$/)) {
      const certId = url.split('/')[3]
      const body = (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) as { comment?: string }
      const detail = Object.values(MOCK_CASE_DETAIL).find(d => d.certificate?.id === certId) ?? MOCK_CASE_DETAIL['CASE-001']
      const updatedCert = { ...detail.certificate, status: 'VOIDED', voidedAt: new Date().toLocaleString(), voidReason: body?.comment ?? '作废' }
      const updated = { ...detail, certificate: updatedCert }
      MOCK_CASE_DETAIL[detail.case.id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.startsWith('/verify/')) {
      const code = url.split('/')[2]
      const data = MOCK_VERIFY_RESPONSES[code]
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        if (data) {
          return { data, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
        }
        return { data: null, status: 404, statusText: 'Not Found', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/accept$/)) {
      const segments = url.split('/')
      const id = segments[3]
      const app = MOCK_STAFF_APP_DETAIL[id] ?? MOCK_STAFF_APP_DETAIL['APP-001']
      const updated = { ...app, status: 'ACCEPTED', reviewComment: '准予受理' }
      MOCK_STAFF_APP_DETAIL[id] = updated
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: updated, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url === '/staff/cases' || url.startsWith('/staff/cases?')) {
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: { items: MOCK_STAFF_CASES, total: MOCK_STAFF_CASES.length, page: 1, page_size: 10 }, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+$/)) {
      const id = url.split('/')[3]
      const c = MOCK_STAFF_CASES.find(x => x.id === id) ?? MOCK_STAFF_CASES[0]
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: c, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+\/complete$/)) {
      const id = url.split('/')[3]
      const c = { ...(MOCK_STAFF_CASES.find(x => x.id === id) ?? MOCK_STAFF_CASES[0]), status: 'completed', result: '' }
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: c, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/cases\/[^/]+\/void$/)) {
      const id = url.split('/')[3]
      const c = { ...(MOCK_STAFF_CASES.find(x => x.id === id) ?? MOCK_STAFF_CASES[0]), status: 'voided' }
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: c, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/assign$/)) {
      const id = url.split('/')[3]
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: { id, staffId: 'S001', status: 'assigned', caseId: `CASE-${id.replace('APP', '')}` }, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/staff\/applications\/[^/]+\/supplement$/)) {
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: null, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url === '/external/enforcement/applications' && config.method === 'post') {
      const body = (typeof config.data === 'string' ? JSON.parse(config.data) : config.data) as { case_description?: string; applicant_name?: string }
      const requestNo = `EXT-${Date.now()}`
      const externalRequestNo = body?.case_description ?? `OUT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
      const sourceSystem = config.headers['X-Source-System'] as string ?? 'UNKNOWN'
      const mockResp = { request_no: requestNo, external_request_no: externalRequestNo, source_system: sourceSystem, biz_type: 'ENFORCEMENT', status: 'PROCESSING', current_stage: 'APPLICATION_CREATED', application_id: `APP-${requestNo}` }
      MOCK_EXTERNAL_SEND_RESPONSES[requestNo] = mockResp
      MOCK_EXTERNAL_QUERY_RESPONSES[requestNo] = { ...mockResp, certificate: { id: `CERT-${requestNo}`, certificate_no: `GZ-${new Date().getFullYear()}-EXT-001`, verify_code: `VERIFY-${requestNo}`, verify_url: `https://verify.example.com/VERIFY-${requestNo}`, status: 'ISSUED', issued_at: new Date().toLocaleString(), digest: 'mockdigest' } }
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: { request_no: requestNo }, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url.match(/^\/external\/enforcement\/applications\/[^/]+$/) && config.method === 'get') {
      const requestNo = url.split('/')[3]
      const data = MOCK_EXTERNAL_QUERY_RESPONSES[requestNo]
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        if (data) {
          return { data, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
        }
        return { data: null, status: 404, statusText: 'Not Found', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url === '/admin/audit-logs' || url.startsWith('/admin/audit-logs?')) {
      const params = (config.params ?? {}) as { page?: number; page_size?: number; entity_type?: string; action?: string; operator_type?: string }
      const page = params.page ?? 1
      const pageSize = params.page_size ?? 10
      const filtered = MOCK_AUDIT_LOGS.filter(log => {
        if (params.entity_type && log.entity_type !== params.entity_type) return false
        if (params.action && log.action !== params.action) return false
        if (params.operator_type && log.operator_type !== params.operator_type) return false
        return true
      })
      const start = (page - 1) * pageSize
      const items = filtered.slice(start, start + pageSize)
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: { items, total: filtered.length, page, page_size: pageSize }, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }

    if (url === '/admin/system-params' || url.startsWith('/admin/system-params?')) {
      config.adapter = async () => {
        await new Promise(r => setTimeout(r, MOCK_DELAY))
        return { data: { items: MOCK_SYSTEM_PARAMS, total: MOCK_SYSTEM_PARAMS.length, page: 1, page_size: 10 }, status: 200, statusText: 'OK', headers: {}, config } as unknown as AxiosResponse
      }
      return config
    }
  }
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('userType')
        localStorage.removeItem('userId')
        localStorage.removeItem('username')
        window.location.href = '/login'
        message.error('登录已过期，请重新登录')
      } else if (status === 403) {
        message.error('没有权限访问此资源')
      } else if (status === 404) {
        message.error('请求的资源不存在')
      } else if (status >= 500) {
        message.error('服务器错误，请稍后重试')
      } else {
        const errMsg = (error.response.data as { message?: string })?.message ?? error.message ?? '请求失败'
        message.error(errMsg)
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络')
    } else {
      message.error('请求失败，请稍后重试')
    }
    return Promise.reject(error)
  }
)

export { client, USE_MOCK }

export function isMockMode(): boolean {
  return USE_MOCK
}
