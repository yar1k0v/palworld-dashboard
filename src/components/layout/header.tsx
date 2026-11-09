import { LogOut, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { useAppStore, clearAuthFromSession } from '@/stores/app-store'
import { useServerInfo } from '@/hooks/use-palworld'
import { MobileNav } from './mobile-nav'

export function Header() {
  const logout = useAppStore((state) => state.logout)
  const { data: serverInfo, error, isLoading } = useServerInfo()

  const handleLogout = () => {
    clearAuthFromSession()
    logout()
  }

  // Connection status: connected (green), error (red), loading (yellow)
  const getStatusColor = () => {
    if (isLoading) return 'bg-yellow-500'
    if (error) return 'bg-red-500'
    if (serverInfo) return 'bg-green-500'
    return 'bg-gray-500'
  }

  const getStatusText = () => {
    if (isLoading) return 'Connecting...'
    if (error) return 'Connection error'
    if (serverInfo) return 'Connected'
    return 'Disconnected'
  }

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-3">
            <MobileNav />
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              <span className="font-semibold truncate max-w-[150px] sm:max-w-[200px] md:max-w-none">
                {serverInfo?.servername || 'Palworld Server Manager'}
              </span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${getStatusColor()} animate-pulse`} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{getStatusText()}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Separator orientation="vertical" className="mx-1 md:mx-2 h-6" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="h-9 w-9"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="sr-only">Logout</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Logout</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </TooltipProvider>
  )
}
