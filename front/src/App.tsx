import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'

// Spinner minimal affiché pendant le chargement des chunks
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f6]">
      <svg className="animate-spin h-8 w-8 text-[#1b4332]" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  )
}

// Pages publiques — chargées en priorité car accessibles sans auth
const LoginPage          = lazy(() => import('./pages/LoginPage'))
const RegisterPage       = lazy(() => import('./pages/RegisterPage'))
const SetupClubPage      = lazy(() => import('./pages/SetupClubPage'))
const PublicResultsPage  = lazy(() => import('./pages/PublicResultsPage'))
const AuthCallbackPage   = lazy(() => import('./pages/AuthCallbackPage'))
const JoinPage           = lazy(() => import('./pages/JoinPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'))
const GoogleCompletePage = lazy(() => import('./pages/GoogleCompletePage'))

// Pages authentifiées — splitées individuellement pour le code splitting maximal
const DashboardPage    = lazy(() => import('./pages/DashboardPage'))
const CalendarPage     = lazy(() => import('./pages/CalendarPage'))
const TeamsPage        = lazy(() => import('./pages/TeamsPage'))
const CreateTeamPage   = lazy(() => import('./pages/CreateTeamPage'))
const TeamDetailPage   = lazy(() => import('./pages/TeamDetailPage'))
const ChatPage         = lazy(() => import('./pages/ChatPage'))
const ConvocationsPage = lazy(() => import('./pages/ConvocationsPage'))
const CompositionPage  = lazy(() => import('./pages/CompositionPage'))
const ResultsPage      = lazy(() => import('./pages/ResultsPage'))
const MatchDetailPage  = lazy(() => import('./pages/MatchDetailPage'))
const EventPage        = lazy(() => import('./pages/EventPage'))
const ProfilePage      = lazy(() => import('./pages/ProfilePage'))
const AdminPage        = lazy(() => import('./pages/AdminPage'))
const ClubPage         = lazy(() => import('./pages/ClubPage'))
const CreateEventPage  = lazy(() => import('./pages/CreateEventPage'))
const OpponentsPage    = lazy(() => import('./pages/OpponentsPage'))
const SaisonPage       = lazy(() => import('./pages/SaisonPage'))
const ScraperPage      = lazy(() => import('./pages/ScraperPage'))
const StatsPage        = lazy(() => import('./pages/StatsPage'))
const PresencePage     = lazy(() => import('./pages/PresencePage'))
const VotePage         = lazy(() => import('./pages/VotePage'))
const ArbitragePage    = lazy(() => import('./pages/ArbitragePage'))
const SuperAdminPage   = lazy(() => import('./pages/SuperAdminPage'))
const DiagnosticPage   = lazy(() => import('./pages/DiagnosticPage'))
const SupportAdminPage = lazy(() => import('./pages/SupportAdminPage'))
const PromoCodesPage   = lazy(() => import('./pages/PromoCodesPage'))
const SubscriptionAdminPage = lazy(() => import('./pages/SubscriptionAdminPage'))
const HelpPage         = lazy(() => import('./pages/HelpPage'))
const DocumentationPage = lazy(() => import('./pages/DocumentationPage'))
const SupportPage      = lazy(() => import('./pages/SupportPage'))
const TutorielsPage    = lazy(() => import('./pages/TutorielsPage'))
const RaccourcisPage     = lazy(() => import('./pages/RaccourcisPage'))
const InstallationPage   = lazy(() => import('./pages/InstallationPage'))

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Pages publiques */}
            <Route path="/login"               element={<LoginPage />} />
            <Route path="/register"            element={<RegisterPage />} />
            <Route path="/setup-club"          element={<SetupClubPage />} />
            <Route path="/resultats-club"      element={<PublicResultsPage />} />
            <Route path="/auth/callback"       element={<AuthCallbackPage />} />
            <Route path="/join"                element={<JoinPage />} />
            <Route path="/forgot-password"     element={<ForgotPasswordPage />} />
            <Route path="/reset-password"      element={<ResetPasswordPage />} />
            <Route path="/google-complete"     element={<GoogleCompletePage />} />

            {/* Pages authentifiées */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard"              element={<DashboardPage />} />
              <Route path="/calendrier"             element={<CalendarPage />} />
              <Route path="/equipes"                element={<TeamsPage />} />
              <Route path="/equipes/creer"          element={<CreateTeamPage />} />
              <Route path="/equipes/:id"            element={<TeamDetailPage />} />
              <Route path="/messages"               element={<ChatPage />} />
              <Route path="/convocations"           element={<ConvocationsPage />} />
              <Route path="/composition"            element={<CompositionPage />} />
              <Route path="/resultats"              element={<ResultsPage />} />
              <Route path="/resultats/:matchId"     element={<MatchDetailPage />} />
              <Route path="/evenements/:id"         element={<EventPage />} />
              <Route path="/profil"                 element={<ProfilePage />} />
              <Route path="/admin"                  element={<AdminPage />} />
              <Route path="/mon-club"               element={<ClubPage />} />
              <Route path="/evenements/creer"       element={<CreateEventPage />} />
              <Route path="/adversaires"            element={<OpponentsPage />} />
              <Route path="/saison"                 element={<SaisonPage />} />
              <Route path="/scraper"                element={<ScraperPage />} />
              <Route path="/statistiques"           element={<StatsPage />} />
              <Route path="/mes-presences"          element={<PresencePage />} />
              <Route path="/vote/:matchId"          element={<VotePage />} />
              <Route path="/arbitrage"              element={<ArbitragePage />} />
              <Route path="/super-admin"            element={<SuperAdminPage />} />
              <Route path="/diagnostic"             element={<DiagnosticPage />} />
              <Route path="/support-admin"          element={<SupportAdminPage />} />
              <Route path="/codes-promo"            element={<PromoCodesPage />} />
              <Route path="/abonnements-admin"      element={<SubscriptionAdminPage />} />
              <Route path="/aide"                   element={<HelpPage />} />
              <Route path="/aide/documentation"     element={<DocumentationPage />} />
              <Route path="/aide/support"           element={<SupportPage />} />
              <Route path="/aide/tutoriels"         element={<TutorielsPage />} />
              <Route path="/aide/raccourcis"        element={<RaccourcisPage />} />
              <Route path="/aide/installation"     element={<InstallationPage />} />
            </Route>

            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
