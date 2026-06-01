import React, { createContext, useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { Layout } from '@/components/layout/Layout';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useToast } from '@/hooks/useToast';

// Pages
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { OAuthCallback } from '@/pages/OAuthCallback';
import { Dashboard } from '@/pages/Dashboard';
import { Calendrier } from '@/pages/Calendrier';
import { Convocations } from '@/pages/Convocations';
import { Resultats } from '@/pages/Resultats';
import { Club } from '@/pages/Club';
import { Equipes } from '@/pages/Equipes';
import { Composition } from '@/pages/Composition';
import { Chat } from '@/pages/Chat';
import { Profil } from '@/pages/Profil';
import { Admin } from '@/pages/Admin';

// Toast context global
interface ToastCtx { show: (msg: string, type?: 'success'|'error'|'warning'|'info') => void }
export const ToastContext = createContext<ToastCtx>({ show: () => {} });
export const useAppToast = () => useContext(ToastContext);

const App: React.FC = () => {
  const { toasts, show, dismiss } = useToast();

  return (
    <ToastContext.Provider value={{ show }}>
      <AuthProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<OAuthCallback />} />

              {/* Protégées — layout commun */}
              <Route element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/calendrier" element={<Calendrier />} />
                <Route path="/convocations" element={<Convocations />} />
                <Route path="/resultats" element={<Resultats />} />
                <Route path="/club" element={<Club />} />
                <Route path="/equipes" element={<Equipes />} />
                <Route path="/composition" element={<Composition />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/profil" element={<Profil />} />
                <Route path="/admin" element={<Admin />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer toasts={toasts} onDismiss={dismiss} />
        </SocketProvider>
      </AuthProvider>
    </ToastContext.Provider>
  );
};

export default App;
