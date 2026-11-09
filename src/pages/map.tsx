import { useEffect, useRef, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, FeatureGroup } from 'react-leaflet'
import L from 'leaflet'
import { RefreshCw, Users, Eye, EyeOff, Crosshair, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useMapPlayers } from '@/hooks/use-palworld'
import { useMapStore } from '@/stores/map-store'
import {
  MAP_EXTENT,
  REGIONS,
  REGION_LIST,
  TRAVEL_POINTS,
  gameToLatLng,
  normalizedToLatLng,
  regionOf,
  type Region,
} from '@/lib/map-regions'
import type { Player } from '@/types/palworld'
import 'leaflet/dist/leaflet.css'

// Custom CRS matching the reference implementation
// Transformation: (factorx, offsetx, -factory, offsety)
// The negative factory flips the Y axis to match game coordinates
const factorx = 0.25
const factory = 0.25

const customCRS = L.extend({}, L.CRS.Simple, {
  transformation: new L.Transformation(factorx, 128, -factory, 128),
})

// Tower icon for fast travel points
const towerIcon = new L.Icon({
  iconUrl: '/tower.svg',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})


// Generate a consistent color from player name
function getPlayerColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 70%, 50%)`
}

// Generate initials from player name (max 2 chars)
function getPlayerInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Create player marker icon with unique avatar based on name
function createPlayerIcon(name: string, isSelected: boolean): L.DivIcon {
  const color = getPlayerColor(name)
  const initials = getPlayerInitials(name)

  return L.divIcon({
    className: 'player-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute w-10 h-10 rounded-full ${isSelected ? 'animate-ping' : ''}" style="background-color: ${color}; opacity: 0.3;"></div>
        <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg ${isSelected ? 'ring-2 ring-white ring-offset-1' : ''}" style="background-color: ${color};">
          ${initials}
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

// Component to handle map auto-follow
function MapFollower({
  player,
  isFollowing,
  region,
}: {
  player: Player | null
  isFollowing: boolean
  region: Region
}) {
  const map = useMap()

  useEffect(() => {
    if (isFollowing && player) {
      // only follow while the player is on the region we're displaying
      if (regionOf(player.location_x, player.location_y) !== region.id) return
      const latLng = gameToLatLng(player.location_x, player.location_y, region)
      map.panTo(latLng, { animate: true, duration: 0.5 })
    }
  }, [map, player, isFollowing, region, player?.location_x, player?.location_y])

  return null
}

// Player list sidebar component
function PlayerList({
  players,
  selectedPlayerId,
  onSelectPlayer,
}: {
  players: Player[]
  selectedPlayerId: string | null
  onSelectPlayer: (id: string | null) => void
}) {
  return (
    <div className="space-y-1 max-h-[300px] overflow-y-auto">
      {players.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No players online
        </p>
      ) : (
        players.map((player) => (
          <button
            key={player.playerId}
            onClick={() =>
              onSelectPlayer(
                selectedPlayerId === player.playerId ? null : player.playerId
              )
            }
            className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
              selectedPlayerId === player.playerId
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-accent'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  selectedPlayerId === player.playerId
                    ? 'bg-primary-foreground'
                    : 'bg-green-500'
                }`}
              />
              <span className="text-sm font-medium truncate">{player.name}</span>
            </div>
            <Badge
              variant={
                selectedPlayerId === player.playerId ? 'secondary' : 'outline'
              }
              className="text-xs flex-shrink-0"
            >
              Lv.{player.level}
            </Badge>
          </button>
        ))
      )}
    </div>
  )
}

