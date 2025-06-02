
import React from 'react'
import { AuthContext } from './context'
import { useAuthState } from './useAuthState'
import { AuthProviderProps } from './types'

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authValue = useAuthState()
  
  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}
