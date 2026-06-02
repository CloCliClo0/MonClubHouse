import { useRef, useState } from 'react'
import api from '../services/api'

type Props = {
  type: 'avatar' | 'club' | 'banner' | 'chat'
  currentUrl?: string
  onSuccess: (url: string) => void
  shape?: 'circle' | 'square' | 'banner'
  label?: string
  size?: number
}

export default function PhotoUpload({ type, currentUrl, onSuccess, shape = 'circle', label = 'Changer la photo', size = 96 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const [error, setError]     = useState('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Préview immédiat
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setLoading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post(`/upload/${type}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data.success) {
        onSuccess(res.data.url)
      }
    } catch (err: any) {
      setError('Erreur lors de l\'upload')
      setPreview(currentUrl || null)
    } finally {
      setLoading(false)
      e.target.value = ''
    }
  }

  if (shape === 'banner') {
    return (
      <div className="relative w-full h-32 rounded-xl overflow-hidden group cursor-pointer" onClick={() => inputRef.current?.click()}>
        {preview ? (
          <img src={preview} className="w-full h-full object-cover" alt="Bannière" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary to-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[40px] opacity-50">image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {loading ? (
            <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <>
              <span className="material-symbols-outlined text-white text-[24px]">add_photo_alternate</span>
              <span className="text-white text-label-lg">Changer la bannière</span>
            </>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        {error && <p className="absolute bottom-2 left-2 text-[11px] text-white bg-error px-2 py-1 rounded">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative group cursor-pointer"
        style={{ width: size, height: size }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          <img
            src={preview}
            className={`w-full h-full object-cover border-4 border-white shadow-md ${shape === 'circle' ? 'rounded-full' : 'rounded-2xl'}`}
            alt="Photo"
          />
        ) : (
          <div
            className={`w-full h-full bg-primary-container flex items-center justify-center border-4 border-white shadow-md ${shape === 'circle' ? 'rounded-full' : 'rounded-2xl'}`}
          >
            <span className="material-symbols-outlined text-white" style={{ fontSize: size / 3 }}>person</span>
          </div>
        )}
        <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${shape === 'circle' ? 'rounded-full' : 'rounded-2xl'}`}>
          {loading ? (
            <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          ) : (
            <span className="material-symbols-outlined text-white text-[24px]">add_photo_alternate</span>
          )}
        </div>
        {/* Badge edit */}
        <div className={`absolute bottom-1 right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md border-2 border-white ${loading ? 'opacity-0' : ''}`}>
          <span className="material-symbols-outlined text-white text-[14px]">edit</span>
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>
      <button type="button" onClick={() => inputRef.current?.click()}
        className="text-label-md text-primary hover:underline">
        {label}
      </button>
      {error && <p className="text-error text-body-sm">{error}</p>}
    </div>
  )
}
