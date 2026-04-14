import { client } from '../request'
import type { LoginResponse } from '../../types'

export interface LoginByPhoneRequest {
  phone: string
}

export interface BackendLoginResponse {
  token: string
  user: {
    id: string
    phone: string
  }
}

export interface BackendLoginError {
  message?: string
}

export async function loginByPhone(data: LoginByPhoneRequest): Promise<LoginResponse> {
  const res = await client.post<BackendLoginResponse>('/user/auth/login', data)
  const d = res.data
  return {
    token: d.token,
    userType: 'user',
    userId: d.user.id,
    username: d.user.phone,
  }
}

interface BackendStaffLoginResponse {
  token: string
  staff: {
    id: string
    username: string
    display_name: string
    role: string
  }
}

export async function loginStaff(username: string): Promise<LoginResponse> {
  const res = await client.post<BackendStaffLoginResponse>('/staff/auth/login', { username })
  const d = res.data
  const role = d.staff.role?.toUpperCase()
  return {
    token: d.token,
    userType: role === 'ADMIN' ? 'admin' : 'staff',
    userId: d.staff.id,
    username: d.staff.display_name || d.staff.username,
  }
}

export async function loginAdmin(username: string): Promise<LoginResponse> {
  return loginStaff(username)
}
