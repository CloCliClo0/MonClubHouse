import { createContext, useContext, useState, ReactNode } from 'react'
import translations, { Lang } from './translations'

type Translations = typeof translations['fr']

interface LangContextType {
  lang:    Lang
  setLang: (l: Lang) => void
  t:       Translations
}

const LangContext = createContext<LangContextType>({
  lang:    'fr',
  setLang: () => {},
  t:       translations['fr'],
})

export function LangProvider({ children }: { children: ReactNode }) {
  const stored = (localStorage.getItem('lang') as Lang) || 'fr'
  const [lang, setLangState] = useState<Lang>(stored)

  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l)
    setLangState(l)
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
