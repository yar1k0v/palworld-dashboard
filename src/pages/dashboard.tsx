import { RefreshCw, Save, Radio, Power, AlertTriangle, Users, Cpu, Clock, Wifi, Calendar, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useDashboardData } from '@/hooks/use-palworld'
import { useDashboardStore } from '@/stores/dashboard-store'
import { announce, saveWorld, shutdownServer, stopServer } from '@/lib/api'

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)

  if (days > 0) return `${days}d ${hours}h ${mins}m`
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

export function DashboardPage() {
  const [copiedGuid, setCopiedGuid] = useState(false)
  const { serverInfo, metrics, players, isLoading, mutate } = useDashboardData()
  const {
    broadcastMessage,
    isSaving,
    isBroadcasting,
    isShuttingDown,
    setBroadcastMessage,
    setIsSaving,
    setIsBroadcasting,
    setIsShuttingDown,
  } = useDashboardStore()

  const handleSaveWorld = async () => {
    setIsSaving(true)
    try {
      await saveWorld()
      toast.success('World saved successfully')
    } catch {
      toast.error('Failed to save world')
    } finally {
      setIsSaving(false)
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return
    setIsBroadcasting(true)
    try {
      await announce({ message: broadcastMessage })
      toast.success('Message broadcast successfully')
      setBroadcastMessage('')
    } catch {
      toast.error('Failed to broadcast message')
    } finally {
      setIsBroadcasting(false)
    }
  }

  const handleShutdown = async () => {
    setIsShuttingDown(true)
    try {
      await shutdownServer({ waittime: 30, message: 'Server shutting down in 30 seconds...' })
      toast.success('Server shutdown initiated')
    } catch {
      toast.error('Failed to shutdown server')
    } finally {
      setIsShuttingDown(false)
    }
  }

  const handleForceStop = async () => {
    setIsShuttingDown(true)
    try {
      await stopServer()
      toast.success('Server stopped')
    } catch {
      toast.error('Failed to stop server')
    } finally {
      setIsShuttingDown(false)
    }
  }

  const handleCopyGuid = async () => {
    if (serverInfo.data?.worldguid) {
      await navigator.clipboard.writeText(serverInfo.data.worldguid)
      setCopiedGuid(true)
      setTimeout(() => setCopiedGuid(false), 2000)
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Monitor and control your Palworld server
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="w-fit">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Players Online</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {players.data?.players.length ?? 0}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/ {metrics.data?.maxplayernum ?? '?'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server FPS</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics.data?.serverfps?.toFixed(1) ?? '—'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics.data?.uptime ? formatUptime(metrics.data.uptime) : '—'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frame Time</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics.data?.serverframetime?.toFixed(2) ?? '—'}
                <span className="text-sm font-normal text-muted-foreground"> ms</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In-Game Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics.data?.days ?? '—'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {/* Server Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Server Information</CardTitle>
            <CardDescription>Details about your Palworld server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Server Name</span>
                  <span className="font-medium">{serverInfo.data?.servername ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Version</span>
                  <Badge variant="secondary">{serverInfo.data?.version ?? '—'}</Badge>
                </div>
                {serverInfo.data?.worldguid && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">World GUID</span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                        {serverInfo.data.worldguid.slice(0, 8)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={handleCopyGuid}
                      >
                        {copiedGuid ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                {serverInfo.data?.description && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Description</span>
                    <p className="mt-1 text-sm">{serverInfo.data.description}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Broadcast Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Broadcast Message
            </CardTitle>
            <CardDescription>Send a message to all online players</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Enter message..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBroadcast()}
                className="flex-1"
              />
              <Button
                onClick={handleBroadcast}
                disabled={!broadcastMessage.trim() || isBroadcasting}
                className="w-full sm:w-auto"
              >
                {isBroadcasting ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Server management controls</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <Button onClick={handleSaveWorld} disabled={isSaving} className="w-full sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save World'}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" disabled={isShuttingDown} className="w-full sm:w-auto">
                  <Power className="mr-2 h-4 w-4" />
                  Shutdown Server
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Shutdown Server?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will gracefully shutdown the server with a 30 second warning to players.
                    Make sure to save the world first if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleShutdown}>
                    Shutdown
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isShuttingDown} className="w-full sm:w-auto">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Force Stop
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Force Stop Server?</AlertDialogTitle>
                  <AlertDialogDescription className="text-destructive">
                    Warning: This will immediately stop the server without saving.
                    All unsaved progress will be lost!
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleForceStop}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Force Stop
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
