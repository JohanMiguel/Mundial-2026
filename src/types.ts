export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  country: string;
  photoURL?: string;
  points: number;
  accuracy: number; // percentage of correct predictions (any points > 0)
  correctScores: number; // count of 5-point predictions
  correctResults: number; // count of 3-point predictions
  totalPredictions: number;
  rank?: number;
  isAdmin: boolean;
  createdAt: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  date: string; // ISO String
  stage: 'Grupos' | 'Dieciseisavos' | 'Octavos' | 'Cuartos' | 'Semifinales' | 'Tercer Lugar' | 'Final';
  homeScore?: number;
  awayScore?: number;
  status: 'Programado' | 'En Progreso' | 'Finalizado';
}

export interface Prediction {
  id: string; // userId_matchId
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  pointsEarned?: number;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'match_start' | 'result_published' | 'ranking_up' | 'system';
  createdAt: string;
  read: boolean;
  userId?: string; // If undefined, it's global
}

export interface AppSettings {
  allowPredictions: boolean;
  currentStage: string;
}

export interface AdminLog {
  id: string;
  adminId: string;
  action: string;
  details: string;
  createdAt: string;
}
