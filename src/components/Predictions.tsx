import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Match, Prediction } from '../types';
import { 
  Trophy, 
  Calendar, 
  Lock, 
  Search, 
  CheckCircle, 
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';

export const Predictions: React.FC = () => {
  const { profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [activeStageFilter, setActiveStageFilter] = useState<string>('Todos');
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [inputs, setInputs] = useState<Record<string, { home: string; away: string }>>({});
  const [savingIds, setSavingIds] = useState<Record<string, boolean>>({});

  // Fetch all matches
  useEffect(() => {
    const matchesRef = collection(db, 'matches');
    const unsubscribe = onSnapshot(matchesRef, (snapshot) => {
      const list: Match[] = [];
      snapshot.forEach((doc) => {
        list.push({ ...doc.data() as Match, id: doc.id });
      });
      // Sort chronologically
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMatches(list);
    });
    return unsubscribe;
  }, []);

  // Fetch current user predictions
  useEffect(() => {
    if (!profile) return;
    const predictionsRef = collection(db, 'predictions');
    const q = query(predictionsRef, where('userId', '==', profile.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const preds: Record<string, Prediction> = {};
      const newInputs: Record<string, { home: string; away: string }> = {};
      
      snapshot.forEach((doc) => {
        const pred = doc.data() as Prediction;
        preds[pred.matchId] = pred;
        newInputs[pred.matchId] = {
          home: pred.homeScore.toString(),
          away: pred.awayScore.toString()
        };
      });
      
      setPredictions(preds);
      setInputs((prev) => ({ ...prev, ...newInputs }));
    });
    return unsubscribe;
  }, [profile]);

  const isMatchLocked = (match: Match) => {
    const matchTime = new Date(match.date).getTime();
    return Date.now() >= matchTime || match.status === 'Finalizado';
  };

  const handleInputChange = (matchId: string, side: 'home' | 'away', value: string) => {
    if (value !== '' && !/^\d+$/.test(value)) return; // Only numbers
    setInputs(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId] || { home: '', away: '' },
        [side]: value
      }
    }));
  };

  const handleSave = async (matchId: string) => {
    if (!profile) return;
    const input = inputs[matchId];
    if (!input || input.home === '' || input.away === '') return;

    setSavingIds(prev => ({ ...prev, [matchId]: true }));
    try {
      const predId = `${profile.uid}_${matchId}`;
      const newPrediction: Prediction = {
        id: predId,
        userId: profile.uid,
        matchId: matchId,
        homeScore: parseInt(input.home),
        awayScore: parseInt(input.away),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'predictions', predId), newPrediction);
    } catch (err) {
      console.error('Error saving prediction:', err);
    } finally {
      setSavingIds(prev => ({ ...prev, [matchId]: false }));
    }
  };

  const stages = ['Todos', 'Octavos', 'Cuartos', 'Semifinales', 'Tercer Lugar', 'Final'];

  // Filter logic
  const filteredMatches = matches.filter(m => {
    // Stage Filter
    if (activeStageFilter !== 'Todos' && m.stage !== activeStageFilter) {
      return false;
    }
    // Status Filter
    if (activeStatusFilter === 'pending') {
      return !isMatchLocked(m);
    }
    if (activeStatusFilter === 'completed') {
      return m.status === 'Finalizado';
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in p-1 sm:p-4">
      {/* Title & Banner */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center">
            <Trophy className="h-7 w-7 mr-2 text-amber-500 fill-amber-500/10" /> Mis Pronósticos
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
            Ingresa tus predicciones de cada partido. Los campos se bloquean automáticamente una vez que el partido inicia.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300">
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-500"></span>
            <span>+5 pts Exacto</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span>
            <span>+3 pts Ganador/Empate</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-600"></span>
            <span>0 pts Incorrecto</span>
          </div>
        </div>
      </div>

      {/* Filters Tabs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Stages */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg max-w-full overflow-x-auto">
          {stages.map((st) => (
            <button
              key={st}
              onClick={() => setActiveStageFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all shrink-0 ${
                activeStageFilter === st
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Prediction Status Filter */}
        <div className="flex space-x-1 bg-slate-900 border border-slate-800 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeStatusFilter === 'all' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeStatusFilter === 'pending' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'
            }`}
          >
            Predicciones Abiertas
          </button>
          <button
            onClick={() => setActiveStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeStatusFilter === 'completed' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'
            }`}
          >
            Resultados Oficiales
          </button>
        </div>
      </div>

      {/* Matches List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMatches.length === 0 ? (
          <div className="md:col-span-2 bg-slate-850 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
            No se encontraron partidos que coincidan con los filtros seleccionados.
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isLocked = isMatchLocked(match);
            const pred = predictions[match.id];
            const input = inputs[match.id] || { home: '', away: '' };
            const isSaved = pred !== undefined;
            const isSaving = savingIds[match.id] || false;
            
            // Analyze Points Earned
            const points = pred?.pointsEarned;
            let statusColor = 'border-slate-800 bg-slate-850/60';
            let badgeText = '';
            let pointsBadge = null;

            if (match.status === 'Finalizado') {
              if (points === 5) {
                statusColor = 'border-amber-500 bg-amber-950/20';
                badgeText = '¡Resultado Exacto!';
                pointsBadge = <span className="bg-amber-500 text-slate-950 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full">+5 PUNTOS</span>;
              } else if (points === 3) {
                statusColor = 'border-emerald-500/60 bg-emerald-950/20';
                badgeText = 'Ganador/Empate Acertado';
                pointsBadge = <span className="bg-emerald-500 text-slate-950 text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full">+3 PUNTOS</span>;
              } else {
                statusColor = 'border-slate-850 bg-slate-900/40 opacity-75';
                badgeText = 'Incorrecto';
                pointsBadge = <span className="bg-slate-700 text-slate-300 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full">0 PUNTOS</span>;
              }
            } else if (isLocked) {
              statusColor = 'border-slate-800 bg-slate-900/60 opacity-90';
            }

            return (
              <div 
                key={match.id} 
                className={`border rounded-xl p-5 shadow-sm transition-all duration-150 flex flex-col justify-between ${statusColor}`}
              >
                {/* Header */}
                <div className="flex justify-between items-center text-xs text-slate-400 mb-4 pb-2 border-b border-slate-800/40">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">
                      {match.stage}
                    </span>
                    {badgeText && (
                      <span className={`text-[10px] font-extrabold uppercase ${
                        points === 5 ? 'text-amber-400' : points === 3 ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        • {badgeText}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center text-[10px] font-mono">
                    <Clock className="h-3 w-3 mr-1 text-slate-500" />
                    {new Date(match.date).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Body Core */}
                <div className="flex items-center justify-between gap-4 py-2">
                  {/* Home Team */}
                  <div className="flex flex-col items-center justify-center text-center w-[35%]">
                    <span className="text-3xl sm:text-4xl mb-1.5 filter drop-shadow">{match.homeFlag}</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-100 truncate w-full">{match.homeTeam}</span>
                  </div>

                  {/* Middle Control Box */}
                  <div className="flex flex-col items-center justify-center w-[30%] text-center">
                    {match.status === 'Finalizado' ? (
                      <div className="flex flex-col items-center space-y-1">
                        {/* Official Scores */}
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">Oficial</div>
                        <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                          <span className="text-sm font-black font-mono text-amber-400">{match.homeScore}</span>
                          <span className="text-slate-600">:</span>
                          <span className="text-sm font-black font-mono text-amber-400">{match.awayScore}</span>
                        </div>
                        {/* User Pred */}
                        <div className="text-[10px] text-slate-500 font-medium mt-1">Tu pronóstico: <span className="font-mono font-bold text-slate-300">{pred?.homeScore ?? '-'}-{pred?.awayScore ?? '-'}</span></div>
                      </div>
                    ) : isLocked ? (
                      <div className="flex flex-col items-center space-y-1">
                        <Lock className="h-4 w-4 text-slate-500 mb-1" />
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cerrado</span>
                        <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-slate-300">
                          <span className="text-sm font-black font-mono">{pred?.homeScore ?? '-'}</span>
                          <span className="text-slate-600">:</span>
                          <span className="text-sm font-black font-mono">{pred?.awayScore ?? '-'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-1.5">
                          <input
                            type="text"
                            maxLength={1}
                            placeholder="-"
                            disabled={isLocked}
                            value={input.home}
                            onChange={(e) => handleInputChange(match.id, 'home', e.target.value)}
                            className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 text-center font-bold text-base text-amber-400 focus:border-amber-500 focus:outline-none transition-colors disabled:opacity-50"
                          />
                          <span className="text-slate-600 font-bold">:</span>
                          <input
                            type="text"
                            maxLength={1}
                            placeholder="-"
                            disabled={isLocked}
                            value={input.away}
                            onChange={(e) => handleInputChange(match.id, 'away', e.target.value)}
                            className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 text-center font-bold text-base text-amber-400 focus:border-amber-500 focus:outline-none transition-colors disabled:opacity-50"
                          />
                        </div>

                        <button
                          onClick={() => handleSave(match.id)}
                          disabled={isSaving || isLocked || input.home === '' || input.away === ''}
                          className={`w-full text-xs font-semibold py-1.5 px-3 rounded-md transition-all ${
                            isSaved 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25' 
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isSaving ? 'Guardando...' : isSaved ? '✓ Actualizar' : 'Guardar'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center justify-center text-center w-[35%]">
                    <span className="text-3xl sm:text-4xl mb-1.5 filter drop-shadow">{match.awayFlag}</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-100 truncate w-full">{match.awayTeam}</span>
                  </div>
                </div>

                {/* Footer Badge Row */}
                {pointsBadge && (
                  <div className="mt-4 pt-3 border-t border-slate-800/40 flex justify-center">
                    {pointsBadge}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
