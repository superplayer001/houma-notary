import type { Application, Material, Case } from '../../types'

export const MOCK_DELAY = 300

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'APP-001',
    userId: 'U001',
    status: 'pending',
    bizType: 'property',
    title: '房产继承公证',
    description: '父亲去世，需要办理房产继承公证',
    createdAt: '2024-01-15 10:30:00',
    updatedAt: '2024-01-15 10:30:00',
    materials: [],
  },
  {
    id: 'APP-002',
    userId: 'U001',
    status: 'completed',
    bizType: 'will',
    title: '遗嘱公证',
    description: '本人自愿订立遗嘱公证',
    createdAt: '2024-01-10 09:00:00',
    updatedAt: '2024-01-12 16:00:00',
    materials: [],
  },
  {
    id: 'APP-003',
    userId: 'U001',
    status: 'processing',
    bizType: 'ENFORCEMENT',
    title: '强制执行公证',
    description: '借款合同赋予强制执行效力',
    createdAt: '2024-01-14 14:20:00',
    updatedAt: '2024-01-14 14:20:00',
    materials: [],
  },
  {
    id: 'APP-004',
    userId: 'U001',
    status: 'draft',
    bizType: 'DEPOSIT',
    title: '存款继承公证',
    description: '母亲去世，办理存款继承公证',
    createdAt: '2024-01-16 08:45:00',
    updatedAt: '2024-01-16 08:45:00',
    materials: [],
  },
  {
    id: 'APP-005',
    userId: 'U001',
    status: 'supplement_required',
    bizType: 'property',
    title: '房产抵押公证',
    description: '需要补充身份证原件',
    supplementReason: '请补充申请人身份证原件及户口本复印件',
    createdAt: '2024-01-16 14:00:00',
    updatedAt: '2024-01-17 09:00:00',
    materials: [],
  },
]

export const MOCK_CASES: Case[] = [
  {
    id: 'CASE-001',
    applicationId: 'APP-002',
    staffId: 'S001',
    status: 'completed',
    bizType: 'will',
    result: '遗嘱公证办理完成',
    certificateNo: 'GZ-2024-001',
    verifyCode: 'VERIFY001',
    certificateStatus: 'issued',
    issuedAt: '2024-01-12 16:00:00',
    acceptedAt: '2024-01-11 09:00:00',
    completedAt: '2024-01-12 16:00:00',
    createdAt: '2024-01-10 09:00:00',
    updatedAt: '2024-01-12 16:00:00',
  },
]

let _nextAppId = MOCK_APPLICATIONS.length + 1
let _nextCaseId = MOCK_CASES.length + 1

export function mockCreateApplication(fields: Partial<Application>): Application {
  const app: Application = {
    id: `APP-${String(_nextAppId++).padStart(3, '0')}`,
    userId: 'U001',
    status: 'draft',
    bizType: fields.bizType ?? 'other',
    title: fields.title ?? '',
    description: fields.description ?? '',
    createdAt: new Date().toLocaleString(),
    updatedAt: new Date().toLocaleString(),
    materials: [],
  }
  MOCK_APPLICATIONS.push(app)
  return app
}

export function mockSubmitApplication(id: string): Application | null {
  const app = MOCK_APPLICATIONS.find(a => a.id === id)
  if (!app) return null
  app.status = 'submitted'
  app.updatedAt = new Date().toLocaleString()
  return app
}

export function mockWithdrawApplication(id: string): Application | null {
  const app = MOCK_APPLICATIONS.find(a => a.id === id)
  if (!app) return null
  app.status = 'withdrawn'
  app.updatedAt = new Date().toLocaleString()
  return app
}

export function mockSubmitSupplement(id: string): Application | null {
  const app = MOCK_APPLICATIONS.find(a => a.id === id)
  if (!app) return null
  app.status = 'pending'
  app.supplementReason = undefined
  app.updatedAt = new Date().toLocaleString()
  return app
}

export function mockUploadMaterial(applicationId: string, name: string): Material {
  const material: Material = {
    id: `MAT-${Date.now()}`,
    name,
    url: `https://example.com/materials/${name}`,
    type: name.split('.').pop() ?? 'unknown',
    uploadedAt: new Date().toLocaleString(),
  }
  const app = MOCK_APPLICATIONS.find(a => a.id === applicationId)
  if (app) {
    app.materials = app.materials ?? []
    app.materials.push(material)
  }
  return material
}
