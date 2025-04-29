
import * as React from "react"
import { create } from 'zustand'

const MOBILE_BREAKPOINT = 768

// Define a Zustand store for mobile state
export const useMobileStore = create<{
  isMobile: boolean
  setIsMobile: (isMobile: boolean) => void
}>((set) => ({
  isMobile: typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  setIsMobile: (isMobile) => set({ isMobile }),
}))

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
      // Also update the Zustand store
      useMobileStore.getState().setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    // Initialize the Zustand store
    useMobileStore.getState().setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
