import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Match, AppNotification } from '../types';
import { finalizeMatchAndRecalculate } from '../utils/points';
import { 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Check, 
  AlertCircle,
  Database,
  Calendar,
  Lock,
  Unlock,
  Bell,
  Clock,
  Sparkles
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeTab, setActiveTab] = useState<'matches' | 'add_match' | 'controls'>('matches');

  // New Match Form State
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [homeFlag, setHomeFlag] = useState('🏳️');
  const [awayFlag, setAwayFlag] = useState('🏳️');
  const [matchDate, setMatchDate] = useState('');
  const [matchStage, setMatchStage] = useState<'Grupos' | 'Octavos' | 'Cuartos' | 'Semifinales' | 'Tercer Lugar' | 'Final'>('Octavos');
  
  // Scoring Match State
  const [scoringMatchId, setScoringMatchId] = useState<string | null>(null);
  const [scoreHome, setScoreHome] = useState('');
  const [scoreAway, setScoreAway] = useState('');

  // Status logs
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // App settings simulated/saved
  const [allowPreds, setAllowPreds] = useState(true);

  // Load matches
  useEffect(() => {
    const matchesRef = collection(db, 'matches');
    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const list: Match[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data() as Match, id: doc.id });
      });
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMatches(list);
    });
    return unsubscribe;
  }, []);

  if (!profile?.isAdmin) {
    return (
      <div className="p-8 text-center bg-slate-850 border border-slate-800 rounded-xl space-y-4 max-w-lg mx-auto mt-12">
        <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Acceso Denegado</h2>
        <p className="text-slate-400 text-sm">
          No tienes permisos administrativos para acceder a esta sección de la Quiniela Mundial 2026.
        </p>
      </div>
    );
  }

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeam.trim() || !awayTeam.trim() || !matchDate) return;

    setProcessing(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const newId = 'm_' + Date.now();
      const newMatch: Match = {
        id: newId,
        homeTeam: homeTeam.trim(),
        awayTeam: awayTeam.trim(),
        homeFlag: homeFlag.trim(),
        awayFlag: awayFlag.trim(),
        date: new Date(matchDate).toISOString(),
        stage: matchStage,
        status: 'Programado'
      };

      await setDoc(doc(db, 'matches', newId), newMatch);
      setActionSuccess('¡Partido agregado con éxito!');
      
      // Clear inputs
      setHomeTeam('');
      setAwayTeam('');
      setHomeFlag('🏳️');
      setAwayFlag('🏳️');
      setMatchDate('');
      
      // Trigger notification
      const notificationRef = doc(collection(db, 'notifications'));
      const notif: AppNotification = {
        id: notificationRef.id,
        title: 'Nuevo Partido Agregado 🗓️',
        message: `Se ha programado el partido de ${matchStage}: ${newMatch.homeTeam} vs ${newMatch.awayTeam}. ¡Ya puedes ingresar tu pronóstico!`,
        type: 'match_start',
        createdAt: new Date().toISOString(),
        read: false
      };
      await setDoc(notificationRef, notif);

    } catch (err: any) {
      setActionError(err.message || 'Error al agregar partido');
    } finally {
      setProcessing(false);
    }
  };

  const handleFinalizeMatch = async (matchId: string) => {
    if (scoreHome === '' || scoreAway === '') {
      setActionError('Por favor introduce los marcadores para finalizar.');
      return;
    }

    setProcessing(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      const hScore = parseInt(scoreHome);
      const aScore = parseInt(scoreAway);

      await finalizeMatchAndRecalculate(matchId, hScore, aScore);
      
      setActionSuccess('¡Partido finalizado y puntos de la quiniela recalculados con éxito!');
      setScoringMatchId(null);
      setScoreHome('');
      setScoreAway('');
    } catch (err: any) {
      setActionError(err.message || 'Error al finalizar el partido');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este partido? Esta acción no se puede deshacer.')) return;
    
    try {
      await deleteDoc(doc(db, 'matches', matchId));
      setActionSuccess('Partido eliminado correctamente.');
    } catch (err: any) {
      setActionError(err.message || 'Error al eliminar partido');
    }
  };

  const handleGlobalNotification = async (title: string, msg: string) => {
    try {
      const notificationRef = doc(collection(db, 'notifications'));
      const notif: AppNotification = {
        id: notificationRef.id,
        title: title,
        message: msg,
        type: 'system',
        createdAt: new Date().toISOString(),
        read: false
      };
      await setDoc(notificationRef, notif);
      setActionSuccess('Notificación general enviada con éxito.');
    } catch (err: any) {
      setActionError(err.message || 'Error al enviar notificación');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-1 sm:p-4">
      {/* Banner */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center">
            <Settings className="h-7 w-7 mr-2 text-amber-500 fill-amber-500/10 animate-spin" /> Panel del Administrador
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
            Área de administración de la Quiniela Mundial 2026. Gestiona partidos, actualiza marcadores en directo y recalcula puntos automáticamente.
          </p>
        </div>
      </div>

      {/* Alert logs */}
      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center text-sm font-semibold">
          <Check className="h-5 w-5 mr-2 shrink-0" /> {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center text-sm font-semibold">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0" /> {actionError}
        </div>
      )}

      {/* Menu Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('matches')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'matches' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-100'
          }`}
        >
          Gestionar Partidos
        </button>
        <button
          onClick={() => setActiveTab('add_match')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'add_match' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-100'
          }`}
        >
          Programar Partido
        </button>
        <button
          onClick={() => setActiveTab('controls')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'controls' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-400 hover:text-slate-100'
          }`}
        >
          Notificaciones & Control
        </button>
      </div>

      {/* TABS VIEWS */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center">
            <Database className="h-4.5 w-4.5 mr-2 text-indigo-400" /> Lista de Partidos del Torneo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.length === 0 ? (
              <p className="text-slate-500 text-sm">No hay partidos programados en la base de datos.</p>
            ) : (
              matches.map((match) => {
                const isScoring = scoringMatchId === match.id;
                return (
                  <div key={match.id} className="bg-slate-850 rounded-xl border border-slate-800 p-4 shadow flex flex-col justify-between">
                    <div>
                      {/* Sub-header */}
                      <div className="flex justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-3">
                        <span className="font-semibold">{match.stage}</span>
                        <span className="font-mono">{new Date(match.date).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Teams Display */}
                      <div className="flex justify-between items-center py-2 px-1">
                        <div className="flex items-center space-x-2 w-1/3 min-w-0">
                          <span className="text-2xl">{match.homeFlag}</span>
                          <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">{match.homeTeam}</span>
                        </div>

                        {/* Middle status section */}
                        <div className="flex flex-col items-center justify-center w-1/3">
                          {match.status === 'Finalizado' ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Finalizado</span>
                              <span className="text-sm font-black text-amber-400 font-mono bg-slate-900 border border-slate-800 px-3 py-1 rounded">
                                {match.homeScore} : {match.awayScore}
                              </span>
                            </div>
                          ) : isScoring ? (
                            <div className="flex items-center space-x-1 font-mono">
                              <input
                                type="text"
                                maxLength={1}
                                value={scoreHome}
                                onChange={(e) => setScoreHome(e.target.value)}
                                className="w-8 h-8 rounded bg-slate-900 border border-slate-700 text-center font-bold text-amber-400 text-sm"
                                placeholder="0"
                              />
                              <span className="text-slate-500">:</span>
                              <input
                                type="text"
                                maxLength={1}
                                value={scoreAway}
                                onChange={(e) => setScoreAway(e.target.value)}
                                className="w-8 h-8 rounded bg-slate-900 border border-slate-700 text-center font-bold text-amber-400 text-sm"
                                placeholder="0"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pendiente</span>
                              <span className="text-xs font-semibold text-slate-500">VS</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-end space-x-2 w-1/3 min-w-0 text-right">
                          <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">{match.awayTeam}</span>
                          <span className="text-2xl">{match.awayFlag}</span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end gap-2 text-xs">
                      {isScoring ? (
                        <>
                          <button
                            onClick={() => handleFinalizeMatch(match.id)}
                            disabled={processing}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-1 px-2.5 rounded flex items-center transition-colors disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5 mr-1" /> Finalizar Match
                          </button>
                          <button
                            onClick={() => {
                              setScoringMatchId(null);
                              setScoreHome('');
                              setScoreAway('');
                            }}
                            className="bg-slate-800 hover:bg-slate-750 text-slate-300 py-1 px-2.5 rounded"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          {match.status !== 'Finalizado' && (
                            <button
                              onClick={() => {
                                setScoringMatchId(match.id);
                                setScoreHome('');
                                setScoreAway('');
                              }}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1 px-2.5 rounded flex items-center transition-colors"
                            >
                              <Edit3 className="h-3.5 w-3.5 mr-1" /> Publicar Resultado
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteMatch(match.id)}
                            className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1 rounded transition-colors"
                            title="Eliminar partido"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'add_match' && (
        <form onSubmit={handleCreateMatch} className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-md max-w-xl space-y-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center">
            <Plus className="h-5 w-5 mr-1 text-amber-500" /> Crear Partido del Mundial
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Equipo Local</label>
              <input
                type="text"
                placeholder="Ej. Francia"
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bandera Local (Emoji)</label>
              <input
                type="text"
                placeholder="Ej. 🇫🇷"
                value={homeFlag}
                onChange={(e) => setHomeFlag(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Equipo Visitante</label>
              <input
                type="text"
                placeholder="Ej. Marruecos"
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bandera Visitante (Emoji)</label>
              <input
                type="text"
                placeholder="Ej. 🇲🇦"
                value={awayFlag}
                onChange={(e) => setAwayFlag(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha & Hora</label>
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fase del Torneo</label>
              <select
                value={matchStage}
                onChange={(e: any) => setMatchStage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Grupos">Fase de Grupos</option>
                <option value="Dieciseisavos">Dieciseisavos</option>
                <option value="Octavos">Octavos de Final</option>
                <option value="Cuartos">Cuartos de Final</option>
                <option value="Semifinales">Semifinales</option>
                <option value="Tercer Lugar">Tercer Lugar</option>
                <option value="Final">Gran Final</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-4 rounded-lg text-sm flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Plus className="h-5 w-5 mr-1" /> {processing ? 'Agregando...' : 'Agregar Partido'}
          </button>
        </form>
      )}

      {activeTab === 'controls' && (
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-md max-w-xl space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center">
              <Bell className="h-5 w-5 mr-1.5 text-amber-500" /> Enviar Notificación General
            </h3>
            <p className="text-xs text-slate-400">Envía un mensaje broadcast instantáneo a todos los participantes de la Quiniela.</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => handleGlobalNotification('Nueva Jornada Abierta 🏆', 'Se han programado nuevos partidos en las llaves del Mundial. ¡Registra tus pronósticos ahora!')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-left p-3.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300 transition-colors"
            >
              <span>Notificar Apertura de Nuevas Rondas</span>
              <Sparkles className="h-4.5 w-4.5 text-amber-500" />
            </button>

            <button
              onClick={() => handleGlobalNotification('¡Ranking Actualizado! 🚀', 'Se han recalculado todos los marcadores oficiales. ¡Revisa tu posición en la clasificación general!')}
              className="w-full bg-slate-900 hover:bg-slate-800 text-left p-3.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300 transition-colors"
            >
              <span>Notificar Recálculo General de Puntos</span>
              <Sparkles className="h-4.5 w-4.5 text-emerald-500" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
