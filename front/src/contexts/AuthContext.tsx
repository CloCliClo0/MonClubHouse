import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type AuthUser = {
  id: number
  prenom: string
  nom: string
  email: string
  role: string
}

type AuthContextType = {
  user: AuthUser | null
  setUser: (u: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
})

function getUserFromStorage(): AuthUser | null {
  const token = localStorage.getItem('token')
  if (!token) return null
  return {
    id:     parseInt(localStorage.getItem('userId') || '0'),
    prenom: localStorage.getItem('prenom') || '',
    nom:    localStorage.getItem('nom') || '',
    email:  localStorage.getItem('email') || '',
    role:   localStorage.getItem('role') || 'visiteur',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(getUserFromStorage)

  useEffect(() => {
    const onStorage = () => setUser(getUserFromStorage())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
