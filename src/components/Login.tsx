import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Mail, Lock, User, Globe, AlertCircle, ArrowRight, Sparkles, LogIn } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('México');
  
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const countries = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 
    'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 
    'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 
    'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      if (isRegistering) {
        if (!name.trim()) throw new Error('El nombre es requerido');
        await registerWithEmail(email, password, name, country);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found') {
        setErr('No se encontró ningún usuario con este correo.');
      } else if (error.code === 'auth/wrong-password') {
        setErr('Contraseña incorrecta.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErr('El correo ya está registrado.');
      } else if (error.code === 'auth/weak-password') {
        setErr('La contraseña debe tener al menos 6 caracteres.');
      } else if (error.code === 'auth/operation-not-allowed' || error.message?.includes('operation-not-allowed')) {
        setErr('El inicio de sesión con Correo/Contraseña no está habilitado en la consola de Firebase. Por favor, actívalo en "Authentication > Sign-in method" o utiliza el botón "Iniciar Sesión con Google" de abajo.');
      } else {
        setErr(error.message || 'Error en el inicio de sesión o registro.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (isAdminDemo: boolean) => {
    setLoading(true);
    setErr(null);
    try {
      if (isAdminDemo) {
        // Log in as the configured Admin miguelreyestojin@gmail.com
        // We will register or log them in with standard credential
        // Let's use a standard password for the demo admin
        try {
          await loginWithEmail('miguelreyestojin@gmail.com', 'admin2026');
        } catch {
          // If password doesn't exist, create it!
          await registerWithEmail('miguelreyestojin@gmail.com', 'admin2026', 'Miguel Reyes (Admin)', 'Guatemala');
        }
      } else {
        // Log in as standard demo user
        try {
          await loginWithEmail('invitado@quiniela.com', 'invitado2026');
        } catch {
          await registerWithEmail('invitado@quiniela.com', 'invitado2026', 'Invitado Especial', 'México');
        }
      }
    } catch (error: any) {
      setErr('Error de inicio de sesión demo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-slate-850 border border-slate-800 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Accent decorations */}
        <div className="absolute right-0 top-0 h-32 w-32 transform translate-x-12 -translate-y-12 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-0 bottom-0 h-32 w-32 transform -translate-x-12 translate-y-12 bg-emerald-500/5 rounded-full blur-2xl"></div>

        {/* Branding header */}
        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-900 border-2 border-amber-500/60 shadow-lg text-amber-500 mb-4 animate-pulse">
            <Trophy className="h-8 w-8 fill-amber-500/15" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            QUINIELA MUNDIAL 2026
          </h2>
          <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Predice resultados oficiales, compite contra tus amigos de forma 100% gratuita y descubre quién es el mejor pronosticador.
          </p>
        </div>

        {/* Action Form */}
        <form className="mt-8 space-y-5 relative z-10" onSubmit={handleSubmit}>
          {err && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl flex items-center text-xs font-semibold gap-1.5">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" /> {err}
            </div>
          )}

          <div className="space-y-4">
            {isRegistering && (
              <>
                {/* Full name input */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 w-full text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Country dropdown selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tu País</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 w-full text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {countries.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Email field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 w-full text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 w-full text-sm text-slate-100 placeholder-slate-550 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center transition-all shadow-lg shadow-amber-500/10 border-b-2 border-amber-600 disabled:opacity-50"
          >
            {loading ? 'Procesando...' : isRegistering ? 'Crear Cuenta' : 'Iniciar Sesión'}
            {!loading && <ArrowRight className="h-4.5 w-4.5 ml-1.5" />}
          </button>
        </form>

        {/* Toggle between Register/Login */}
        <div className="text-center pt-2 relative z-10">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-xs text-slate-400 hover:text-amber-400 transition-colors font-semibold"
          >
            {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión aquí' : '¿No tienes una cuenta? Regístrate aquí'}
          </button>
        </div>

        {/* Separator line */}
        <div className="relative flex py-1 items-center z-10">
          <div className="flex-grow border-t border-slate-800/80"></div>
          <span className="flex-shrink mx-4 text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">Métodos de Acceso</span>
          <div className="flex-grow border-t border-slate-800/80"></div>
        </div>

        {/* Google Sign In Button */}
        <div className="relative z-10">
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center transition-colors gap-2 disabled:opacity-50 shadow-md"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Iniciar Sesión con Google
          </button>
        </div>

        {/* Separator line for trial accounts */}
        <div className="relative flex py-1 items-center z-10">
          <div className="flex-grow border-t border-slate-800/80"></div>
          <span className="flex-shrink mx-4 text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">Acceso Rápido de Prueba</span>
          <div className="flex-grow border-t border-slate-800/80"></div>
        </div>

        {/* Demo access Buttons Row */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button
            type="button"
            onClick={() => handleDemoAccess(false)}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-800/80 text-slate-200 border border-slate-800 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center transition-colors gap-1.5 disabled:opacity-50"
          >
            <LogIn className="h-3.5 w-3.5 text-slate-400" />
            Acceso Invitado
          </button>

          <button
            type="button"
            onClick={() => handleDemoAccess(true)}
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-amber-500/15 text-amber-400 border border-amber-500/20 font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center transition-colors gap-1.5 disabled:opacity-50 shadow-inner"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            Acceso Admin
          </button>
        </div>
      </div>
    </div>
  );
};
