import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Match, Prediction, UserProfile } from '../types';
import { 
  Trophy, 
  Calendar, 
  Award, 
  Users, 
  ChevronRight, 
  TrendingUp, 
  ShieldAlert, 
  Lock, 
  HelpCircle,
  Clock,
  CheckCircle2
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, Prediction>>({});
  const [participantsCount, setParticipantsCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [predictInputs, setPredictInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Load matches
  useEffect(() => {
    const matchesRef = collection(db, 'matches');
    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const allMatches: Match[] = [];
      snapshot.forEach((doc) => {
        allMatches.push({ ...doc.data() as Match, id: doc.id });
      });

      // Sort matches by date
      allMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Filter upcoming (Programado or En Progreso)
      const upcoming = allMatches.filter(m => m.status !== 'Finalizado').slice(0, 3);
      setUpcomingMatches(upcoming);

      // Filter recent (Finalizado) - sorted newest first
      const completed = allMatches.filter(m => m.status === 'Finalizado').reverse().slice(0, 3);
      setRecentMatches(completed);
    });

    return unsubscribe;
  }, []);

  // Load user predictions
  useEffect(() => {
    if (!profile) return;
    const predictionsRef = collection(db, 'predictions');
    const q = query(predictionsRef, where('userId', '==', profile.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const preds: Record<string, Prediction> = {};
      snapshot.forEach((doc) => {
        const pred = doc.data() as Prediction;
        preds[pred.matchId] = pred;
      });
      setUserPredictions(preds);

      // Initialize inputs for matches
      const inputs: Record<string, { home: string; away: string }> = {};
      Object.keys(preds).forEach(matchId => {
        inputs[matchId] = {
          home: preds[matchId].homeScore.toString(),
          away: preds[matchId].awayScore.toString()
        };
      });
      setPredictInputs((prev) => ({ ...prev, ...inputs }));
    });

    return unsubscribe;
  }, [profile]);

  // Load participants and ranking
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const usersList: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersList.push(doc.data() as UserProfile);
      });

      // Sort users by points DESC, then correctScores DESC, then correctResults DESC
      usersList.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.correctScores !== a.correctScores) return b.correctScores - a.correctScores;
        return b.correctResults - a.correctResults;
      });

      setParticipantsCount(usersList.length);
      setLeaderboard(usersList.slice(0, 5));

      // Find my position
      if (profile) {
        const myIdx = usersList.findIndex(u => u.uid === profile.uid);
        if (myIdx !== -1) {
          setMyRank(myIdx + 1);
        }
      }
    });

    return unsubscribe;
  }, [profile]);

  // Check if a match is locked for predictions (e.g. date is in the past)
  const isMatchLocked = (match: Match) => {
    const matchTime = new Date(match.date).getTime();
    const currentTime = Date.now();
    return currentTime >= matchTime || match.status === 'Finalizado';
  };

  const handlePredictChange = (matchId: string, side: 'home' | 'away', val: string) => {
    if (val !== '' && !/^\d+$/.test(val)) return; // Allow only numbers
    setPredictInputs(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { home: '', away: '' },
        [side]: val
      }
    }));
  };

  const handleSavePrediction = async (matchId: string) => {
    if (!profile) return;
    const inputs = predictInputs[matchId];
    if (!inputs || inputs.home === '' || inputs.away === '') return;

    setSavingId(matchId);
    try {
      const predId = `${profile.uid}_${matchId}`;
      const prediction: Prediction = {
        id: predId,
        userId: profile.uid,
        matchId: matchId,
        homeScore: parseInt(inputs.home),
        awayScore: parseInt(inputs.away),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'predictions', predId), prediction);
      
      // We can also create a nice local success indication
    } catch (err) {
      console.error('Error saving prediction:', err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in p-1 sm:p-4">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 h-40 w-40 transform translate-x-12 -translate-y-12 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 h-32 w-32 transform translate-y-12 bg-emerald-500/5 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Copa Mundial 2026 🏆
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              ¡Hola, {profile?.displayName}!
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              La fase eliminatoria ya está en marcha. Compite con tus amigos haciendo tus predicciones. ¡Recuerda que acertar el resultado exacto te otorga <span className="text-amber-400 font-bold">5 puntos</span>!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-slate-800 shrink-0">
            <div className="text-center px-2 border-r border-slate-800">
              <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Puntos</span>
              <span className="text-xl font-mono font-black text-amber-400">{profile?.points || 0}</span>
            </div>
            <div className="text-center px-2 border-r border-slate-800">
              <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Posición</span>
              <span className="text-xl font-mono font-black text-emerald-400">#{myRank || '--'}</span>
            </div>
            <div className="text-center px-2">
              <span className="block text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">Rendimiento</span>
              <span className="text-xl font-mono font-black text-blue-400">{profile?.accuracy || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Widgets Rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-850 border border-slate-800/80 rounded-xl p-5 flex items-center space-x-4 shadow-md">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tu Puntuación</p>
            <p className="text-2xl font-mono font-black text-slate-100">{profile?.points || 0} <span className="text-xs text-slate-400 font-normal">puntos</span></p>
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800/80 rounded-xl p-5 flex items-center space-x-4 shadow-md">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Posición en Ranking</p>
            <p className="text-2xl font-mono font-black text-slate-100">#{myRank || '--'} <span className="text-xs text-slate-400 font-normal">de {participantsCount}</span></p>
          </div>
        </div>

        <div className="bg-slate-850 border border-slate-800/80 rounded-xl p-5 flex items-center space-x-4 shadow-md">
          <div className="p-3 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total de Participantes</p>
            <p className="text-2xl font-mono font-black text-slate-100">{participantsCount} <span className="text-xs text-slate-400 font-normal">rivales</span></p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Matches & Predictions Widget */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-100 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-amber-500" /> Próximos Partidos
            </h2>
            <Link to="/pronosticos" className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center transition-colors">
              Ver todos los partidos <ChevronRight className="h-4 w-4 ml-0.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {upcomingMatches.length === 0 ? (
              <div className="bg-slate-850 rounded-xl border border-slate-800 p-8 text-center text-slate-500 text-sm">
                No hay partidos próximos programados en este momento.
              </div>
            ) : (
              upcomingMatches.map((match) => {
                const isLocked = isMatchLocked(match);
                const pred = userPredictions[match.id];
                const input = predictInputs[match.id] || { home: '', away: '' };
                const isSaved = pred !== undefined;

                return (
                  <div key={match.id} className="bg-slate-850 rounded-xl border border-slate-800 p-5 shadow-sm hover:border-slate-700/80 transition-all">
                    {/* Header */}
                    <div className="flex justify-between items-center text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800/60">
                      <span className="font-semibold px-2 py-0.5 bg-slate-800 text-slate-300 rounded">
                        {match.stage}
                      </span>
                      <span className="flex items-center text-[11px] text-slate-400 font-mono">
                        <Clock className="h-3.5 w-3.5 mr-1 text-slate-500" />
                        {new Date(match.date).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Match Core with input controls */}
                    <div className="flex items-center justify-between gap-2">
                      {/* Home Team */}
                      <div className="flex flex-col items-center justify-center text-center w-1/3">
                        <span className="text-2xl sm:text-3xl mb-1 filter drop-shadow">{match.homeFlag}</span>
                        <span className="text-xs font-bold text-slate-100 truncate max-w-[90%]">{match.homeTeam}</span>
                      </div>

                      {/* VS / Score Inputs */}
                      <div className="flex items-center justify-center space-x-2 w-1/3">
                        {isLocked ? (
                          <div className="flex flex-col items-center space-y-1">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest font-mono">Cerrado</span>
                            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
                              <span className="text-sm font-black font-mono text-slate-300">{pred?.homeScore ?? '-'}</span>
                              <span className="text-slate-600 font-bold">-</span>
                              <span className="text-sm font-black font-mono text-slate-300">{pred?.awayScore ?? '-'}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 flex items-center"><Lock className="h-2.5 w-2.5 mr-0.5" /> Bloqueado</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                maxLength={1}
                                placeholder="-"
                                value={input.home}
                                onChange={(e) => handlePredictChange(match.id, 'home', e.target.value)}
                                className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 text-center font-bold text-lg text-amber-400 focus:border-amber-500 focus:outline-none transition-colors"
                              />
                              <span className="text-slate-600 font-bold">:</span>
                              <input
                                type="text"
                                maxLength={1}
                                placeholder="-"
                                value={input.away}
                                onChange={(e) => handlePredictChange(match.id, 'away', e.target.value)}
                                className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 text-center font-bold text-lg text-amber-400 focus:border-amber-500 focus:outline-none transition-colors"
                              />
                            </div>
                            
                            <button
                              onClick={() => handleSavePrediction(match.id)}
                              disabled={savingId === match.id || input.home === '' || input.away === ''}
                              className={`w-full text-[10px] font-bold py-1 px-2.5 rounded transition-all mt-1 ${
                                isSaved
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-600'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {savingId === match.id ? 'Guardando...' : isSaved ? '✓ Actualizar' : 'Guardar'}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex flex-col items-center justify-center text-center w-1/3">
                        <span className="text-2xl sm:text-3xl mb-1 filter drop-shadow">{match.awayFlag}</span>
                        <span className="text-xs font-bold text-slate-100 truncate max-w-[90%]">{match.awayTeam}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sidebar: Ranking Widget & Recent Results */}
        <div className="space-y-6">
          {/* Top Rankings Mini-widget */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-100 flex items-center">
                <Trophy className="h-4.5 w-4.5 mr-1.5 text-amber-500" /> Líderes de Quiniela
              </h3>
              <Link to="/ranking" className="text-xs font-semibold text-slate-400 hover:text-slate-100 flex items-center">
                Ver Ranking <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {leaderboard.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-3">Cargando clasificación...</p>
              ) : (
                leaderboard.map((u, index) => {
                  const isMe = u.uid === profile?.uid;
                  return (
                    <div 
                      key={u.uid} 
                      className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                        isMe ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className={`text-xs font-mono font-black w-5 text-center ${
                          index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-700' : 'text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">{u.displayName}</p>
                          <p className="text-[10px] text-slate-500">{u.country}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-750 shrink-0">
                        {u.points} pts
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Results Mini-widget */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center">
              <CheckCircle2 className="h-4.5 w-4.5 mr-1.5 text-emerald-500" /> Últimos Resultados
            </h3>

            <div className="space-y-3">
              {recentMatches.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">
                  Aún no se han disputado partidos o resultados.
                </div>
              ) : (
                recentMatches.map((match) => {
                  const pred = userPredictions[match.id];
                  const hasPoints = pred?.pointsEarned !== undefined;
                  const pts = pred?.pointsEarned || 0;

                  return (
                    <div key={match.id} className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 flex flex-col space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 pb-1 border-b border-slate-800/40">
                        <span>{match.stage}</span>
                        {hasPoints && (
                          <span className={`font-semibold ${pts === 5 ? 'text-amber-400' : pts === 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            + {pts} pts
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 w-[40%] text-xs font-medium text-slate-300">
                          <span className="text-base mr-1">{match.homeFlag}</span>
                          <span className="truncate">{match.homeTeam}</span>
                        </div>

                        <div className="flex items-center justify-center space-x-1 text-xs font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-amber-500 font-bold">
                          <span>{match.homeScore}</span>
                          <span className="text-slate-600">:</span>
                          <span>{match.awayScore}</span>
                        </div>

                        <div className="flex items-center justify-end space-x-1 w-[40%] text-xs font-medium text-slate-300 text-right">
                          <span className="truncate">{match.awayTeam}</span>
                          <span className="text-base ml-1">{match.awayFlag}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
