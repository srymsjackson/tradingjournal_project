import { NavLink, Outlet } from 'react-router-dom'

type AppLayoutProps = {
  onLogout: () => void
}

function AppLayout({ onLogout }: AppLayoutProps) {
  return (
    <div className="route-shell">
      <header className="route-header">
        <div>
          <h1>ur journ.</h1>
          <p>Trade execution, journaling, and review workspace.</p>
        </div>
        <button type="button" className="btn ghost" onClick={onLogout}>
          Log Out
        </button>
      </header>

      <nav className="route-nav" aria-label="Application pages">
        <NavLink to="/app/dashboard" className={({ isActive }) => `route-nav-item ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/app/journal" className={({ isActive }) => `route-nav-item ${isActive ? 'active' : ''}`}>
          Journal
        </NavLink>
        <NavLink to="/app/review" className={({ isActive }) => `route-nav-item ${isActive ? 'active' : ''}`}>
          Review
        </NavLink>
        <NavLink to="/app/settings" className={({ isActive }) => `route-nav-item ${isActive ? 'active' : ''}`}>
          Settings
        </NavLink>
      </nav>

      <Outlet />
    </div>
  )
}

export default AppLayout
