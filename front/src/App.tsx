import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PublicResultsPage from './pages/PublicResultsPage'
import DashboardPage from './pages/DashboardPage'
import CalendarPage from './pages/CalendarPage'
import TeamsPage from './pages/TeamsPage'
import CreateTeamPage from './pages/CreateTeamPage'
import ChatPage from './pages/ChatPage'
import ConvocationsPage from './pages/ConvocationsPage'
import CompositionPage from './pages/CompositionPage'
import ResultsPage from './pages/ResultsPage'
import MatchDetailPage from './pages/MatchDetailPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import ClubPage from './pages/ClubPage'
import CreateEventPage from './pages/CreateEventPage'
import OpponentsPage from './pages/OpponentsPage'
import StatsPage from './pages/StatsPage'
import SetupClubPage from './pages/SetupClubPage'
import AuthCallbackPage from './pages/AuthCallbackPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pages publiques */}
        <Route path="/login"          element={<LoginPage />} />
        <Route path="/register"       element={<RegisterPage />} />
        <Route path="/setup-club"     element={<SetupClubPage />} />
        <Route path="/resultats-club" element={<PublicResultsPage />} />
        <Route path="/auth/callback"  element={<AuthCallbackPage />} />

        {/* Pages authentifiées */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard"          element={<DashboardPage />} />
          <Route path="/calendrier"         element={<CalendarPage />} />
          <Route path="/equipes"            element={<TeamsPage />} />
          <Route path="/equipes/creer"      element={<CreateTeamPage />} />
          <Route path="/messages"           element={<ChatPage />} />
          <Route path="/convocations"       element={<ConvocationsPage />} />
          <Route path="/composition"        element={<CompositionPage />} />
          <Route path="/resultats"          element={<ResultsPage />} />
          <Route path="/resultats/:matchId" element={<MatchDetailPage />} />
          <Route path="/profil"             element={<ProfilePage />} />
          <Route path="/admin"              element={<AdminPage />} />
          <Route path="/mon-club"           element={<ClubPage />} />
          <Route path="/evenements/creer"   element={<CreateEventPage />} />
          <Route path="/adversaires"        element={<OpponentsPage />} />
          <Route path="/statistiques"       element={<StatsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
