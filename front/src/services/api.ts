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

// Redirige vers /login si token expiré (sauf en mode démo local)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isDevBypass = localStorage.getItem('token') === 'dev-bypass-token'
    if (err.response?.status === 401 && !isDevBypass) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
