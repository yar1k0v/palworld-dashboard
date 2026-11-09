// Palworld REST API Types

export interface ServerInfo {
  version: string
  servername: string
  description: string
  worldguid?: string
}

export interface Player {
  name: string
  accountName: string
  playerId: string
  /** Platform user id, e.g. "steam_0000..."; this is what kick/ban/unban expect */
  userId: string
  level: number
  building_count?: number
  ip: string
  ping: number
  location_x: number
  location_y: number
}

export interface PlayersResponse {
  players: Player[]
}

export interface ServerMetrics {
  serverfps: number
  currentplayernum: number
  serverframetime: number
  maxplayernum: number
  uptime: number
  /** in-game days elapsed */
  days?: number
  basecampnum?: number
}

export interface ServerSettings {
  // General
  Difficulty: string
  DayTimeSpeedRate: number
  NightTimeSpeedRate: number
  ExpRate: number
  PalCaptureRate: number
  PalSpawnNumRate: number

  // Player Damage & Defense
  PalDamageRateAttack: number
  PalDamageRateDefense: number
  PlayerDamageRateAttack: number
  PlayerDamageRateDefense: number

  // Build
  BuildObjectDamageRate: number
  BuildObjectDeteriorationDamageRate: number

  // Player Stats
  PlayerStomachDecreaceRate: number
  PlayerStaminaDecreaceRate: number
  PlayerAutoHPRegeneRate: number
  PlayerAutoHpRegeneRateInSleep: number

  // Pal Stats
  PalStomachDecreaceRate: number
  PalStaminaDecreaceRate: number
  PalAutoHPRegeneRate: number
  PalAutoHpRegeneRateInSleep: number

  // Collection & Items
  CollectionDropRate: number
  CollectionObjectHpRate: number
  CollectionObjectRespawnSpeedRate: number
  EnemyDropItemRate: number
  DropItemMaxNum: number
  DropItemAliveMaxHours: number

  // Server Config
  ServerName: string
  ServerDescription: string
  PublicIP: string
  PublicPort: number
  ServerPlayerMaxNum: number
  CoopPlayerMaxNum: number
  Region: string

  // Features
  bIsMultiplay: boolean
  bIsPvP: boolean
  bEnableFastTravel: boolean
  bExistPlayerAfterLogout: boolean
  RCONEnabled: boolean
  RCONPort: number
  RESTAPIEnabled: boolean
  RESTAPIPort: number

  // Other
  DeathPenalty: string
  bUseAuth: boolean
  BanListURL: string
  AllowConnectPlatform: string

  // Allow additional properties since API may return more
  [key: string]: string | number | boolean
}

// API Request Types
export interface AnnounceRequest {
  message: string
}

export interface KickRequest {
  userid: string
  message?: string
}

export interface BanRequest {
  userid: string
}

export interface UnbanRequest {
  userid: string
}

export interface ShutdownRequest {
  waittime?: number
  message?: string
}

// API Response Types
export interface ApiError {
  error: string
  message?: string
}
