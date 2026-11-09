import { RefreshCw, Search, Settings as SettingsIcon, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useSettings } from '@/hooks/use-palworld'
import { useSettingsStore, SETTINGS_CATEGORIES } from '@/stores/settings-store'

// Human-readable labels for settings
const SETTING_LABELS: Record<string, string> = {
  Difficulty: 'Difficulty',
  DayTimeSpeedRate: 'Day Time Speed',
  NightTimeSpeedRate: 'Night Time Speed',
  ExpRate: 'Experience Rate',
  PalCaptureRate: 'Pal Capture Rate',
  PalSpawnNumRate: 'Pal Spawn Rate',
  PalDamageRateAttack: 'Pal Attack Damage',
  PalDamageRateDefense: 'Pal Defense',
  PlayerDamageRateAttack: 'Player Attack Damage',
  PlayerDamageRateDefense: 'Player Defense',
  BuildObjectDamageRate: 'Build Object Damage',
  BuildObjectDeteriorationDamageRate: 'Build Deterioration',
  PlayerStomachDecreaceRate: 'Player Hunger Rate',
  PlayerStaminaDecreaceRate: 'Player Stamina Drain',
  PlayerAutoHPRegeneRate: 'Player HP Regen',
  PlayerAutoHpRegeneRateInSleep: 'Player HP Regen (Sleep)',
  PalStomachDecreaceRate: 'Pal Hunger Rate',
  PalStaminaDecreaceRate: 'Pal Stamina Drain',
  PalAutoHPRegeneRate: 'Pal HP Regen',
  PalAutoHpRegeneRateInSleep: 'Pal HP Regen (Sleep)',
  CollectionDropRate: 'Collection Drop Rate',
  CollectionObjectHpRate: 'Collection Object HP',
  CollectionObjectRespawnSpeedRate: 'Collection Respawn Speed',
  EnemyDropItemRate: 'Enemy Drop Rate',
  DropItemMaxNum: 'Max Dropped Items',
  DropItemAliveMaxHours: 'Drop Item Lifetime (hrs)',
  ServerName: 'Server Name',
  ServerDescription: 'Server Description',
  PublicIP: 'Public IP',
  PublicPort: 'Public Port',
  ServerPlayerMaxNum: 'Max Players',
  CoopPlayerMaxNum: 'Co-op Max Players',
  Region: 'Region',
  bIsMultiplay: 'Multiplayer',
  bIsPvP: 'PvP Enabled',
  bEnableFastTravel: 'Fast Travel',
  bExistPlayerAfterLogout: 'Player Exists After Logout',
  RCONEnabled: 'RCON Enabled',
  RCONPort: 'RCON Port',
  RESTAPIEnabled: 'REST API Enabled',
  RESTAPIPort: 'REST API Port',
  DeathPenalty: 'Death Penalty',
  bUseAuth: 'Use Auth',
  BanListURL: 'Ban List URL',
  AllowConnectPlatform: 'Allowed Platforms',
}

function formatValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  if (typeof value === 'number') {
    // Format rates as percentage-like
    if (value >= 0 && value <= 10) {
      return `${value}x`
    }
    return value.toString()
  }
  if (typeof value === 'string') {
    return value || '—'
  }
  return String(value)
}

function SettingRow({ label, value }: { label: string; value: unknown }) {
  const displayValue = formatValue(value)
  const isBool = typeof value === 'boolean'

  return (
    <div className="flex flex-col gap-1 py-3 border-b last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      {isBool ? (
        <Badge variant={value ? 'default' : 'secondary'} className="w-fit">
          {displayValue}
        </Badge>
      ) : (
        <span className="font-medium text-sm break-all sm:break-normal sm:text-right">{displayValue}</span>
      )}
    </div>
  )
}

export function SettingsPage() {
  const { data: settings, isLoading, mutate } = useSettings()
  const { searchFilter, activeCategory, setSearchFilter, setActiveCategory } =
    useSettingsStore()

  // Get all settings as entries
  const allSettings = settings ? Object.entries(settings) : []

  // Filter by search
  const filteredSettings = allSettings.filter(([key, value]) => {
    const label = SETTING_LABELS[key] || key
    const valueStr = formatValue(value)
    const searchLower = searchFilter.toLowerCase()
    return (
      label.toLowerCase().includes(searchLower) ||
      key.toLowerCase().includes(searchLower) ||
      valueStr.toLowerCase().includes(searchLower)
    )
  })

  // Filter by category
  const categorySettings =
    activeCategory === 'all'
      ? filteredSettings
      : filteredSettings.filter(([key]) =>
          SETTINGS_CATEGORIES[activeCategory].keys.includes(key)
        )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            View your server configuration settings
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Read-Only Settings</AlertTitle>
        <AlertDescription>
          Server settings cannot be modified through the REST API. To change settings, edit the{' '}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">PalWorldSettings.ini</code>{' '}
          file on your server and restart the server for changes to take effect.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="space-y-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Server Configuration
            </CardTitle>
            <CardDescription className="text-sm">
              These settings are read-only and configured in the server files
            </CardDescription>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search settings..."
              className="pl-8"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Tabs
              value={activeCategory}
              onValueChange={(v) => setActiveCategory(v as typeof activeCategory)}
            >
              <TabsList className="mb-4 flex-wrap h-auto gap-1 w-full justify-start">
                {Object.entries(SETTINGS_CATEGORIES).map(([key, { label }]) => (
                  <TabsTrigger key={key} value={key} className="text-xs px-2 sm:px-3">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {Object.keys(SETTINGS_CATEGORIES).map((category) => (
                <TabsContent key={category} value={category} className="mt-0">
                  {categorySettings.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground">
                      No settings found
                    </div>
                  ) : (
                    <div className="rounded-lg border p-3 sm:p-4">
                      {categorySettings.map(([key, value]) => (
                        <SettingRow
                          key={key}
                          label={SETTING_LABELS[key] || key}
                          value={value}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
