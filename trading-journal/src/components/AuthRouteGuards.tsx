import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

type GuardProps = {
  isAuthenticated: boolean
  children: ReactNode
}

type ProtectedRouteProps = GuardProps & {
  redirectTo?: string
}

type PublicOnlyRouteProps = GuardProps & {
  redirectTo?: string
}

export function ProtectedRoute({ isAuthenticated, children, redirectTo = '/login' }: ProtectedRouteProps) {
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}

export function PublicOnlyRoute({ isAuthenticated, children, redirectTo = '/app/dashboard' }: PublicOnlyRouteProps) {
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
