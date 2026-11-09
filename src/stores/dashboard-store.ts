import { create } from 'zustand'

interface DashboardState {
  // Broadcast message input
  broadcastMessage: string

  // Loading states for actions
  isSaving: boolean
  isBroadcasting: boolean
  isShuttingDown: boolean

  // Actions
  setBroadcastMessage: (message: string) => void
  setIsSaving: (loading: boolean) => void
  setIsBroadcasting: (loading: boolean) => void
  setIsShuttingDown: (loading: boolean) => void
  reset: () => void
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  // Initial state
  broadcastMessage: '',
  isSaving: false,
  isBroadcasting: false,
  isShuttingDown: false,

  // Actions
  setBroadcastMessage: (message: string) => set({ broadcastMessage: message }),
  setIsSaving: (loading: boolean) => set({ isSaving: loading }),
  setIsBroadcasting: (loading: boolean) => set({ isBroadcasting: loading }),
  setIsShuttingDown: (loading: boolean) => set({ isShuttingDown: loading }),
  reset: () =>
    set({
      broadcastMessage: '',
      isSaving: false,
      isBroadcasting: false,
      isShuttingDown: false,
    }),
}))
