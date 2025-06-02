import React from 'react'

// Re-export everything from the refactored modules
export { AuthProvider } from './auth/AuthProvider'
export { useAuthContext as useAuth } from './auth/context'
export { useAuthState } from './auth/useAuthState'
export type { AuthContextType } from './auth/types'

// Keep the default export for backwards compatibility
export default { AuthProvider: AuthProvider }
