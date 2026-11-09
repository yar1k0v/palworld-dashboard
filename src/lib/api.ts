import { useAppStore } from '@/stores/app-store'
import type {
  ServerInfo,
  PlayersResponse,
  ServerMetrics,
  ServerSettings,
  AnnounceRequest,
  KickRequest,
  BanRequest,
  UnbanRequest,
  ShutdownRequest,
} from '@/types/palworld'

const API_BASE = '/api/v1/api'

// Create Basic Auth header
function getAuthHeader(): string {
  const password = useAppStore.getState().password
  if (!password) throw new Error('Not authenticated')
  return 'Basic ' + btoa(`admin:${password}`)
}

// Generic fetch wrapper with auth
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthHeader(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401) {
      useAppStore.getState().logout()
      throw new Error('Authentication failed')
    }
    const errorText = await response.text()
    throw new Error(errorText || `HTTP ${response.status}`)
  }

  // Some endpoints return empty response
  const text = await response.text()
  if (!text) return {} as T

  return JSON.parse(text)
}

// Test connection with password
export async function testConnection(password: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}/info`, {
    headers: {
      Authorization: 'Basic ' + btoa(`admin:${password}`),
    },
  })
  return response.ok
}

// GET endpoints
export async function getServerInfo(): Promise<ServerInfo> {
  return apiFetch<ServerInfo>('/info')
}

export async function getPlayers(): Promise<PlayersResponse> {
  return apiFetch<PlayersResponse>('/players')
}

export async function getMetrics(): Promise<ServerMetrics> {
  return apiFetch<ServerMetrics>('/metrics')
}

export async function getSettings(): Promise<ServerSettings> {
  return apiFetch<ServerSettings>('/settings')
}

// POST endpoints
export async function announce(data: AnnounceRequest): Promise<void> {
  await apiFetch('/announce', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function kickPlayer(data: KickRequest): Promise<void> {
  await apiFetch('/kick', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function banPlayer(data: BanRequest): Promise<void> {
  await apiFetch('/ban', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function unbanPlayer(data: UnbanRequest): Promise<void> {
  await apiFetch('/unban', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function saveWorld(): Promise<void> {
  await apiFetch('/save', {
    method: 'POST',
  })
}

export async function shutdownServer(data?: ShutdownRequest): Promise<void> {
  await apiFetch('/shutdown', {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

export async function stopServer(): Promise<void> {
  await apiFetch('/stop', {
    method: 'POST',
  })
}
