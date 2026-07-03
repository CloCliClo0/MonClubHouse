import { useEffect, useState } from 'react'

const detectIOS = () =>
  /ipad|iphone|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

const detectAndroid = () => /android/i.test(navigator.userAgent)

const detectStandalone = () =>
  Boolean((window.navigator as any).standalone) ||
  window.matchMedia('(display-mode: standalone)').matches

export default function InstallationPage() {
  const [installPrompt, setInstallPrompt] = useState<any>(
    () => (window as any).__mchInstallPrompt || null
  )
  const [installed, setInstalled]   = useState(detectStandalone)
  const [installing, setInstalling] = useState(false)
  const iosDevice     = detectIOS()
  const androidDevice = detectAndroid()

  useEffect(() => {
    // Écoute les futurs events (peu probable mais propre)
    const handler = (e: any) => {
      e.preventDefault()
      ;(window as any).__mchInstallPrompt = e
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setInstallPrompt(null)
      ;(window as any).__mchInstallPrompt = null
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    setInstalling(true)
    try {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') {
        setInstalled(true)
        setInstallPrompt(null)
        ;(window as any).__mchInstallPrompt = null
      }
    } finally {
      setInstalling(false)
    }
  }

  const canInstall = !!installPrompt && !installed

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-headline-lg text-on-surface flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[32px]">install_mobile</span>
          Installer l'application
        </h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Installez MonClubHouse comme une application native sur votre appareil pour un accès rapide, hors-ligne et sans navigateur.
        </p>
      </div>

      {/* Statut actuel */}
      <div className={`rounded-xl p-5 mb-6 flex items-start gap-4 border ${
        installed
          ? 'bg-green-50 border-green-200'
          : 'bg-primary/5 border-primary/20'
      }`}>
        <span className={`material-symbols-outlined text-[28px] shrink-0 ${installed ? 'text-green-600' : 'text-primary'}`}>
          {installed ? 'check_circle' : 'info'}
        </span>
        <div>
          <p className={`text-label-lg font-bold ${installed ? 'text-green-800' : 'text-primary'}`}>
            {installed ? 'Application installée' : 'Application non installée'}
          </p>
          <p className={`text-body-sm mt-0.5 ${installed ? 'text-green-700' : 'text-on-surface-variant'}`}>
            {installed
              ? 'MonClubHouse est installé en tant qu\'application sur cet appareil. Vous pouvez le lancer depuis l\'écran d\'accueil ou le bureau.'
              : 'Suivez les instructions ci-dessous pour installer MonClubHouse sur votre appareil.'}
          </p>
        </div>
      </div>

      {/* ── Section principale ── */}
      {installed ? (
        /* App déjà installée — guide réinstallation */
        <div className="space-y-5">
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8e8f0] flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">restart_alt</span>
              </div>
              <div>
                <h3 className="text-headline-md">Réinstaller l'application</h3>
                <p className="text-body-sm text-on-surface-variant">Vous avez supprimé l'app par accident ?</p>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-body-md text-on-surface-variant">
                Si vous avez supprimé l'icône de votre écran d'accueil, voici comment la réinstaller :
              </p>

              {iosDevice ? (
                <IOSInstructions reinstall />
              ) : androidDevice ? (
                <AndroidInstructions />
              ) : (
                <DesktopInstructions canInstall={canInstall} onInstall={handleInstall} installing={installing} />
              )}
            </div>
          </div>
        </div>
      ) : iosDevice ? (
        /* iOS — instructions manuelles */
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e8e8f0] flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
            </div>
            <h3 className="text-headline-md">Installation sur iPhone / iPad</h3>
          </div>
          <div className="px-6 py-5">
            <IOSInstructions />
          </div>
        </div>
      ) : canInstall ? (
        /* Prompt disponible */
        <div className="space-y-5">
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8e8f0] flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">download</span>
              </div>
              <h3 className="text-headline-md">Installer maintenant</h3>
            </div>
            <div className="px-6 py-6 text-center space-y-4">
              <p className="text-body-md text-on-surface-variant">
                Votre navigateur prend en charge l'installation directe. Cliquez sur le bouton ci-dessous.
              </p>
              <button
                onClick={handleInstall}
                disabled={installing}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl text-label-lg font-semibold hover:brightness-110 transition-all active:scale-95 disabled:opacity-60"
              >
                {installing
                  ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <span className="material-symbols-outlined text-[20px]">install_mobile</span>
                }
                {installing ? 'Installation en cours…' : 'Installer MonClubHouse'}
              </button>
            </div>
          </div>

          <ManualInstructions />
        </div>
      ) : (
        /* Navigateur sans support prompt */
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
            <span className="material-symbols-outlined text-amber-600 shrink-0">warning</span>
            <div>
              <p className="text-label-lg font-semibold text-amber-800">Installation non disponible automatiquement</p>
              <p className="text-body-sm text-amber-700 mt-1">
                Votre navigateur actuel ne propose pas d'installation automatique. Suivez les instructions manuelles ci-dessous, ou utilisez Chrome / Edge pour une installation plus simple.
              </p>
            </div>
          </div>
          <ManualInstructions />
        </div>
      )}

      {/* Avantages de l'app */}
      <div className="mt-8 bg-white border border-[#e8e8f0] rounded-xl p-6">
        <h3 className="text-headline-md mb-4">Pourquoi installer l'application ?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: 'offline_bolt',       label: 'Accès hors-ligne',       desc: 'Consultez vos données même sans connexion internet' },
            { icon: 'notifications',      label: 'Notifications push',     desc: 'Recevez les convocations et alertes en temps réel' },
            { icon: 'speed',              label: 'Chargement instantané',  desc: 'L\'app démarre 3× plus vite qu\'un site web' },
            { icon: 'fullscreen',         label: 'Plein écran',            desc: 'Sans barre d\'adresse, comme une vraie application' },
            { icon: 'home',               label: 'Icône sur l\'écran',     desc: 'Accès direct depuis l\'écran d\'accueil ou le bureau' },
            { icon: 'storage',            label: 'Données en cache',       desc: 'Les pages récentes restent disponibles sans réseau' },
          ].map(f => (
            <div key={f.icon} className="flex items-start gap-3 p-3 rounded-lg bg-surface-container-lowest">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]">{f.icon}</span>
              </div>
              <div>
                <p className="text-label-md text-on-surface font-semibold">{f.label}</p>
                <p className="text-body-sm text-on-surface-variant mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sous-composants ────────────────────────────────────────────────────────────

function IOSInstructions({ reinstall = false }: { reinstall?: boolean }) {
  return (
    <div className="space-y-4">
      {reinstall && (
        <p className="text-body-md text-on-surface-variant">
          Ouvrez MonClubHouse dans <strong>Safari</strong>, puis suivez ces étapes :
        </p>
      )}
      {[
        {
          icon: 'ios_share',
          label: 'Appuyez sur l\'icône Partager',
          sub: 'Le rectangle avec une flèche ↑ en bas de Safari',
        },
        {
          icon: 'add_box',
          label: '"Sur l\'écran d\'accueil"',
          sub: 'Faites défiler le menu de partage vers le bas',
        },
        {
          icon: 'check_circle',
          label: 'Appuyez sur "Ajouter"',
          sub: 'L\'icône MonClubHouse apparaît sur votre écran d\'accueil',
        },
      ].map((step, i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]">{step.icon}</span>
          </div>
          <div className="pt-1">
            <p className="text-label-md text-on-surface font-semibold">{step.label}</p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">{step.sub}</p>
          </div>
        </div>
      ))}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 mt-2">
        <span className="material-symbols-outlined text-blue-500 text-[18px] shrink-0 mt-0.5">info</span>
        <p className="text-body-sm text-blue-700">
          Safari uniquement. Sur Chrome iOS, utilisez le menu ••• → "Ajouter à l'écran d'accueil".
        </p>
      </div>
    </div>
  )
}

