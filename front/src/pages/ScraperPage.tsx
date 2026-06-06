import { useEffect, useState } from 'react'
import api from '../services/api'

type ParsedMatch = {
  dom: string; ext: string
  score_dom: number; score_ext: number
  date: string | null; journee: number | null
  selected: boolean
}

type Equipe = { id: number; nom: string; categorie: string }

function currentSeason(): string {
  const now = new Date(); const y = now.getFullYear()
  return now.getMonth() + 1 >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

export default function ScraperPage() {
  const season = currentSeason()
  const role   = localStorage.getItem('role') || 'visiteur'

  const [html, setHtml]                 = useState('')
  const [parsing, setParsing]           = useState(false)
  const [parseError, setParseError]     = useState<string | null>(null)
  const [matches, setMatches]           = useState<ParsedMatch[]>([])
  const [tablesFound, setTablesFound]   = useState(0)

  const [equipes, setEquipes]           = useState<Equipe[]>([])
  const [selectedEqId, setSelectedEqId] = useState<string>('')
  const [champName, setChampName]       = useState('')

  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState<{ created_matchs: number; new_teams: string[] } | null>(null)

  useEffect(() => {
    api.get('/equipes').then(r => {
      const data: Equipe[] = r.data.data || []
      setEquipes(data)
      if (data.length > 0) setSelectedEqId(String(data[0].id))
    }).catch(() => {})
  }, [])

  const handleParse = async () => {
    if (!html.trim()) return
    setParsing(true); setParseError(null); setMatches([]); setImportResult(null)
    try {
      const r = await api.post('/scraper/analyse', { html })
      const data = r.data.data
      setTablesFound(data.tables_found)
      setMatches((data.matches || []).map((m: any) => ({ ...m, selected: true })))
    } catch (e: any) {
      setParseError(e?.response?.data?.message || 'Erreur lors de l\'analyse')
    } finally { setParsing(false) }
  }

  const handleImport = async () => {
    const selected = matches.filter(m => m.selected)
    if (!selected.length || !selectedEqId || !champName.trim()) return
    setImporting(true)
    try {
      const r = await api.post('/scraper/import', {
        equipe_ref_id: Number(selectedEqId),
        saison: season,
        championnat: champName.trim(),
        matches: selected,
      })
      setImportResult(r.data.data)
    } catch (e: any) {
      setParseError(e?.response?.data?.message || 'Erreur lors de l\'import')
    } finally { setImporting(false) }
  }

  const toggleMatch = (i: number) =>
    setMatches(prev => prev.map((m, idx) => idx === i ? { ...m, selected: !m.selected } : m))

  const toggleAll = (v: boolean) => setMatches(prev => prev.map(m => ({ ...m, selected: v })))

  const selectedCount = matches.filter(m => m.selected).length

  if (!['superadmin', 'admin', 'dirigeant', 'coach'].includes(role)) {
    return (
      <div className="py-20 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[56px] block mb-4 opacity-30">lock</span>
        <p className="text-headline-md text-on-surface mb-2">Accès restreint</p>
        <p className="text-body-md">Cette page est réservée aux coachs et dirigeants.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-headline-lg text-on-surface">Importer depuis FFF Flandres</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Copiez le code source HTML d'une page de résultats ou d'agenda du site FFF Flandres,
          collez-le ci-dessous pour extraire automatiquement les matchs.
        </p>
      </div>

      {/* Config import */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl p-5 space-y-4">
        <h3 className="text-title-md font-semibold text-on-surface">Configuration</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Équipe concernée *</label>
            <select value={selectedEqId} onChange={e => setSelectedEqId(e.target.value)}
              className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all">
              {equipes.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.nom} ({eq.categorie})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Nom du championnat *</label>
            <input value={champName} onChange={e => setChampName(e.target.value)}
              placeholder="Ex : Régional 2"
              className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
          </div>
        </div>
        <div className="flex items-center gap-3 text-body-sm text-on-surface-variant bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="material-symbols-outlined text-blue-500 text-[20px] shrink-0">info</span>
          Saison : <strong className="text-on-surface ml-1">{season}</strong>
          <span className="mx-2">·</span>
          Les équipes non reconnues seront créées automatiquement dans le classement.
        </div>
      </div>

      {/* Zone HTML */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-title-md font-semibold text-on-surface">Source HTML</h3>
          <span className="text-label-sm text-on-surface-variant">{html.length.toLocaleString()} car.</span>
        </div>
        <textarea
          value={html}
          onChange={e => setHtml(e.target.value)}
          placeholder="Copiez ici le code source HTML de la page FFF Flandres (Ctrl+U dans le navigateur pour voir le source, puis Ctrl+A pour tout sélectionner)…"
          rows={10}
          className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-sm font-mono focus:outline-none focus:border-primary transition-all resize-y"
        />
        {parseError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-sm">
            <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
            {parseError}
          </div>
        )}
        <button onClick={handleParse} disabled={!html.trim() || parsing}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40 transition-colors">
          {parsing
            ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
            : <span className="material-symbols-outlined text-[18px]">search</span>}
          {parsing ? 'Analyse en cours…' : 'Analyser le HTML'}
        </button>
      </div>

      {/* Résultats */}
      {matches.length > 0 && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#e8e8f0] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-title-md font-semibold text-on-surface">
                {matches.length} match{matches.length > 1 ? 's' : ''} trouvé{matches.length > 1 ? 's' : ''}
              </h3>
              <p className="text-body-sm text-on-surface-variant">{tablesFound} tableau(x) analysé(s)</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleAll(true)}
                className="text-label-md text-primary hover:underline">Tout sélectionner</button>
              <span className="text-on-surface-variant">·</span>
              <button onClick={() => toggleAll(false)}
                className="text-label-md text-on-surface-variant hover:underline">Tout désélectionner</button>
            </div>
          </div>
          <div className="divide-y divide-[#e8e8f0] max-h-96 overflow-y-auto">
            {matches.map((m, i) => (
              <label key={i} className={`flex items-center gap-4 px-4 py-3 cursor-pointer transition-colors ${m.selected ? 'bg-primary/5' : 'hover:bg-surface-container-low/40'}`}>
                <input type="checkbox" checked={m.selected} onChange={() => toggleMatch(i)} className="w-4 h-4 accent-primary shrink-0" />
                {m.journee && <span className="text-label-sm text-on-surface-variant w-8 shrink-0">J{m.journee}</span>}
                {m.date && <span className="text-label-sm text-on-surface-variant w-16 shrink-0">{m.date}</span>}
                <span className="text-body-md text-on-surface flex-1 text-right truncate">{m.dom}</span>
                <span className="text-label-lg font-black text-on-surface shrink-0 w-14 text-center">
                  {m.score_dom} – {m.score_ext}
                </span>
                <span className="text-body-md text-on-surface flex-1 truncate">{m.ext}</span>
              </label>
            ))}
          </div>
          <div className="p-4 border-t border-[#e8e8f0] flex items-center justify-between flex-wrap gap-3">
            <p className="text-body-md text-on-surface-variant">
              <strong>{selectedCount}</strong> match{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
            </p>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0 || !selectedEqId || !champName.trim() || importing}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-label-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
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
              {importResult.created_matchs} match{importResult.created_matchs !== 1 ? 's' : ''} importé{importResult.created_matchs !== 1 ? 's' : ''}.
            </p>
            {importResult.new_teams.length > 0 && (
              <div className="mt-2">
                <p className="text-body-sm font-medium">Nouvelles équipes créées :</p>
                <ul className="mt-1 space-y-0.5">
                  {importResult.new_teams.map(t => (
                    <li key={t} className="text-body-sm flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px]">add_circle</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="text-body-sm mt-2 text-green-700">
                  Ces équipes ont été ajoutées au classement de "{champName}". Rendez-vous dans
                  <strong> Saison → Classement</strong> pour vérifier.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
