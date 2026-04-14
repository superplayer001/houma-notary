import { create } from 'zustand'

interface AuthState {
  token: string | null
  userType: 'user' | 'staff' | 'admin' | null
  userId: string | null
  username: string | null
  login: (token: string, userType: 'user' | 'staff' | 'admin', userId: string, username: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  userType: localStorage.getItem('userType') as 'user' | 'staff' | 'admin' | null,
  userId: localStorage.getItem('userId'),
  username: localStorage.getItem('username'),
  login: (token, userType, userId, username) => {
    localStorage.setItem('token', token)
    localStorage.setItem('userType', userType)
    localStorage.setItem('userId', userId)
    localStorage.setItem('username', username)
    set({ token, userType, userId, username })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    set({ token: null, userType: null, userId: null, username: null })
  },
}))