function AndroidInstructions() {
  return (
    <div className="space-y-4">
      {[
        {
          icon: 'more_vert',
          label: 'Ouvrez le menu du navigateur',
          sub: 'Les 3 points en haut à droite de Chrome',
        },
        {
          icon: 'add_to_home_screen',
          label: '"Ajouter à l\'écran d\'accueil"',
          sub: 'Ou "Installer l\'application" si disponible',
        },
        {
          icon: 'check_circle',
          label: 'Appuyez sur "Installer"',
          sub: 'L\'icône MonClubHouse apparaît sur votre écran d\'accueil',
        },
      ].map((step, i) => (
        <div key={i} className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[20px]">{step.icon}</span>
          </div>
          <div className="pt-1">
            <p className="text-label-md text-on-surface font-semibold">{step.label}</p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">{step.sub}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function DesktopInstructions({ canInstall, onInstall, installing }: { canInstall: boolean; onInstall: () => void; installing: boolean }) {
  return (
    <div className="space-y-4">
      {canInstall ? (
        <div className="text-center py-4">
          <button
            onClick={onInstall}
            disabled={installing}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-white rounded-xl text-label-lg font-semibold hover:brightness-110 transition-all active:scale-95 disabled:opacity-60"
          >
            {installing
              ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <span className="material-symbols-outlined text-[20px]">install_desktop</span>
            }
            {installing ? 'Installation en cours…' : 'Réinstaller MonClubHouse'}
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-body-sm text-amber-800">
          <p><strong>Chrome / Edge :</strong> Cliquez sur l'icône d'installation (⊕) dans la barre d'adresse.</p>
          <p className="mt-1"><strong>Firefox :</strong> Menu ☰ → "Installer ce site comme application".</p>
        </div>
      )}
    </div>
  )
}

function ManualInstructions() {
  return (
    <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e8e8f0]">
        <h3 className="text-headline-md">Installation manuelle par navigateur</h3>
      </div>
      <div className="divide-y divide-[#e8e8f0]">
        {[
          {
            browser: 'Chrome (Windows / Android)',
            icon: 'public',
            color: 'bg-blue-100 text-blue-700',
            steps: [
              'Icône ⊕ dans la barre d\'adresse → "Installer MonClubHouse"',
              'ou Menu ⋮ → "Installer MonClubHouse…"',
            ],
          },
          {
            browser: 'Edge (Windows)',
            icon: 'public',
            color: 'bg-blue-100 text-blue-700',
            steps: ['Menu ··· → "Applications" → "Installer ce site comme application"'],
          },
          {
            browser: 'Safari (iPhone / iPad)',
            icon: 'phone_iphone',
            color: 'bg-gray-100 text-gray-700',
            steps: [
              'Bouton Partager ↑ en bas de Safari',
              '"Sur l\'écran d\'accueil" → "Ajouter"',
            ],
          },
          {
            browser: 'Chrome (iPhone / iPad)',
            icon: 'phone_iphone',
            color: 'bg-gray-100 text-gray-700',
            steps: ['Menu ··· → "Ajouter à l\'écran d\'accueil"'],
          },
        ].map(b => (
          <div key={b.browser} className="px-6 py-4 flex items-start gap-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${b.color}`}>
              <span className="material-symbols-outlined text-[18px]">{b.icon}</span>
            </div>
            <div>
              <p className="text-label-md text-on-surface font-semibold">{b.browser}</p>
              {b.steps.map((step, i) => (
                <p key={i} className="text-body-sm text-on-surface-variant mt-0.5">{step}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
