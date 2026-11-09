import { create } from 'zustand'

type SettingsCategory =
  | 'all'
  | 'general'
  | 'gameplay'
  | 'player'
  | 'pal'
  | 'world'
  | 'server'

interface SettingsState {
  // Search/filter
  searchFilter: string

  // Active category tab
  activeCategory: SettingsCategory

  // Actions
  setSearchFilter: (filter: string) => void
  setActiveCategory: (category: SettingsCategory) => void
  reset: () => void
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  // Initial state
  searchFilter: '',
  activeCategory: 'all',

  // Actions
  setSearchFilter: (filter) => set({ searchFilter: filter }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  reset: () =>
    set({
      searchFilter: '',
      activeCategory: 'all',
    }),
}))

// Settings categories for organization
export const SETTINGS_CATEGORIES: Record<
  SettingsCategory,
  { label: string; keys: string[] }
> = {
  all: { label: 'All Settings', keys: [] },
  general: {
    label: 'General',
    keys: ['Difficulty', 'DeathPenalty', 'bUseAuth', 'AllowConnectPlatform'],
  },
  gameplay: {
    label: 'Gameplay Rates',
    keys: [
      'DayTimeSpeedRate',
      'NightTimeSpeedRate',
      'ExpRate',
      'PalCaptureRate',
      'PalSpawnNumRate',
    ],
  },
  player: {
    label: 'Player Settings',
    keys: [
      'PlayerDamageRateAttack',
      'PlayerDamageRateDefense',
      'PlayerStomachDecreaceRate',
      'PlayerStaminaDecreaceRate',
      'PlayerAutoHPRegeneRate',
      'PlayerAutoHpRegeneRateInSleep',
    ],
  },
  pal: {
    label: 'Pal Settings',
    keys: [
      'PalDamageRateAttack',
      'PalDamageRateDefense',
      'PalStomachDecreaceRate',
      'PalStaminaDecreaceRate',
      'PalAutoHPRegeneRate',
      'PalAutoHpRegeneRateInSleep',
    ],
  },
  world: {
    label: 'World Settings',
    keys: [
      'CollectionDropRate',
      'CollectionObjectHpRate',
      'CollectionObjectRespawnSpeedRate',
      'EnemyDropItemRate',
      'DropItemMaxNum',
      'DropItemAliveMaxHours',
      'BuildObjectDamageRate',
      'BuildObjectDeteriorationDamageRate',
    ],
  },
  server: {
    label: 'Server Config',
    keys: [
      'ServerName',
      'ServerDescription',
      'PublicIP',
      'PublicPort',
      'ServerPlayerMaxNum',
      'CoopPlayerMaxNum',
      'Region',
      'bIsMultiplay',
      'bIsPvP',
      'bEnableFastTravel',
      'bExistPlayerAfterLogout',
      'RCONEnabled',
      'RCONPort',
      'RESTAPIEnabled',
      'RESTAPIPort',
      'BanListURL',
    ],
  },
}
