export type DeviceType = 'mobile' | 'desktop'

const MOBILE_BREAKPOINT = 768

export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function isDesktop(): boolean {
  return !isMobile()
}

export function getDeviceType(): DeviceType {
  return isMobile() ? 'mobile' : 'desktop'
}
