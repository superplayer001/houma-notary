import { client } from '../request'
import type { LoginResponse } from '../../types'

export interface LoginRequest {
  username: string
  password: string
}

export interface BackendLoginResponse {
  token: string
  user_id: string
  user_type: string
  username: string
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const res = await client.post<BackendLoginResponse>('/user/auth/login', data)
  const d = res.data
  return {
    token: d.token,
    userType: d.user_type as LoginResponse['userType'],
    userId: d.user_id,
    username: d.username,
  }
}

export async function loginStaff(data: LoginRequest): Promise<LoginResponse> {
  const res = await client.post<BackendLoginResponse>('/staff/auth/login', data)
  const d = res.data
  return {
    token: d.token,
    userType: d.user_type === 'staff' ? 'staff' : 'admin',
    userId: d.user_id,
    username: d.username,
  }
}

export async function loginAdmin(data: LoginRequest): Promise<LoginResponse> {
  return loginStaff(data)
}
