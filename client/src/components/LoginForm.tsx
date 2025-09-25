import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn, signInWithGoogle } from '@/lib/firebase';

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

export default function LoginForm({ onSuccess, redirectTo = '/', className = '' }: LoginFormProps) {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔄 Starting login process...');
      const user = await signIn(email, password);
      console.log('✅ Login successful:', user.uid);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default redirect behavior
        setLocation(redirectTo);
      }

    } catch (err: any) {
      console.error('❌ Login error:', err);
      
      let errorMessage = 'Invalid credentials or account does not exist.';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);

    try {
      console.log('🔄 Starting Google sign-in...');
      const user = await signInWithGoogle();
      console.log('✅ Google sign-in successful:', user.uid);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Default redirect behavior
        setLocation(redirectTo);
      }

    } catch (err: any) {
      console.error('❌ Google sign-in error:', err);
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (err.message === 'Sign-in was cancelled') {
        errorMessage = 'Google sign-in was cancelled.';
      } else if (err.message === 'Pop-up was blocked by your browser') {
        errorMessage = 'Please allow pop-ups for Google sign-in to work.';
      } else if (err.message === 'An account already exists with this email address') {
        errorMessage = 'This email is already associated with another account.';
      }
      
      setError(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className={`max-w-md mx-auto shadow-xl bg-gray-800/90 border-gray-700 backdrop-blur-sm ${className}`}>
      <CardHeader>
        <CardTitle className="text-yellow-400 text-xl font-bold">Sign In</CardTitle>
        <CardDescription className="text-gray-300">Welcome back to SoarTV</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 font-medium"
        >
          {isGoogleLoading ? 'Signing in with Google...' : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-gray-800 px-2 text-gray-400">Or</span>
          </div>
        </div>
      </CardContent>

      <form onSubmit={handleLogin}>
        <CardContent className="space-y-4 pt-0">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading || isGoogleLoading}
              className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
            />
          </div>
          
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading || isGoogleLoading}
              className="bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded border border-red-800">
              {error}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-black font-semibold"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}