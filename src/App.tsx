import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { Predictions } from './components/Predictions';
import { Ranking } from './components/Ranking';
import { Statistics } from './components/Statistics';
import { Profile } from './components/Profile';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { Trophy } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
          <Trophy className="absolute h-5 w-5 text-amber-500" />
        </div>
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
          Quiniela Mundial 2026
        </p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pronosticos" element={<Predictions />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/estadisticas" element={<Statistics />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Quiniela Mundial. Copa Mundial de la FIFA 2026™.</p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">Desarrollado con React, Tailwind CSS y Firebase Firestore.</p>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
