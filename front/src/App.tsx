import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PublicResultsPage from './pages/PublicResultsPage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage from './pages/CalendarPage'
import TeamsPage from './pages/TeamsPage'
import CreateTeamPage from './pages/CreateTeamPage'
import TeamDetailPage from './pages/TeamDetailPage'
import ChatPage from './pages/ChatPage'
import ConvocationsPage from './pages/ConvocationsPage'
import CompositionPage from './pages/CompositionPage'
import ResultsPage from './pages/ResultsPage'
import MatchDetailPage from './pages/MatchDetailPage'
import EventPage from './pages/EventPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import ClubPage from './pages/ClubPage'
import CreateEventPage from './pages/CreateEventPage'
import OpponentsPage from './pages/OpponentsPage'
import StatsPage from './pages/StatsPage'
import SetupClubPage from './pages/SetupClubPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import JoinPage from './pages/JoinPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import GoogleCompletePage from './pages/GoogleCompletePage'
import HelpPage from './pages/HelpPage'
import DocumentationPage from './pages/DocumentationPage'
import SupportPage from './pages/SupportPage'
import TutorielsPage from './pages/TutorielsPage'
import RaccourcisPage from './pages/RaccourcisPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/setup-club"     element={<SetupClubPage />} />
        <Route path="/resultats-club" element={<PublicResultsPage />} />
        <Route path="/auth/callback"      element={<AuthCallbackPage />} />
        <Route path="/join"               element={<JoinPage />} />
        <Route path="/forgot-password"    element={<ForgotPasswordPage />} />
        <Route path="/reset-password"     element={<ResetPasswordPage />} />
        <Route path="/google-complete"    element={<GoogleCompletePage />} />

        {/* Pages authentifiées */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/calendrier"         element={<CalendarPage />} />
          <Route path="/equipes"            element={<TeamsPage />} />
          <Route path="/equipes/creer"      element={<CreateTeamPage />} />
          <Route path="/equipes/:id"        element={<TeamDetailPage />} />
          <Route path="/messages"           element={<ChatPage />} />
          <Route path="/convocations"       element={<ConvocationsPage />} />
          <Route path="/composition"        element={<CompositionPage />} />
          <Route path="/resultats"          element={<ResultsPage />} />
          <Route path="/resultats/:matchId" element={<MatchDetailPage />} />
          <Route path="/evenements/:id"    element={<EventPage />} />
          <Route path="/profil"             element={<ProfilePage />} />
          <Route path="/admin"              element={<AdminPage />} />
          <Route path="/mon-club"           element={<ClubPage />} />
          <Route path="/evenements/creer"   element={<CreateEventPage />} />
          <Route path="/adversaires"        element={<OpponentsPage />} />
          <Route path="/statistiques"       element={<StatsPage />} />
          <Route path="/aide"                   element={<HelpPage />} />
          <Route path="/aide/documentation"     element={<DocumentationPage />} />
          <Route path="/aide/support"           element={<SupportPage />} />
          <Route path="/aide/tutoriels"         element={<TutorielsPage />} />
          <Route path="/aide/raccourcis"        element={<RaccourcisPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
