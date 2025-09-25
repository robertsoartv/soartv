import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn, signInWithGoogle } from '@/lib/firebase';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check for welcome message from email verification
  const urlParams = new URLSearchParams(window.location.search);
  const showWelcome = urlParams.get('welcome') === 'true';
  const isVerifying = urlParams.get('verify') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔄 Starting email sign-in...');
      const user = await signIn(email, password);
      console.log('✅ Email sign-in successful:', user.uid);
      
      // Navigate to main app
      setLocation('/');
      
    } catch (err: any) {
      console.error('❌ Email sign-in error:', err);
      
      let errorMessage = 'Invalid login credentials';
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
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

      // Navigate to main app
      setLocation('/');

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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-[#0f2027] via-[#203a43] to-[#2c5364] relative">
      {/* Welcome Banner for Email Verification */}
      {showWelcome && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Welcome to SoarTV! Your email has been verified.</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-black bg-opacity-70 p-8 rounded-lg w-full max-w-md shadow-lg text-white">
        <h1 className="text-2xl font-bold text-center text-yellow-400 mb-6">SoarTV Login</h1>
        
        {/* Google Sign-In Button */}
        <Button 
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 font-medium mb-4"
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
        
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-600" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-gray-400">Or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || isGoogleLoading}
            required
          />
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="w-full px-4 py-2 pr-12 bg-gray-800 border-gray-700 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-yellow-400 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading || isGoogleLoading}
            >
              {showPassword ? '👁️' : '🔒'}
            </button>
          </div>
          <Button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-2 rounded-md transition-colors"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
          
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 p-3 rounded border border-red-800">
              {error}
            </div>
          )}
        </form>
        
        <p className="text-center text-sm mt-4 text-gray-300">
          Don't have an account?{" "}
          <Link href="/setup" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}