export function MapPage() {
  const mapRef = useRef<L.Map | null>(null)
  const { data, isLoading, mutate } = useMapPlayers()
  const {
    regionId,
    selectedPlayerId,
    isFollowing,
    showPlayerNames,
    showTowers,
    setRegionId,
    setSelectedPlayerId,
    setIsFollowing,
    setShowPlayerNames,
    setShowTowers,
  } = useMapStore()

  // memoized so the derived lists below don't recompute on every render
  const players = useMemo(() => data?.players ?? [], [data?.players])
  const region = REGIONS[regionId]

  // Palpagos and the World Tree are separate maps, so a player is only
  // drawable on the one whose bounds contain them.
  const playersHere = useMemo(
    () => players.filter((p) => regionOf(p.location_x, p.location_y) === regionId),
    [players, regionId]
  )
  const elsewhereCount = players.length - playersHere.length

  const selectedPlayer = useMemo(
    () => players.find((p) => p.playerId === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  )

  // Default center - middle of the map (0, 0 in -512 to 512 space)
  const mapCenter = useMemo(() => L.latLng(0, 0), [])
  const [tilesMissing, setTilesMissing] = useState(false)

  const handleCenterOnPlayer = () => {
    if (!selectedPlayer || !mapRef.current) return
    const target = regionOf(selectedPlayer.location_x, selectedPlayer.location_y)
    // jump to the player's own map first if they're not on this one
    if (target !== regionId) {
      setRegionId(target)
      return
    }
    const latLng = gameToLatLng(
      selectedPlayer.location_x,
      selectedPlayer.location_y,
      region
    )
    mapRef.current.flyTo(latLng, 5, { animate: true, duration: 0.5 })
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Live Map
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track player locations in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            {players.length} online
          </Badge>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_280px]">
        {/* Map Container */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <Skeleton className="h-[500px] w-full" />
            ) : (
              <div className="h-[500px] md:h-[600px] relative">
                {tilesMissing && (
                  <div className="absolute inset-x-0 top-0 z-[1000] bg-background/90 p-3 text-center text-sm">
                    Map tiles not found. Generate them from your own game install:{' '}
                    <code>python tools/make_tiles.py</code> (see README).
                  </div>
                )}
                <MapContainer
                  ref={mapRef}
                  center={mapCenter}
                  zoom={3}
                  maxZoom={7}
                  className="h-full w-full z-0"
                  style={{ backgroundColor: '#0c161e' }}
                  zoomControl={false}
                  crs={customCRS}
                >
                  <TileLayer
                    key={region.id}
                    url={region.tileUrl}
                    tileSize={256}
                    maxNativeZoom={region.nativeZoom}
                    bounds={MAP_EXTENT}
                    noWrap
                    attribution="Map art © Pocketpair, Inc."
                    eventHandlers={{
                      tileerror: () => setTilesMissing(true),
                      tileload: () => setTilesMissing(false),
                    }}
                  />
                  {/* Fast travel towers (Palpagos only) */}
                  {showTowers &&
                    region.id === 'main' &&
                    TRAVEL_POINTS.map(([u, v], index) => (
                      <Marker
                        key={`tower-${index}`}
                        position={normalizedToLatLng(u, v)}
                        icon={towerIcon}
                      />
                    ))}

                  {/* Player markers */}
                  <FeatureGroup pane="markerPane">
                  {playersHere.map((player) => {
                    const position = gameToLatLng(
                      player.location_x,
                      player.location_y,
                      region
                    )
                    const isSelected = player.playerId === selectedPlayerId
                    return (
                      <Marker
                        key={player.playerId}
                        position={position}
                        icon={createPlayerIcon(player.name, isSelected)}
                        eventHandlers={{
                          click: () => setSelectedPlayerId(player.playerId),
                        }}
                      >
                        {showPlayerNames && (
                          <Popup>
                            <div className="text-center">
                              <p className="font-semibold">{player.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Level {player.level} | Ping: {Math.round(player.ping)}ms
                              </p>
                              <p className="text-xs font-mono mt-1">
                                {Math.round(player.location_x)},{' '}
                                {Math.round(player.location_y)}
                              </p>
                            </div>
                          </Popup>
                        )}
                      </Marker>
                    )
                  })}
                  </FeatureGroup>
                  <MapFollower
                    player={selectedPlayer}
                    isFollowing={isFollowing}
                    region={region}
                  />
                </MapContainer>

                {/* Region switcher - Palpagos and the World Tree are separate maps */}
                <div className="absolute top-2 left-2 z-[1000] flex items-center gap-1 rounded-lg bg-background/90 p-1 shadow-md backdrop-blur">
                  {REGION_LIST.map((r) => (
                    <Button
                      key={r.id}
                      size="sm"
                      variant={r.id === regionId ? 'default' : 'ghost'}
                      className="h-7 px-2 text-xs"
                      onClick={() => setRegionId(r.id)}
                    >
                      {r.label}
                    </Button>
                  ))}
                  {elsewhereCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {elsewhereCount} elsewhere
                    </Badge>
                  )}
                </div>

                {/* Map overlay controls */}
                <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1">
                  <Button
                    size="icon"
                    variant={showPlayerNames ? 'default' : 'secondary'}
                    className="h-8 w-8"
                    onClick={() => setShowPlayerNames(!showPlayerNames)}
                    title={showPlayerNames ? 'Hide popups' : 'Show popups'}
                  >
                    {showPlayerNames ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant={showTowers ? 'default' : 'secondary'}
                    className="h-8 w-8"
                    onClick={() => setShowTowers(!showTowers)}
                    title={showTowers ? 'Hide towers' : 'Show towers'}
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Player List Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Online Players
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <PlayerList
                  players={players}
                  selectedPlayerId={selectedPlayerId}
                  onSelectPlayer={setSelectedPlayerId}
                />
              )}
            </CardContent>
          </Card>

          {selectedPlayer && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Selected Player
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{selectedPlayer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Level {selectedPlayer.level}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Ping</span>
                    <p className="font-medium">{Math.round(selectedPlayer.ping)}ms</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Coords</span>
                    <p className="font-mono">
                      {Math.round(selectedPlayer.location_x)},{' '}
                      {Math.round(selectedPlayer.location_y)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCenterOnPlayer}
                  >
                    <Crosshair className="mr-1 h-3 w-3" />
                    Center
                  </Button>
                  <Button
                    size="sm"
                    variant={isFollowing ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setIsFollowing(!isFollowing)}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
