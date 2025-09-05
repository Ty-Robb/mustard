'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User as AppUser } from '@/types';

interface AuthContextType {
  currentUser: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign up with email and password
  async function signUp(email: string, password: string, displayName: string) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name
    await updateProfile(user, { displayName });
    
    // Send verification email
    await sendEmailVerification(user);
    
    // Create user document in MongoDB
    await createUserDocument(user);
  }

  // Sign in with email and password
  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  // Sign in with Google
  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    const { user } = await signInWithPopup(auth, provider);
    
    // Create user document if it doesn't exist
    await createUserDocument(user);
  }

  // Sign out
  async function logout() {
    await signOut(auth);
    setAppUser(null);
  }

  // Reset password
  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }

  // Update user profile
  async function updateUserProfile(displayName: string, photoURL?: string) {
    if (!currentUser) throw new Error('No user logged in');
    
    await updateProfile(currentUser, {
      displayName,
      ...(photoURL && { photoURL }),
    });
  }

  // Send verification email
  async function sendVerificationEmail() {
    if (!currentUser) throw new Error('No user logged in');
    await sendEmailVerification(currentUser);
  }

  // Create user document in MongoDB
  async function createUserDocument(user: User) {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create user document');
      }

      const userData = await response.json();
      setAppUser(userData);
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  }

  // Fetch user data from MongoDB
  async function fetchUserData(user: User) {
    try {
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setAppUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user data from MongoDB
        await fetchUserData(user);
      } else {
        setAppUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    appUser,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    sendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
