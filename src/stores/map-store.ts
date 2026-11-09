import { create } from 'zustand'
import type { RegionId } from '@/lib/map-regions'

interface MapState {
  // Which world map is displayed (Palpagos or the World Tree region)
  regionId: RegionId

  // Selected player to highlight/follow
  selectedPlayerId: string | null

  // Auto-follow mode - map centers on selected player
  isFollowing: boolean

  // Show player names on map
  showPlayerNames: boolean

  // Show fast travel towers on map
  showTowers: boolean

  // Refresh rate in ms (default 3000 = 3s for smoother tracking)
  refreshRate: number

  // Actions
  setRegionId: (id: RegionId) => void
  setSelectedPlayerId: (id: string | null) => void
  setIsFollowing: (following: boolean) => void
  setShowPlayerNames: (show: boolean) => void
  setShowTowers: (show: boolean) => void
  setRefreshRate: (rate: number) => void
  reset: () => void
}

export const useMapStore = create<MapState>()((set) => ({
  regionId: 'main',
  selectedPlayerId: null,
  isFollowing: false,
  showPlayerNames: true,
  showTowers: true,
  refreshRate: 3000,

  setRegionId: (id) => set({ regionId: id }),
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),
  setIsFollowing: (following) => set({ isFollowing: following }),
  setShowPlayerNames: (show) => set({ showPlayerNames: show }),
  setShowTowers: (show) => set({ showTowers: show }),
  setRefreshRate: (rate) => set({ refreshRate: rate }),
  reset: () =>
    set({
      regionId: 'main',
      selectedPlayerId: null,
      isFollowing: false,
      showPlayerNames: true,
      showTowers: true,
      refreshRate: 3000,
    }),
}))
