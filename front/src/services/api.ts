import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Attache le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirige vers /login si token expiré — jamais sur les endpoints d'auth eux-mêmes
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isDevBypass  = localStorage.getItem('token') === 'dev-bypass-token'
    const isAuthRoute  = (err.config?.url as string | undefined)?.includes('/auth/')
    if (err.response?.status === 401 && !isDevBypass && !isAuthRoute) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
