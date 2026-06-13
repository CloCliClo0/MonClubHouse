import React, { useCallback, useEffect, useRef, useState } from 'react'
import api from '../services/api'

type ParsedMatch = {
  dom: string; ext: string
  score_dom: number | null; score_ext: number | null
  date: string | null; journee: number | null
  selected: boolean
}

type Equipe = { id: number; nom: string; categorie?: { id: number; nom: string } | null }
type Quota  = { used: number; limit: number; remaining: number }

function currentSeason(): string {
  const now = new Date(); const y = now.getFullYear()
  return now.getMonth() + 1 >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

const ALLOWED_ROLES = ['superadmin', 'admin', 'dirigeant', 'coach']
const NEW_CHAMP_SENTINEL = '__nouveau__'

export default function ScraperPage() {
  const role   = localStorage.getItem('role') || 'visiteur'
  const season = currentSeason()

  /* ── Config ── */
  const [equipes, setEquipes]           = useState<Equipe[]>([])
  const [selectedEqId, setSelectedEqId] = useState('')
  const [championnats, setChampionnats] = useState<string[]>([])
  // champSelect = valeur du <select> (nom existant ou NEW_CHAMP_SENTINEL)
  const [champSelect, setChampSelect]   = useState('')
  // champNew = texte saisi quand "Créer un nouveau" est sélectionné
  const [champNew, setChampNew]         = useState('')
  const [saisonName, setSaisonName]     = useState(season)

  // Le nom final du championnat à utiliser
  const champName = champSelect === NEW_CHAMP_SENTINEL ? champNew : champSelect

  /* ── Source ── */
  const [sourceMode, setSourceMode]   = useState<'file' | 'html'>('file')
  const [file, setFile]               = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [dragging, setDragging]       = useState(false)
  const [html, setHtml]               = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ── Analyse ── */
  const [analysing, setAnalysing] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [matches, setMatches]     = useState<ParsedMatch[]>([])

  /* ── Import ── */
  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState<{ created_matchs: number; new_teams: string[] } | null>(null)

  /* ── Quota ── */
  const [quota, setQuota]         = useState<Quota | null>(null)
  const quotaExhausted = quota !== null && quota.remaining === 0

  /* ── Chargement initial ── */
  useEffect(() => {
    api.get('/equipes').then(r => {
      const data: Equipe[] = r.data.data || []
      setEquipes(data)
      if (data.length > 0) setSelectedEqId(String(data[0].id))
    }).catch(() => {})
    api.get('/ai-scraper/quota').then(r => setQuota(r.data.data)).catch(() => {})
  }, [])

  /* ── Championnats existants : recharge quand équipe ou saison change ── */
  useEffect(() => {
    if (!selectedEqId || !saisonName.trim()) {
      setChampionnats([])
      setChampSelect('')
      return
    }
    api.get('/championnat/list', { params: { equipe_ref_id: selectedEqId, saison: saisonName.trim() } })
      .then(r => {
        const list: string[] = r.data.data || []
        setChampionnats(list)
        // Pré-sélectionner le premier si aucun choix actuel
        setChampSelect(prev => {
          if (prev && prev !== NEW_CHAMP_SENTINEL && list.includes(prev)) return prev
          return list.length > 0 ? list[0] : NEW_CHAMP_SENTINEL
        })
      })
      .catch(() => { setChampionnats([]); setChampSelect(NEW_CHAMP_SENTINEL) })
  }, [selectedEqId, saisonName])

  /* ── Drag & drop ── */
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) applyFile(f)
  }, [])

  const applyFile = (f: File) => {
    setFile(f); setError(null); setMatches([]); setImportResult(null)
    setFilePreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null)
  }

  /* ── Analyse IA ── */
  const handleAnalyse = async () => {
    setAnalysing(true); setError(null); setMatches([]); setImportResult(null)
    try {
      let r
      if (sourceMode === 'file' && file) {
        const fd = new FormData()
        fd.append('file', file)
        r = await api.post('/ai-scraper/analyse', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        r = await api.post('/ai-scraper/analyse', { html })
      }
      const data = r.data.data
      // Mise à jour du quota uniquement si le serveur renvoie les infos
      if (data.quota) setQuota(data.quota)
      // Pré-remplir le championnat si l'IA en détecte un et qu'aucun n'est sélectionné
      if (data.championnat) {
        if (championnats.includes(data.championnat)) {
          setChampSelect(data.championnat)
        } else if (!champNew) {
          setChampSelect(NEW_CHAMP_SENTINEL)
          setChampNew(data.championnat)
        }
      }
      if (data.saison) setSaisonName(data.saison)
      setMatches((data.matches || []).map((m: any) => ({ ...m, selected: true })))
    } catch (e: any) {
      const status = e?.response?.status
      const msg    = e?.response?.data?.message || 'Erreur lors de l\'analyse'
      setError(msg)
      // N'éteindre le quota que si c'est NOTRE quota interne (message spécifique)
      if (status === 429 && msg.includes('journalier')) {
        setQuota(q => q ? { ...q, remaining: 0 } : null)
      }
    } finally {
      setAnalysing(false)
    }
  }

  /* ── Import ── */
  const handleImport = async () => {
    const selected = matches.filter(m => m.selected)
    if (!selected.length || !selectedEqId || !champName.trim()) return
    setImporting(true); setError(null)
    try {
      const r = await api.post('/ai-scraper/import', {
        equipe_ref_id: Number(selectedEqId),
        saison: saisonName.trim() || season,
        championnat: champName.trim(),
        matches: selected,
      })
      setImportResult(r.data.data)
      // Recharger la liste des championnats (nouveau peut avoir été créé)
      if (champSelect === NEW_CHAMP_SENTINEL && champNew.trim()) {
        setChampionnats(prev => prev.includes(champNew.trim()) ? prev : [...prev, champNew.trim()])
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Erreur lors de l\'import')
    } finally {
      setImporting(false)
    }
  }

  const toggleMatch   = (i: number) => setMatches(p => p.map((m, idx) => idx === i ? { ...m, selected: !m.selected } : m))
  const toggleAll     = (v: boolean) => setMatches(p => p.map(m => ({ ...m, selected: v })))
  const selectedCount = matches.filter(m => m.selected).length
  const canAnalyse    = sourceMode === 'file' ? !!file : !!html.trim()

  const quotaColor = !quota ? 'gray'
    : quota.remaining === 0 ? 'red'
    : quota.remaining <= 3  ? 'orange'
    : 'green'

  if (!ALLOWED_ROLES.includes(role)) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[56px] block mb-4 opacity-30">lock</span>
        <p className="text-headline-md text-on-surface mb-2">Accès restreint</p>
        <p className="text-body-md">Cette fonctionnalité est réservée aux coachs, dirigeants et administrateurs.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-headline-lg text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-primary">smart_toy</span>
            Agent IA — Import de matchs
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            Envoyez une photo, un PDF ou du HTML — l'IA extrait automatiquement les matchs et scores.
          </p>
        </div>

        {quota && (
          <div className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border text-label-md font-medium
            ${quotaColor === 'green'  ? 'bg-green-50 border-green-200 text-green-700'  : ''}
            ${quotaColor === 'orange' ? 'bg-orange-50 border-orange-200 text-orange-700' : ''}
            ${quotaColor === 'red'    ? 'bg-red-50 border-red-200 text-red-700'        : ''}
            ${quotaColor === 'gray'   ? 'bg-gray-50 border-gray-200 text-gray-600'     : ''}
          `}>
            <span className="material-symbols-outlined text-[18px]">token</span>
            {quota.remaining}/{quota.limit} analyses restantes aujourd'hui
          </div>
        )}
      </div>

      {/* Configuration */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl p-5 space-y-4">
        <h3 className="text-title-md font-semibold text-on-surface">Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Équipe */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Équipe concernée *</label>
            <select value={selectedEqId} onChange={e => setSelectedEqId(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all">
              {equipes.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.nom}{eq.categorie?.nom ? ` (${eq.categorie.nom})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Championnat — select + éventuel champ texte */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Championnat *</label>
            {championnats.length > 0 ? (
              <>
                <select
                  value={champSelect}
                  onChange={e => setChampSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                >
                  {championnats.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value={NEW_CHAMP_SENTINEL}>+ Créer un nouveau championnat</option>
                </select>
                {champSelect === NEW_CHAMP_SENTINEL && (
                  <input
                    value={champNew}
                    onChange={e => setChampNew(e.target.value)}
                    placeholder="Nom du nouveau championnat"
                    autoFocus
                    className="w-full px-4 py-3 border border-primary rounded-lg text-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                )}
              </>
            ) : (
              <input
                value={champNew}
                onChange={e => setChampNew(e.target.value)}
                placeholder="Ex : Régional 2"
                className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
              />
            )}
          </div>

          {/* Saison */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Saison</label>
            <input value={saisonName} onChange={e => setSaisonName(e.target.value)}
              placeholder={season}
              className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
          </div>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          Le championnat et la saison peuvent être pré-remplis automatiquement par l'IA après l'analyse.
        </p>
      </div>

      {/* Source */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#e8e8f0]">
          {([['file', 'photo_library', 'Photo / PDF'], ['html', 'code', 'HTML / Texte']] as const).map(([mode, icon, label]) => (
            <button key={mode} onClick={() => { setSourceMode(mode); setError(null) }}
              className={`flex items-center gap-2 px-5 py-3.5 text-label-lg border-b-2 transition-colors
                ${sourceMode === mode
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low/40'}`}>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {sourceMode === 'file' ? (
            <>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer
                  ${dragging ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low/30'}`}
              >
                <input ref={fileInputRef} type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f) }} />

                {file ? (
                  <div className="p-4 flex items-center gap-4">
                    {filePreview ? (
                      <img src={filePreview} alt="Aperçu" className="w-20 h-20 object-cover rounded-lg border border-outline-variant shrink-0" />
                    ) : (
                      <div className="w-20 h-20 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-red-500 text-[32px]">picture_as_pdf</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-label-lg text-on-surface font-medium truncate">{file.name}</p>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        {(file.size / 1024).toFixed(0)} Ko · {file.type.split('/')[1]?.toUpperCase()}
                      </p>
                      <button onClick={e => { e.stopPropagation(); setFile(null); setFilePreview(null); setMatches([]); setImportResult(null) }}
                        className="mt-2 text-label-sm text-red-600 hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">close</span>Supprimer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] opacity-40">upload_file</span>
                    <div className="text-center">
                      <p className="text-label-lg text-on-surface">Glissez un fichier ici ou cliquez pour parcourir</p>
                      <p className="text-body-sm mt-1">JPG, PNG, WebP, GIF ou PDF · max 10 Mo</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-body-sm text-on-surface-variant bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <span className="material-symbols-outlined text-blue-500 text-[18px] shrink-0 mt-0.5">lightbulb</span>
                <span>Astuce : faites une capture d'écran du tableau de résultats (FFF, Footeo…) et uploadez-la directement.</span>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-label-md text-on-surface-variant">HTML, texte ou contenu copié</label>
                  <span className="text-label-sm text-on-surface-variant">{html.length.toLocaleString()} car.</span>
                </div>
                <textarea value={html}
                  onChange={e => { setHtml(e.target.value); setMatches([]); setImportResult(null) }}
                  placeholder="Collez ici le code source HTML d'une page de résultats, un texte brut avec les scores, ou tout autre contenu…"
                  rows={10}
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary transition-all resize-y" />
              </div>
              <div className="flex items-start gap-2 text-body-sm text-on-surface-variant bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <span className="material-symbols-outlined text-blue-500 text-[18px] shrink-0 mt-0.5">lightbulb</span>
                <span>Astuce : Ctrl+U pour voir le source de la page, puis Ctrl+A Ctrl+C pour tout copier.</span>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-sm">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              {error}
            </div>
          )}

          <button onClick={handleAnalyse}
            disabled={!canAnalyse || analysing || quotaExhausted}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40 transition-colors">
            {analysing ? (
              <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>L'IA analyse votre document…</>
            ) : quotaExhausted ? (
              <><span className="material-symbols-outlined text-[18px]">block</span>Quota journalier atteint</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">smart_toy</span>Analyser avec l'IA</>
            )}
          </button>
        </div>
      </div>

      {/* Résultats */}
      {matches.length > 0 && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#e8e8f0] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-title-md font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
                {matches.length} match{matches.length > 1 ? 's' : ''} détecté{matches.length > 1 ? 's' : ''}
              </h3>
              <p className="text-body-sm text-on-surface-variant mt-0.5">Décochez les matchs incorrects avant d'importer.</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleAll(true)} className="text-label-md text-primary hover:underline">Tout sélectionner</button>
              <span className="text-on-surface-variant">·</span>
              <button onClick={() => toggleAll(false)} className="text-label-md text-on-surface-variant hover:underline">Désélectionner</button>
            </div>
          </div>

          <div className="divide-y divide-[#e8e8f0] max-h-96 overflow-y-auto">
            {matches.map((m, i) => (
              <label key={i} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors text-body-sm
                ${m.selected ? 'bg-primary/5' : 'hover:bg-surface-container-low/40'}`}>
                <input type="checkbox" checked={m.selected} onChange={() => toggleMatch(i)} className="w-4 h-4 accent-primary shrink-0" />
                {m.journee != null && <span className="text-on-surface-variant w-7 shrink-0 text-right">J{m.journee}</span>}
                {m.date && <span className="text-on-surface-variant w-20 shrink-0">{m.date}</span>}
                {!m.journee && !m.date && <span className="w-8 shrink-0" />}
                <span className="text-on-surface flex-1 text-right truncate font-medium">{m.dom}</span>
                <span className={`text-label-lg font-black shrink-0 w-16 text-center ${m.score_dom == null ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                  {m.score_dom != null && m.score_ext != null ? `${m.score_dom} – ${m.score_ext}` : '— vs —'}
                </span>
                <span className="text-on-surface flex-1 truncate">{m.ext}</span>
              </label>
            ))}
          </div>

          <div className="p-4 border-t border-[#e8e8f0] flex items-center justify-between flex-wrap gap-3">
            <p className="text-body-md text-on-surface-variant">
              <strong>{selectedCount}</strong> match{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </p>
            <button onClick={handleImport}
              disabled={selectedCount === 0 || !selectedEqId || !champName.trim() || importing}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg text-label-lg hover:bg-green-700 disabled:opacity-40 transition-colors">
              {importing
                ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                : <span className="material-symbols-outlined text-[18px]">upload</span>}
              {importing ? 'Import…' : `Importer ${selectedCount} match${selectedCount > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Résultat import */}
      {importResult && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-800 px-5 py-4 rounded-xl">
          <span className="material-symbols-outlined text-green-600 text-[24px] shrink-0">check_circle</span>
          <div>
            <p className="text-label-lg font-semibold">Import réussi !</p>
            <p className="text-body-md mt-0.5">
              {importResult.created_matchs} match{importResult.created_matchs !== 1 ? 's' : ''} importé{importResult.created_matchs !== 1 ? 's' : ''} dans "{champName}".
            </p>
            {importResult.new_teams.length > 0 && (
              <div className="mt-2">
                <p className="text-body-sm font-medium">Nouvelles équipes créées :</p>
                <ul className="mt-1 space-y-0.5">
                  {importResult.new_teams.map(t => (
                    <li key={t} className="text-body-sm flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">add_circle</span>{t}
                    </li>
                  ))}
                </ul>
                <p className="text-body-sm mt-2 text-green-700">Vérifiez dans <strong>Saison → Classement</strong>.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quotas */}
      <div className="bg-surface-container-low/60 border border-[#e8e8f0] rounded-xl p-4">
        <p className="text-label-md text-on-surface-variant mb-2 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">info</span>
          Quotas journaliers (réinitialisés à minuit)
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-body-sm text-on-surface-variant">
          <span>Coach : <strong className="text-on-surface">10/jour</strong></span>
          <span>Dirigeant : <strong className="text-on-surface">20/jour</strong></span>
          <span>Admin : <strong className="text-on-surface">50/jour</strong></span>
          <span>Super Admin : <strong className="text-on-surface">200/jour</strong></span>
        </div>
      </div>

    </div>
  )
}
