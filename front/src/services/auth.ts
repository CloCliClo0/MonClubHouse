export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('prenom')
  localStorage.removeItem('role')
  window.location.href = '/login'
}

export function getToken(): string | null {
  return localStorage.getItem('token')
}

export function getRole(): string {
  return localStorage.getItem('role') || 'visiteur'
}
