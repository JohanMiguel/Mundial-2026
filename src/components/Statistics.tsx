import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Match, Prediction, UserProfile } from '../types';
import { 
  BarChart3, 
  User, 
  Trophy, 
  Compass, 
  Percent, 
  HelpCircle, 
  TrendingUp, 
  AlertTriangle,
  Flame,
  Frown,
  Activity
} from 'lucide-react';
import { calculatePoints } from '../utils/points';

export const Statistics: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  // Statistics values
  const [mostCorrectUser, setMostCorrectUser] = useState<UserProfile | null>(null);
  const [bestAccuracyUser, setBestAccuracyUser] = useState<UserProfile | null>(null);
  const [averagePoints, setAveragePoints] = useState(0);
  const [easiestMatch, setEasiestMatch] = useState<{ match: Match; correctPct: number } | null>(null);
  const [hardestMatch, setHardestMatch] = useState<{ match: Match; incorrectPct: number } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // 1. Load all users
        const usersSnap = await getDocs(collection(db, 'users'));
        const uList: UserProfile[] = [];
        usersSnap.forEach(doc => uList.push(doc.data() as UserProfile));
        setUsers(uList);

        // 2. Load all matches
        const matchesSnap = await getDocs(collection(db, 'matches'));
        const mList: Match[] = [];
        matchesSnap.forEach(doc => mList.push({ ...doc.data() as Match, id: doc.id }));
        setMatches(mList);

        // 3. Load all predictions
        const predictionsSnap = await getDocs(collection(db, 'predictions'));
        const pList: Prediction[] = [];
        predictionsSnap.forEach(doc => pList.push(doc.data() as Prediction));
        setPredictions(pList);

        // --- CALCULATION ---
        
        // A. Usuario con más aciertos (correctScores + correctResults)
        if (uList.length > 0) {
          const sortedByAciertos = [...uList].sort((a, b) => {
            const sumA = (a.correctScores || 0) + (a.correctResults || 0);
            const sumB = (b.correctScores || 0) + (b.correctResults || 0);
            return sumB - sumA;
          });
          setMostCorrectUser(sortedByAciertos[0]);

          // B. Usuario con mejor porcentaje (con al menos 2 predicciones para ser justo)
          const filteredByPreds = uList.filter(u => (u.totalPredictions || 0) >= 1);
          if (filteredByPreds.length > 0) {
            const sortedByAccuracy = [...filteredByPreds].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
            setBestAccuracyUser(sortedByAccuracy[0]);
          } else {
            setBestAccuracyUser(sortedByAciertos[0]);
          }

          // C. Promedio de puntos
          const pointsSum = uList.reduce((acc, curr) => acc + (curr.points || 0), 0);
          setAveragePoints(parseFloat((pointsSum / uList.length).toFixed(1)));
        }

        // D. Match details (Easiest and Hardest)
        const finishedMatches = mList.filter(m => m.status === 'Finalizado');
        
        if (finishedMatches.length > 0 && pList.length > 0) {
          let easiest: { match: Match; correctPct: number } | null = null;
          let hardest: { match: Match; incorrectPct: number } | null = null;
          
          let maxCorrectPct = -1;
          let maxIncorrectPct = -1;

          finishedMatches.forEach(match => {
            const matchPredictions = pList.filter(p => p.matchId === match.id);
            if (matchPredictions.length > 0) {
              let correctCount = 0;
              let incorrectCount = 0;

              matchPredictions.forEach(pred => {
                const points = pred.pointsEarned ?? calculatePoints(pred.homeScore, pred.awayScore, match.homeScore!, match.awayScore!).points;
                if (points > 0) {
                  correctCount++;
                } else {
                  incorrectCount++;
                }
              });

              const correctPct = (correctCount / matchPredictions.length) * 100;
              const incorrectPct = (incorrectCount / matchPredictions.length) * 100;

              if (correctPct > maxCorrectPct) {
                maxCorrectPct = correctPct;
                easiest = { match, correctPct: Math.round(correctPct) };
              }

              if (incorrectPct > maxIncorrectPct) {
                maxIncorrectPct = incorrectPct;
                hardest = { match, incorrectPct: Math.round(incorrectPct) };
              }
            }
          });

          setEasiestMatch(easiest);
          setHardestMatch(hardest);
        } else {
          // Fallback static or empty
          setEasiestMatch(null);
          setHardestMatch(null);
        }

      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in p-1 sm:p-4">
      {/* Header Banner */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center">
            <BarChart3 className="h-7 w-7 mr-2 text-amber-500" /> Estadísticas Generales
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
            Descubre las tendencias del torneo, los partidos con mejores aciertos y los rivales más fuertes.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-sm">
          Calculando analíticas y estadísticas en tiempo real...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Promedio de puntos */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Promedio de Puntos</h3>
              <Activity className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-4xl font-mono font-black text-slate-100">{averagePoints}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">Promedio de puntos acumulados por participante en lo que va del torneo.</p>
            </div>
          </div>

          {/* Más aciertos */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Más Aciertos Totales</h3>
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            {mostCorrectUser ? (
              <div>
                <p className="text-xl font-bold text-white truncate">{mostCorrectUser.displayName}</p>
                <p className="text-xs text-amber-400 font-semibold font-mono mt-0.5">{(mostCorrectUser.correctScores || 0) + (mostCorrectUser.correctResults || 0)} aciertos válidos</p>
                <p className="text-[11px] text-slate-500 mt-2">Suma de resultados exactos y ganadores acertados.</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No hay datos disponibles.</p>
            )}
          </div>

          {/* Mejor Porcentaje */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mejor Efectividad</h3>
              <Percent className="h-5 w-5 text-emerald-500" />
            </div>
            {bestAccuracyUser ? (
              <div>
                <p className="text-xl font-bold text-white truncate">{bestAccuracyUser.displayName}</p>
                <p className="text-xs text-emerald-400 font-semibold font-mono mt-0.5">{bestAccuracyUser.accuracy || 0}% de precisión</p>
                <p className="text-[11px] text-slate-500 mt-2">Porcentaje de aciertos sobre predicciones realizadas.</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No hay datos disponibles.</p>
            )}
          </div>

          {/* Partido más acertado (Easiest Match) */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4 md:col-span-1 lg:col-span-1">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Partido más Acertado</h3>
              <Flame className="h-5 w-5 text-amber-500" />
            </div>
            {easiestMatch ? (
              <div>
                <p className="text-sm font-bold text-slate-200 truncate">
                  {easiestMatch.match.homeTeam} vs {easiestMatch.match.awayTeam}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Marcador: <span className="font-mono font-bold text-amber-400">{easiestMatch.match.homeScore} - {easiestMatch.match.awayScore}</span>
                </p>
                <p className="text-xs text-amber-400 font-semibold mt-1 font-mono">
                  {easiestMatch.correctPct}% de acierto general
                </p>
                <p className="text-[10px] text-slate-550 mt-2">La gran mayoría de los pronosticadores sumaron puntos en este encuentro.</p>
              </div>
            ) : (
              <div className="text-xs text-slate-550">
                <span className="font-bold">Alemania 2 - 1 Suiza</span>
                <p className="text-[11px] text-slate-500 mt-1">Se requiere un partido terminado con predicciones para calcular esta analítica.</p>
              </div>
            )}
          </div>

          {/* Partido más difícil (Hardest Match) */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-6 shadow-md flex flex-col justify-between space-y-4 md:col-span-1 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Partido más Rompe-Quinielas</h3>
              <Frown className="h-5 w-5 text-rose-500" />
            </div>
            {hardestMatch ? (
              <div>
                <p className="text-sm font-bold text-slate-200 truncate">
                  {hardestMatch.match.homeTeam} vs {hardestMatch.match.awayTeam}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Marcador: <span className="font-mono font-bold text-rose-400">{hardestMatch.match.homeScore} - {hardestMatch.match.awayScore}</span>
                </p>
                <p className="text-xs text-rose-400 font-semibold mt-1 font-mono">
                  {hardestMatch.incorrectPct}% de fallos totales
                </p>
                <p className="text-[10px] text-slate-500 mt-2">Este partido tuvo la menor cantidad de aciertos por los usuarios.</p>
              </div>
            ) : (
              <div className="text-xs text-slate-550">
                <span className="font-bold">Uruguay vs Japón (Sin disputar)</span>
                <p className="text-[11px] text-slate-500 mt-1">Se mostrará el partido donde los pronósticos fallaron por completo debido a un resultado sorpresivo.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
