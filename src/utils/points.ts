import { collection, query, where, getDocs, writeBatch, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Match, Prediction, UserProfile, AppNotification } from '../types';

/**
 * Calculates the points earned for a single prediction compared to the official result.
 * 3 points: Correct outcome (Winner or Draw) but not exact score
 * 5 points: Exact score matches
 * 0 points: Incorrect outcome
 */
export function calculatePoints(predHome: number, predAway: number, actualHome: number, actualAway: number): { points: number; type: 'exact' | 'outcome' | 'none' } {
  if (predHome === actualHome && predAway === actualAway) {
    return { points: 5, type: 'exact' };
  }

  const predDifference = predHome - predAway;
  const actualDifference = actualHome - actualAway;

  // Sign of difference matches means same outcome (both positive for home win, both negative for away win, both zero for draw)
  const isCorrectOutcome = Math.sign(predDifference) === Math.sign(actualDifference);

  if (isCorrectOutcome) {
    return { points: 3, type: 'outcome' };
  }

  return { points: 0, type: 'none' };
}

/**
 * Recalculates all predictions and user statistics for a finalized match.
 */
export async function finalizeMatchAndRecalculate(matchId: string, homeScore: number, awayScore: number): Promise<void> {
  // 1. Update the match document
  const matchRef = doc(db, 'matches', matchId);
  await updateDoc(matchRef, {
    homeScore,
    awayScore,
    status: 'Finalizado'
  });

  // 2. Fetch all predictions for this match
  const predictionsRef = collection(db, 'predictions');
  const q = query(predictionsRef, where('matchId', '==', matchId));
  const predictionsSnap = await getDocs(q);

  if (predictionsSnap.empty) {
    return;
  }

  const batch = writeBatch(db);
  const userIdsToUpdate = new Set<string>();

  predictionsSnap.forEach((predictionDoc) => {
    const pred = predictionDoc.data() as Prediction;
    const { points } = calculatePoints(pred.homeScore, pred.awayScore, homeScore, awayScore);
    
    const predDocRef = doc(db, 'predictions', predictionDoc.id);
    batch.update(predDocRef, { pointsEarned: points });
    userIdsToUpdate.add(pred.userId);
  });

  // Commit prediction updates first
  await batch.commit();

  // 3. Recalculate each user's statistics
  for (const userId of userIdsToUpdate) {
    await recalculateUserProfile(userId);
  }

  // 4. Create a global notification about results
  const matchSnap = await getDoc(matchRef);
  if (matchSnap.exists()) {
    const m = matchSnap.data() as Match;
    const notificationRef = doc(collection(db, 'notifications'));
    const notif: AppNotification = {
      id: notificationRef.id,
      title: 'Resultado Publicado 🏆',
      message: `El partido ${m.homeTeam} ${homeScore} - ${awayScore} ${m.awayTeam} ha finalizado. ¡Revisa tu pronóstico y el ranking!`,
      type: 'result_published',
      createdAt: new Date().toISOString(),
      read: false
    };
    await setDoc(notificationRef, notif);
  }
}

import { setDoc } from 'firebase/firestore';

/**
 * Recalculates a single user's prediction history, points, and metrics.
 */
export async function recalculateUserProfile(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const profile = userSnap.data() as UserProfile;

  // Get all predictions by this user
  const predictionsRef = collection(db, 'predictions');
  const q = query(predictionsRef, where('userId', '==', userId));
  const predictionsSnap = await getDocs(q);

  let totalPoints = 0;
  let correctScores = 0; // 5 points
  let correctResults = 0; // 3 points
  let totalPredictionsCount = 0;
  let matchesWithPoints = 0;

  predictionsSnap.forEach((pDoc) => {
    const pred = pDoc.data() as Prediction;
    totalPredictionsCount++;
    if (pred.pointsEarned !== undefined) {
      totalPoints += pred.pointsEarned;
      if (pred.pointsEarned === 5) {
        correctScores++;
        matchesWithPoints++;
      } else if (pred.pointsEarned === 3) {
        correctResults++;
        matchesWithPoints++;
      }
    }
  });

  const accuracy = totalPredictionsCount > 0 
    ? Math.round((matchesWithPoints / totalPredictionsCount) * 100) 
    : 0;

  await updateDoc(userRef, {
    points: totalPoints,
    correctScores,
    correctResults,
    totalPredictions: totalPredictionsCount,
    accuracy
  });
}
