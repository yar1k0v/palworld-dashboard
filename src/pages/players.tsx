import { RefreshCw, Search, UserX, Ban, UserCheck, ArrowUpDown, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { usePlayers } from '@/hooks/use-palworld'
import { usePlayersStore } from '@/stores/players-store'
import { kickPlayer, banPlayer, unbanPlayer } from '@/lib/api'
import type { Player } from '@/types/palworld'

export function PlayersPage() {
  const { data, isLoading, mutate } = usePlayers()
  const {
    selectedPlayer,
    searchQuery,
    sortConfig,
    isKickDialogOpen,
    isBanDialogOpen,
    kickMessage,
    isKicking,
    isBanning,
    isUnbanning,
    unbanUserId,
    selectPlayer,
    setSearchQuery,
    toggleSort,
    setKickDialogOpen,
    setBanDialogOpen,
    setKickMessage,
    setIsKicking,
    setIsBanning,
    setIsUnbanning,
    setUnbanUserId,
  } = usePlayersStore()

  const players = data?.players ?? []

  // Filter players by search
  const filteredPlayers = players.filter((player) =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.accountName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort players
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const aVal = a[sortConfig.field]
    const bVal = b[sortConfig.field]

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal
    }

    return 0
  })

  const openKickDialog = (player: Player) => {
    selectPlayer(player)
    setKickMessage('')
    setKickDialogOpen(true)
  }

  const openBanDialog = (player: Player) => {
    selectPlayer(player)
    setBanDialogOpen(true)
  }

  const handleKick = async () => {
    if (!selectedPlayer) return
    setIsKicking(true)
    try {
      await kickPlayer({
        userid: selectedPlayer.userId,
        message: kickMessage || undefined,
      })
      toast.success(`${selectedPlayer.name} has been kicked`)
      setKickDialogOpen(false)
      mutate()
    } catch {
      toast.error('Failed to kick player')
    } finally {
      setIsKicking(false)
    }
  }

  const handleBan = async () => {
    if (!selectedPlayer) return
    setIsBanning(true)
    try {
      await banPlayer({ userid: selectedPlayer.userId })
      toast.success(`${selectedPlayer.name} has been banned`)
      setBanDialogOpen(false)
      mutate()
    } catch {
      toast.error('Failed to ban player')
    } finally {
      setIsBanning(false)
    }
  }

  const handleUnban = async () => {
    if (!unbanUserId.trim()) return
    setIsUnbanning(true)
    try {
      await unbanPlayer({ userid: unbanUserId })
      toast.success('Player has been unbanned')
      setUnbanUserId('')
    } catch {
      toast.error('Failed to unban player')
    } finally {
      setIsUnbanning(false)
    }
  }

  const SortableHeader = ({
    field,
    children,
  }: {
    field: 'name' | 'accountName' | 'level' | 'ping'
    children: React.ReactNode
  }) => (
    <TableHead>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => toggleSort(field)}
      >
        {children}
        <ArrowUpDown className="ml-2 h-3 w-3" />
      </Button>
    </TableHead>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage online players on your server
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        {/* Player List */}
        <Card className="lg:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Online Players
                  {!isLoading && (
                    <Badge variant="secondary">{players.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
                  Players currently connected to the server
                </CardDescription>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : sortedPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-lg font-medium">No players online</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? 'No players match your search'
                    : 'Players will appear here when they connect'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="space-y-3 md:hidden">
                  {sortedPlayers.map((player) => (
                    <div
                      key={player.playerId}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="font-medium truncate">{player.name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">Lv. {player.level}</Badge>
                          <span>{player.ping}ms</span>
                          {player.accountName && (
                            <span className="truncate max-w-[120px]">{player.accountName}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => openKickDialog(player)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => openBanDialog(player)}
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Desktop table view */}
                <div className="hidden md:block rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHeader field="name">Name</SortableHeader>
                        <SortableHeader field="accountName">Account</SortableHeader>
                        <SortableHeader field="level">Level</SortableHeader>
                        <SortableHeader field="ping">Ping</SortableHeader>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPlayers.map((player) => (
                        <TableRow key={player.playerId}>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {player.accountName || '—'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Lv. {player.level}</Badge>
                          </TableCell>
                          <TableCell>{player.ping}ms</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openKickDialog(player)}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => openBanDialog(player)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Unban Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Unban Player
            </CardTitle>
            <CardDescription>
              Restore access for a banned player
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="User ID (e.g. steam_0000...)"
              value={unbanUserId}
              onChange={(e) => setUnbanUserId(e.target.value)}
            />
            <Button
              className="w-full"
              onClick={handleUnban}
              disabled={!unbanUserId.trim() || isUnbanning}
            >
              {isUnbanning ? 'Unbanning...' : 'Unban Player'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Kick Dialog */}
      <Dialog open={isKickDialogOpen} onOpenChange={setKickDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kick Player</DialogTitle>
            <DialogDescription>
              Kick <span className="font-semibold">{selectedPlayer?.name}</span> from the server.
              They can rejoin immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Kick message (optional)"
              value={kickMessage}
              onChange={(e) => setKickMessage(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKickDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleKick} disabled={isKicking}>
              {isKicking ? 'Kicking...' : 'Kick Player'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <AlertDialog open={isBanDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban{' '}
              <span className="font-semibold">{selectedPlayer?.name}</span>?
              This will permanently prevent them from joining the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              disabled={isBanning}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBanning ? 'Banning...' : 'Ban Player'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
