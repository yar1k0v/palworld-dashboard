import { create } from 'zustand'
import type { Player } from '@/types/palworld'

type SortField = 'name' | 'accountName' | 'level' | 'ping'
type SortDirection = 'asc' | 'desc'

interface SortConfig {
  field: SortField
  direction: SortDirection
}

interface PlayersState {
  // Selected player for actions
  selectedPlayer: Player | null

  // Search/filter
  searchQuery: string

  // Sorting
  sortConfig: SortConfig

  // Dialog states
  isKickDialogOpen: boolean
  isBanDialogOpen: boolean
  kickMessage: string

  // Loading states
  isKicking: boolean
  isBanning: boolean
  isUnbanning: boolean

  // Unban input
  unbanUserId: string

  // Actions
  selectPlayer: (player: Player | null) => void
  setSearchQuery: (query: string) => void
  setSortConfig: (config: SortConfig) => void
  toggleSort: (field: SortField) => void
  setKickDialogOpen: (open: boolean) => void
  setBanDialogOpen: (open: boolean) => void
  setKickMessage: (message: string) => void
  setIsKicking: (loading: boolean) => void
  setIsBanning: (loading: boolean) => void
  setIsUnbanning: (loading: boolean) => void
  setUnbanUserId: (userId: string) => void
  reset: () => void
}

export const usePlayersStore = create<PlayersState>()((set, get) => ({
  // Initial state
  selectedPlayer: null,
  searchQuery: '',
  sortConfig: { field: 'name', direction: 'asc' },
  isKickDialogOpen: false,
  isBanDialogOpen: false,
  kickMessage: '',
  isKicking: false,
  isBanning: false,
  isUnbanning: false,
  unbanUserId: '',

  // Actions
  selectPlayer: (player) => set({ selectedPlayer: player }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortConfig: (config) => set({ sortConfig: config }),

  toggleSort: (field) => {
    const { sortConfig } = get()
    if (sortConfig.field === field) {
      set({
        sortConfig: {
          field,
          direction: sortConfig.direction === 'asc' ? 'desc' : 'asc',
        },
      })
    } else {
      set({ sortConfig: { field, direction: 'asc' } })
    }
  },

  setKickDialogOpen: (open) => set({ isKickDialogOpen: open }),
  setBanDialogOpen: (open) => set({ isBanDialogOpen: open }),
  setKickMessage: (message) => set({ kickMessage: message }),
  setIsKicking: (loading) => set({ isKicking: loading }),
  setIsBanning: (loading) => set({ isBanning: loading }),
  setIsUnbanning: (loading) => set({ isUnbanning: loading }),
  setUnbanUserId: (userId) => set({ unbanUserId: userId }),

  reset: () =>
    set({
      selectedPlayer: null,
      searchQuery: '',
      isKickDialogOpen: false,
      isBanDialogOpen: false,
      kickMessage: '',
      isKicking: false,
      isBanning: false,
      isUnbanning: false,
      unbanUserId: '',
    }),
}))
