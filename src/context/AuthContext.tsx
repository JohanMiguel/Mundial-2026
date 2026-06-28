import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile } from '../types';
import { seedInitialData } from '../utils/seeds';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, country: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfileData: (name: string, country: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seed initial data once an admin logs in
  useEffect(() => {
    if (profile?.isAdmin) {
      seedInitialData(db);
    }
  }, [profile]);

  const fetchProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${uid}`);
        return null;
      }
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
    return null;
  };

  const refreshProfile = async () => {
    if (user) {
      const prof = await fetchProfile(user.uid);
      if (prof) setProfile(prof);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let prof = await fetchProfile(firebaseUser.uid);
        
        // If profile doesn't exist, create a temporary/default one
        if (!prof) {
          const email = firebaseUser.email || '';
          const isUserAdmin = email === 'miguelreyestojin@gmail.com' || email.endsWith('@admin.quiniela.com');
          
          prof = {
            uid: firebaseUser.uid,
            email: email,
            displayName: firebaseUser.displayName || email.split('@')[0],
            country: 'México', // Default country, can be updated in profile
            photoURL: firebaseUser.photoURL || undefined,
            points: 0,
            accuracy: 0,
            correctScores: 0,
            correctResults: 0,
            totalPredictions: 0,
            isAdmin: isUserAdmin,
            createdAt: new Date().toISOString()
          };
          
          try {
            await setDoc(doc(db, 'users', firebaseUser.uid), prof);
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
          }
        }
        
        setProfile(prof);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, country: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      
      const isUserAdmin = email === 'miguelreyestojin@gmail.com' || email.endsWith('@admin.quiniela.com');
      
      const newProfile: UserProfile = {
        uid: cred.user.uid,
        email: email,
        displayName: name,
        country: country,
        points: 0,
        accuracy: 0,
        correctScores: 0,
        correctResults: 0,
        totalPredictions: 0,
        isAdmin: isUserAdmin,
        createdAt: new Date().toISOString()
      };
      
      try {
        await setDoc(doc(db, 'users', cred.user.uid), newProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${cred.user.uid}`);
      }
      setProfile(newProfile);
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      
      // Profile creation is handled inside the onAuthStateChanged effect
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión con Google');
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Error al cerrar sesión');
    }
  };

  const updateUserProfileData = async (name: string, country: string) => {
    if (!user || !profile) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(docRef, {
          displayName: name,
          country: country
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
      }
      await updateProfile(user, { displayName: name });
      setProfile({
        ...profile,
        displayName: name,
        country: country
      });
    } catch (err: any) {
      setError(err.message || 'Error al actualizar perfil');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        updateUserProfileData,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
