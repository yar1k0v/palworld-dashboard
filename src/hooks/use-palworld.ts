import useSWR from 'swr'
import { useAppStore } from '@/stores/app-store'
import {
  getServerInfo,
  getPlayers,
  getMetrics,
  getSettings,
} from '@/lib/api'

// Default refresh interval (10 seconds)
const REFRESH_INTERVAL = 10000

// SWR fetcher wrapper that checks auth
function createFetcher<T>(fetchFn: () => Promise<T>) {
  return async () => {
    const { isAuthenticated } = useAppStore.getState()
    if (!isAuthenticated) {
      throw new Error('Not authenticated')
    }
    return fetchFn()
  }
}

// Server Info hook
export function useServerInfo() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  return useSWR(
    isAuthenticated ? 'server-info' : null,
    createFetcher(getServerInfo),
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      errorRetryCount: 3,
    }
  )
}

// Players hook
export function usePlayers() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  return useSWR(
    isAuthenticated ? 'players' : null,
    createFetcher(getPlayers),
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      errorRetryCount: 3,
    }
  )
}

// Metrics hook
export function useMetrics() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  return useSWR(
    isAuthenticated ? 'metrics' : null,
    createFetcher(getMetrics),
    {
      refreshInterval: REFRESH_INTERVAL,
      revalidateOnFocus: true,
      errorRetryCount: 3,
    }
  )
}

// Settings hook
export function useSettings() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  return useSWR(
    isAuthenticated ? 'settings' : null,
    createFetcher(getSettings),
    {
      refreshInterval: REFRESH_INTERVAL * 3, // Settings change less often
      revalidateOnFocus: true,
      errorRetryCount: 3,
    }
  )
}

// Combined dashboard data hook
export function useDashboardData() {
  const serverInfo = useServerInfo()
  const metrics = useMetrics()
  const players = usePlayers()

  return {
    serverInfo,
    metrics,
    players,
    isLoading:
      serverInfo.isLoading || metrics.isLoading || players.isLoading,
    error: serverInfo.error || metrics.error || players.error,
    mutate: () => {
      serverInfo.mutate()
      metrics.mutate()
      players.mutate()
    },
  }
}

// Map players hook - faster refresh for live tracking
const MAP_REFRESH_INTERVAL = 3000 // 3 seconds for smoother tracking

export function useMapPlayers() {
  const isAuthenticated = useAppStore((state) => state.isAuthenticated)

  return useSWR(
    isAuthenticated ? 'map-players' : null,
    createFetcher(getPlayers),
    {
      refreshInterval: MAP_REFRESH_INTERVAL,
      revalidateOnFocus: true,
      errorRetryCount: 3,
      dedupingInterval: 1000, // Prevent duplicate requests within 1s
    }
  )
}
