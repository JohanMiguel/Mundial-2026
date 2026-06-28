import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Match, Prediction } from '../types';
import { 
  User, 
  MapPin, 
  Mail, 
  Calendar, 
  Edit3, 
  Save, 
  Award, 
  CheckCircle,
  Trophy,
  History,
  TrendingUp,
  Percent,
  CheckCircle2
} from 'lucide-react';

export const Profile: React.FC = () => {
  const { profile, updateUserProfileData } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile?.displayName || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [historyPredictions, setHistoryPredictions] = useState<{ pred: Prediction; match: Match }[]>([]);
  const [myRankingPosition, setMyRankingPosition] = useState<number | null>(null);

  // Sync state with profile
  useEffect(() => {
    if (profile) {
      setName(profile.displayName);
      setCountry(profile.country);
    }
  }, [profile]);

  // Load My Prediction History
  useEffect(() => {
    if (!profile) return;

    const loadHistory = async () => {
      try {
        // Fetch all predictions for this user
        const predictionsRef = collection(db, 'predictions');
        const qPreds = query(predictionsRef, where('userId', '==', profile.uid));
        const predsSnap = await getDocs(qPreds);
        const preds: Prediction[] = [];
        predsSnap.forEach(d => preds.push(d.data() as Prediction));

        // Fetch all matches to pair them up
        const matchesRef = collection(db, 'matches');
        const matchesSnap = await getDocs(matchesRef);
        const matchesMap: Record<string, Match> = {};
        matchesSnap.forEach(d => {
          matchesMap[d.id] = { ...d.data() as Match, id: d.id };
        });

        // Combine
        const paired: { pred: Prediction; match: Match }[] = preds
          .filter(p => matchesMap[p.matchId])
          .map(p => ({
            pred: p,
            match: matchesMap[p.matchId]
          }));

        // Sort paired: newest match date first
        paired.sort((a, b) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime());
        setHistoryPredictions(paired);

        // Fetch current user position in ranking
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersList: any[] = [];
        usersSnap.forEach(d => usersList.push(d.data()));
        usersList.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.correctScores !== a.correctScores) return b.correctScores - a.correctScores;
          return b.correctResults - a.correctResults;
        });

        const myIdx = usersList.findIndex(u => u.uid === profile.uid);
        if (myIdx !== -1) {
          setMyRankingPosition(myIdx + 1);
        }

      } catch (err) {
        console.error('Error loading profile prediction history:', err);
      }
    };

    loadHistory();
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !country.trim()) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUserProfileData(name, country);
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al actualizar los datos');
    } finally {
      setSaving(false);
    }
  };

  const countries = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 
    'Ecuador', 'El Salvador', 'España', 'Estados Unidos', 'Guatemala', 
    'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 
    'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela'
  ];

  return (
    <div className="space-y-8 animate-fade-in p-1 sm:p-4">
      {/* Header Profile Title */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center">
            <User className="h-7 w-7 mr-2 text-amber-500" /> Mi Perfil
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
            Administra tus datos, visualiza tus estadísticas personales e inspecciona tu historial de pronósticos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Profile Stats & Editor Card */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-md relative overflow-hidden">
            {/* Design accents */}
            <div className="absolute right-0 top-0 h-24 w-24 transform translate-x-10 -translate-y-10 bg-amber-500/10 rounded-full blur-2xl"></div>

            {/* Avatar & Info */}
            <div className="flex flex-col items-center justify-center text-center pb-6 border-b border-slate-850/80">
              <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-xl mb-4">
                <div className="h-full w-full rounded-full bg-slate-900 flex items-center justify-center font-black text-2xl text-amber-500">
                  {profile?.displayName?.charAt(0).toUpperCase()}
                </div>
              </div>

              {!isEditing ? (
                <>
                  <h3 className="text-lg font-bold text-white flex items-center justify-center">
                    {profile?.displayName}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center justify-center mt-1">
                    <MapPin className="h-3.5 w-3.5 mr-1 text-slate-500" /> {profile?.country}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 px-4 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-xs font-semibold text-slate-300 flex items-center transition-all duration-150"
                  >
                    <Edit3 className="h-3 w-3 mr-1.5 text-slate-400" /> Editar Perfil
                  </button>
                </>
              ) : (
                <form onSubmit={handleUpdateProfile} className="w-full space-y-4 mt-2 text-left">
                  {error && <p className="text-xs text-rose-500 bg-rose-500/10 p-2 rounded border border-rose-500/20">{error}</p>}
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">País</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {countries.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center transition-colors disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-300 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="pt-6 grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5 text-center">
                <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Puntos</span>
                <span className="text-lg font-mono font-black text-amber-500">{profile?.points || 0}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5 text-center">
                <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Ranking</span>
                <span className="text-lg font-mono font-black text-emerald-400">#{myRankingPosition || '--'}</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5 text-center">
                <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Efectividad</span>
                <span className="text-lg font-mono font-black text-blue-400">{profile?.accuracy || 0}%</span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3.5 text-center">
                <span className="block text-slate-400 text-[9px] uppercase font-bold tracking-wider mb-0.5">Marcadores</span>
                <span className="text-lg font-mono font-black text-indigo-400">{profile?.correctScores || 0}</span>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 pt-4 border-t border-slate-850/80 text-[10px] text-slate-500 space-y-1.5">
              <div className="flex items-center">
                <Mail className="h-3 w-3 mr-2 text-slate-650" /> {profile?.email}
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-2 text-slate-650" />
                Registrado el {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '--'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Prediction History */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-100 flex items-center">
            <History className="h-5 w-5 mr-2 text-amber-500" /> Historial de Predicciones
          </h2>

          <div className="space-y-3">
            {historyPredictions.length === 0 ? (
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-10 text-center text-slate-500 text-sm">
                No has realizado predicciones aún. ¡Ve a la pestaña de Pronósticos para comenzar!
              </div>
            ) : (
              historyPredictions.map(({ pred, match }) => {
                const points = pred.pointsEarned;
                const isFinal = match.status === 'Finalizado';

                return (
                  <div key={pred.id} className="bg-slate-850 rounded-xl border border-slate-800 p-4 shadow-sm flex flex-col space-y-3.5">
                    {/* Upper Metadata Row */}
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pb-1.5 border-b border-slate-800/60">
                      <span className="font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        {match.stage}
                      </span>
                      {isFinal ? (
                        <span className={`font-black tracking-wider ${
                          points === 5 ? 'text-amber-400' : points === 3 ? 'text-emerald-400' : 'text-slate-500'
                        }`}>
                          {points === 5 ? '✓ EXACTO (+5 PTS)' : points === 3 ? '✓ ACIERTO (+3 PTS)' : 'FALLIDO (0 PTS)'}
                        </span>
                      ) : (
                        <span className="text-amber-500/80 flex items-center font-semibold">
                          <History className="h-3 w-3 mr-1" /> Pendiente de disputar
                        </span>
                      )}
                    </div>

                    {/* Score comparison row */}
                    <div className="flex items-center justify-between">
                      {/* Home */}
                      <div className="flex items-center space-x-2 w-1/3 min-w-0 text-slate-200">
                        <span className="text-2xl filter drop-shadow">{match.homeFlag}</span>
                        <span className="text-xs sm:text-sm font-bold truncate">{match.homeTeam}</span>
                      </div>

                      {/* Score figures */}
                      <div className="flex flex-col items-center justify-center w-1/3 text-center">
                        <div className="flex items-center space-x-1 font-mono">
                          <span className="text-sm font-black text-amber-500">{pred.homeScore}</span>
                          <span className="text-slate-600 font-bold">:</span>
                          <span className="text-sm font-black text-amber-500">{pred.awayScore}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Tu Pronóstico</span>
                      </div>

                      {/* Away */}
                      <div className="flex items-center justify-end space-x-2 w-1/3 min-w-0 text-slate-200 text-right">
                        <span className="text-xs sm:text-sm font-bold truncate">{match.awayTeam}</span>
                        <span className="text-2xl filter drop-shadow">{match.awayFlag}</span>
                      </div>
                    </div>

                    {/* Official score displays if match is final */}
                    {isFinal && (
                      <div className="flex justify-center bg-slate-900/60 border border-slate-800 p-2 rounded-lg text-xs font-semibold text-slate-400 gap-1.5">
                        <span>Marcador oficial:</span>
                        <span className="text-white font-mono">{match.homeScore} - {match.awayScore}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
