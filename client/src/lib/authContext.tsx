import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    console.log("🔄 Setting up Firebase auth state listener...");
    
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("🔥 Auth state changed:", firebaseUser ? `User logged in: ${firebaseUser.uid}` : "User logged out");
      
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser) {
        // User is signed in
        console.log("✅ User authenticated, checking current route...");
        const currentPath = window.location.pathname;
        
        // If user is on setup page, redirect to questionnaire
        if (currentPath === '/setup') {
          console.log("🔄 Redirecting from setup to questionnaire...");
          localStorage.setItem('currentUserId', firebaseUser.uid);
          setLocation('/questionnaire');
        }
      } else {
        // User is signed out
        console.log("❌ No user authenticated");
        const currentPath = window.location.pathname;
        
        // Only redirect to setup after a delay to allow Firebase auth to load
        // Don't redirect immediately to prevent auth loading race conditions
        setTimeout(() => {
          const currentUser = auth.currentUser;
          const protectedRoutes = ['/preferences', '/questionnaire', '/dashboard', '/feed', '/upload-project', '/upload', '/user-profile', '/saved', '/admin'];
          const isProtectedRoute = protectedRoutes.some(route => currentPath === route || currentPath.startsWith(route));
          
          if (!currentUser && isProtectedRoute) {
            console.log("🔄 Redirecting to setup page after auth check...");
            setLocation('/setup');
          }
        }, 2000); // Give Firebase 2 seconds to load authentication
      }
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("🧹 Cleaning up auth state listener");
      unsubscribe();
    };
  }, [setLocation]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};