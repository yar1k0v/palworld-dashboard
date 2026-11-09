import { Outlet } from 'react-router-dom'
import { Header } from './header'
import { Sidebar } from './sidebar'

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <main className="p-4 md:ml-56 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
