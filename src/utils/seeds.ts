import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { Match, UserProfile } from '../types';
import { handleFirestoreError, OperationType } from '../firebase';

const INITIAL_MATCHES: Match[] = [
  {
    id: 'm1',
    homeTeam: 'Alemania',
    awayTeam: 'Suiza',
    homeFlag: '🇩🇪',
    awayFlag: '🇨🇭',
    date: '2026-06-27T18:00:00-07:00', // Completed yesterday
    stage: 'Octavos',
    homeScore: 2,
    awayScore: 1,
    status: 'Finalizado'
  },
  {
    id: 'm2',
    homeTeam: 'España',
    awayTeam: 'Croacia',
    homeFlag: '🇪🇸',
    awayFlag: '🇭🇷',
    date: '2026-06-28T18:00:00-07:00', // Today at 6:00 PM (starts soon!)
    stage: 'Octavos',
    status: 'Programado'
  },
  {
    id: 'm3',
    homeTeam: 'Argentina',
    awayTeam: 'México',
    homeFlag: '🇦🇷',
    awayFlag: '🇲🇽',
    date: '2026-06-29T15:00:00-07:00',
    stage: 'Octavos',
    status: 'Programado'
  },
  {
    id: 'm4',
    homeTeam: 'Brasil',
    awayTeam: 'EE. UU.',
    homeFlag: '🇧🇷',
    awayFlag: '🇺🇸',
    date: '2026-06-29T19:00:00-07:00',
    stage: 'Octavos',
    status: 'Programado'
  },
  {
    id: 'm5',
    homeTeam: 'Francia',
    awayTeam: 'Marruecos',
    homeFlag: '🇫🇷',
    awayFlag: '🇲🇦',
    date: '2026-06-30T15:00:00-07:00',
    stage: 'Octavos',
    status: 'Programado'
  },
  {
    id: 'm6',
    homeTeam: 'Portugal',
    awayTeam: 'Países Bajos',
    homeFlag: '🇵🇹',
    awayFlag: '🇳🇱',
    date: '2026-06-30T19:00:00-07:00',
    stage: 'Octavos',
    status: 'Programado'
  },
  {
    id: 'm7',
    homeTeam: 'Inglaterra',
    awayTeam: 'Italia',
    homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayFlag: '🇮🇹',
    date: '2026-07-01T15:00:00-07:00',
    stage: 'Octavos',
    status: 'Programado'
  },
  {
    id: 'm8',
    homeTeam: 'Uruguay',
    awayTeam: 'Japón',
    homeFlag: '🇺🇾',
    awayFlag: '🇯🇵',
    date: '2026-07-01T19:00:00-07:00',
    stage: 'Octavos',
    status: 'Programado'
  }
];

const DEMO_USERS: UserProfile[] = [
  {
    uid: 'demo_user_1',
    email: 'carlos@quiniela.com',
    displayName: 'Carlos Silva',
    country: 'Colombia',
    points: 13,
    accuracy: 80,
    correctScores: 2, // 2 exact score (10 pts) + 1 correct result (3 pts) = 13 pts
    correctResults: 1,
    totalPredictions: 5,
    isAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    uid: 'demo_user_2',
    email: 'sofia@quiniela.com',
    displayName: 'Sofía Fernández',
    country: 'Argentina',
    points: 10,
    accuracy: 60,
    correctScores: 2, // 2 exact scores = 10 pts
    correctResults: 0,
    totalPredictions: 5,
    isAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    uid: 'demo_user_3',
    email: 'john@quiniela.com',
    displayName: 'John Doe',
    country: 'EE. UU.',
    points: 8,
    accuracy: 50,
    correctScores: 1, // 1 exact score (5 pts) + 1 correct result (3 pts) = 8 pts
    correctResults: 1,
    totalPredictions: 6,
    isAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    uid: 'demo_user_4',
    email: 'yuki@quiniela.com',
    displayName: 'Yuki Sato',
    country: 'Japón',
    points: 6,
    accuracy: 40,
    correctScores: 0, // 2 correct results (6 pts)
    correctResults: 2,
    totalPredictions: 5,
    isAdmin: false,
    createdAt: new Date().toISOString()
  },
  {
    uid: 'demo_user_5',
    email: 'pierre@quiniela.com',
    displayName: 'Pierre Laurent',
    country: 'Francia',
    points: 3,
    accuracy: 25,
    correctScores: 0, // 1 correct result (3 pts)
    correctResults: 1,
    totalPredictions: 4,
    isAdmin: false,
    createdAt: new Date().toISOString()
  }
];

export async function seedInitialData(db: Firestore) {
  try {
    // 1. Seed matches
    const matchesCol = collection(db, 'matches');
    let matchesSnap;
    try {
      matchesSnap = await getDocs(matchesCol);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'matches');
      return;
    }

    if (matchesSnap.empty) {
      console.log('Seeding initial matches...');
      const batch = writeBatch(db);
      INITIAL_MATCHES.forEach((match) => {
        const docRef = doc(db, 'matches', match.id);
        batch.set(docRef, match);
      });
      try {
        await batch.commit();
        console.log('Matches seeded successfully!');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'matches');
        return;
      }
    }

    // 2. Seed demo users for ranking
    const usersCol = collection(db, 'users');
    let usersSnap;
    try {
      usersSnap = await getDocs(usersCol);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'users');
      return;
    }

    if (usersSnap.empty) {
      console.log('Seeding demo users...');
      const batch = writeBatch(db);
      DEMO_USERS.forEach((user) => {
        const docRef = doc(db, 'users', user.uid);
        batch.set(docRef, user);
      });
      try {
        await batch.commit();
        console.log('Demo users seeded successfully!');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'users');
        return;
      }
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}

