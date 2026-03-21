import { NavLink, Outlet } from 'react-router-dom'

type AppLayoutProps = {
  onLogout: () => Promise<void> | void
}

function AppLayout({ onLogout }: AppLayoutProps) {
  return (
    <div className="route-shell trader-shell">
      <header className="route-header trader-header">
        <div>
          <h1>Trader Dashboard</h1>
          <p>Execution, accountability, and prop risk control.</p>
        </div>
        <button type="button" className="btn ghost" onClick={onLogout}>
          Log Out
        </button>
      </header>

      <nav className="route-nav trader-nav" aria-label="Application pages">
        <NavLink to="/app/dashboard" className={({ isActive }) => `route-nav-item ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/app/journal" className={({ isActive }) => `route-nav-item ${isActive ? 'active' : ''}`}>
          Log Trade
        </NavLink>
        <NavLink to="/app/trade-history" className={({ isActive }) => `route-nav-item ${isActive ? 'active' : ''}`}>
          History
        </NavLink>
        <NavLink to="/app/analytics" className={({ isActive }) => `route-nav-item ${isActive ? 'active' : ''}`}>
          Analytics
        </NavLink>
        <NavLink to="/app/accounts" className={({ isActive }) => `route-nav-item ${isActive ? 'active' : ''}`}>
          Accounts
        </NavLink>
      </nav>

      <Outlet />
    </div>
  )
}

export default AppLayout
