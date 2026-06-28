import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile } from '../types';
import { 
  Trophy, 
  Award, 
  Search, 
  Target, 
  Check, 
  Percent,
  TrendingUp,
  Sliders,
  Sparkles
} from 'lucide-react';

export const Ranking: React.FC = () => {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as UserProfile);
      });

      // Sort users by points DESC, then correctScores DESC, then correctResults DESC, then totalPredictions ASC
      list.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.correctScores !== a.correctScores) return b.correctScores - a.correctScores;
        if (b.correctResults !== a.correctResults) return b.correctResults - a.correctResults;
        return a.totalPredictions - b.totalPredictions;
      });

      setUsers(list);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const filteredUsers = users.filter((u) => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Find current user's general rank index in the overall list
  const getMyGlobalRank = () => {
    if (!profile) return null;
    const idx = users.findIndex(u => u.uid === profile.uid);
    return idx !== -1 ? idx + 1 : null;
  };

  const myGlobalRank = getMyGlobalRank();

  return (
    <div className="space-y-6 animate-fade-in p-1 sm:p-4">
      {/* Banner */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center">
            <Trophy className="h-7 w-7 mr-2 text-amber-500 fill-amber-500/10 animate-bounce" /> Tabla de Posiciones
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 leading-relaxed">
            Compite con amigos y otros pronosticadores de la Copa Mundial 2026. Se muestran los aciertos exactos y de ganadores.
          </p>
        </div>

        {/* Highlight my standing */}
        {profile && myGlobalRank && (
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/30 p-4 rounded-xl flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              #{myGlobalRank}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tu posición</p>
              <p className="text-sm font-bold text-slate-100">{profile.displayName}</p>
              <p className="text-[11px] font-mono text-amber-400">{profile.points} pts • {profile.correctScores} exactos</p>
            </div>
          </div>
        )}
      </div>

      {/* Podium for top 3 */}
      {!loading && users.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4 pb-2">
          {/* Second Place */}
          {users[1] && (
            <div className="bg-slate-850/60 border border-slate-800/80 rounded-xl p-5 flex flex-col items-center justify-center text-center relative order-2 md:order-1 md:h-44">
              <span className="absolute -top-3.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-400 text-slate-950">2° Lugar</span>
              <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-slate-300 border border-slate-700 mt-1 mb-2">
                {users[1].displayName.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-xs font-bold text-slate-200 truncate w-full">{users[1].displayName}</h4>
              <p className="text-[10px] text-slate-500 mb-2">{users[1].country}</p>
              <p className="text-sm font-black font-mono text-slate-200">{users[1].points} pts</p>
            </div>
          )}

          {/* First Place */}
          {users[0] && (
            <div className="bg-gradient-to-b from-slate-900 to-amber-500/5 border-2 border-amber-500 rounded-xl p-6 flex flex-col items-center justify-center text-center relative order-1 md:order-2 md:h-52 shadow-[0_0_25px_-5px_rgba(245,158,11,0.2)]">
              <div className="absolute -top-5 bg-amber-500 text-slate-950 p-1.5 rounded-full shadow border-2 border-slate-900">
                <Sparkles className="h-4.5 w-4.5 fill-slate-950" />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950 mt-1 mb-2">Líder Absoluto</span>
              <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center font-extrabold text-xl text-amber-400 border border-amber-500/40 mb-2">
                {users[0].displayName.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-sm font-black text-white truncate w-full">{users[0].displayName}</h4>
              <p className="text-xs text-amber-400 font-medium mb-2">{users[0].country}</p>
              <p className="text-lg font-black font-mono text-amber-400">{users[0].points} pts</p>
            </div>
          )}

          {/* Third Place */}
          {users[2] && (
            <div className="bg-slate-850/60 border border-slate-800/80 rounded-xl p-5 flex flex-col items-center justify-center text-center relative order-3 md:h-40">
              <span className="absolute -top-3.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-700 text-amber-100">3° Lugar</span>
              <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-lg text-amber-600 border border-amber-900/40 mt-1 mb-2">
                {users[2].displayName.charAt(0).toUpperCase()}
              </div>
              <h4 className="text-xs font-bold text-slate-200 truncate w-full">{users[2].displayName}</h4>
              <p className="text-[10px] text-slate-500 mb-2">{users[2].country}</p>
              <p className="text-sm font-black font-mono text-slate-200">{users[2].points} pts</p>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar participante por nombre o país..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Leaderboard Table Container */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-800">
                <th className="px-5 py-3.5 text-center w-16">Pos</th>
                <th className="px-4 py-3.5">Participante</th>
                <th className="px-4 py-3.5">País</th>
                <th className="px-4 py-3.5 text-center">Predicciones</th>
                <th className="px-4 py-3.5 text-center">Exactos (5 pts)</th>
                <th className="px-4 py-3.5 text-center">Ganador (3 pts)</th>
                <th className="px-4 py-3.5 text-center">Rendimiento</th>
                <th className="px-5 py-3.5 text-right w-24">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                    Cargando ranking de participantes...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                    No se encontraron participantes.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u, index) => {
                  const isMe = u.uid === profile?.uid;
                  return (
                    <tr 
                      key={u.uid} 
                      className={`transition-colors hover:bg-slate-800/10 ${
                        isMe ? 'bg-amber-500/5 font-semibold text-amber-400' : 'text-slate-300'
                      }`}
                    >
                      {/* Rank Position */}
                      <td className="px-5 py-4 text-center">
                        <span className={`font-mono font-black text-xs px-2.5 py-1 rounded ${
                          index === 0 
                            ? 'bg-amber-500 text-slate-950 font-black' 
                            : index === 1 
                            ? 'bg-slate-400 text-slate-950' 
                            : index === 2 
                            ? 'bg-amber-700 text-amber-100' 
                            : 'text-slate-400 bg-slate-900/60 border border-slate-800/40'
                        }`}>
                          {index + 1}
                        </span>
                      </td>

                      {/* Participant */}
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isMe ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {u.displayName.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-semibold text-xs sm:text-sm truncate max-w-[160px] sm:max-w-none">
                            {u.displayName}
                            {isMe && <span className="ml-1.5 text-[9px] bg-amber-500/15 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded">TÚ</span>}
                          </span>
                        </div>
                      </td>

                      {/* Country */}
                      <td className="px-4 py-4 text-xs sm:text-sm">
                        {u.country}
                      </td>

                      {/* Total Predictions */}
                      <td className="px-4 py-4 text-center font-mono text-xs sm:text-sm">
                        {u.totalPredictions || 0}
                      </td>

                      {/* Correct Exact Scores */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {u.correctScores || 0}
                        </span>
                      </td>

                      {/* Correct Outcomes */}
                      <td className="px-4 py-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {u.correctResults || 0}
                        </span>
                      </td>

                      {/* Accuracy */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1 font-mono text-xs sm:text-sm text-slate-400">
                          <Percent className="h-3 w-3 text-slate-500" />
                          <span>{u.accuracy || 0}%</span>
                        </div>
                      </td>

                      {/* Total Points */}
                      <td className="px-5 py-4 text-right">
                        <span className="font-mono font-black text-sm sm:text-base text-slate-100 bg-slate-900 px-3 py-1 rounded border border-slate-800">
                          {u.points || 0}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
