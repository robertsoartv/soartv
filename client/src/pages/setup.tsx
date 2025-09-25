import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signUpUser, signIn, signInWithGoogle } from '@/lib/firebase';
import './setup.css';

export default function Setup() {
  const [, setLocation] = useLocation();
  const [isSignUp, setIsSignUp] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Name validation only for signup
    if (isSignUp && !formData.firstName.trim()) {
      newErrors.firstName = 'Required Field';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Required Field';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Required Field';
    } else if (isSignUp && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Extract form values (supporting both React state and direct DOM access)
    const fullName = formData.firstName || (document.getElementById("nameInput") as HTMLInputElement)?.value;
    const email = formData.email || (document.getElementById("emailInput") as HTMLInputElement)?.value;
    const password = formData.password || (document.getElementById("passwordInput") as HTMLInputElement)?.value;
    
    setIsLoading(true);
    setErrors({}); // Clear any previous errors
    
    try {
      if (isSignUp) {
        // Sign up flow
        console.log('🚀 Starting registration with:', { fullName, email, passwordLength: password.length });
        
        const user = await signUpUser(fullName, email, password);
        console.log('✅ User created successfully:', user);
        
        // Store user ID in localStorage for preferences page
        localStorage.setItem('currentUserId', user.uid);
        
        // Navigate to questionnaire page FIRST
        console.log('🔄 Redirecting to questionnaire page...');
        setLocation('/questionnaire');
        
        // Then show success message (non-blocking)
        setTimeout(() => {
          alert("Account created successfully! Verification email sent. Please check your inbox.");
        }, 100);
      } else {
        // Sign in flow
        console.log('🚀 Starting sign-in with:', { email, passwordLength: password.length });
        
        const user = await signIn(email, password);
        console.log('✅ User signed in successfully:', user);
        
        // Navigate to main app
        console.log('🔄 Redirecting to homepage...');
        setLocation('/');
        
        setTimeout(() => {
          alert("Welcome back!");
        }, 100);
      }
    } catch (error: any) {
      console.error('🚨 Registration error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack,
        customData: error.customData,
        fullError: error
      });
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = 'Firebase configuration error. Please check API key.';
      } else if (error.code === 'auth/project-not-found') {
        errorMessage = 'Firebase project not found. Please check project ID.';
      } else {
        errorMessage = isSignUp ? `Registration failed: ${error.message}` : `Sign-in failed: ${error.message}`;
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('🔄 Starting Google authentication...');
      const user = await signInWithGoogle();
      console.log('✅ Google authentication successful:', user.uid);
      
      // Navigate to main app for existing users, preferences for new users
      const isNewUser = user.metadata.creationTime === user.metadata.lastSignInTime;
      
      if (isNewUser) {
        // New user - go to preferences
        localStorage.setItem('currentUserId', user.uid);
        setLocation('/preferences');
        setTimeout(() => {
          alert("Welcome to SoarTV! Let's set up your preferences.");
        }, 100);
      } else {
        // Existing user - go to homepage
        setLocation('/');
        setTimeout(() => {
          alert(`Welcome back, ${user.displayName || 'there'}!`);
        }, 100);
      }
      
    } catch (error: any) {
      console.error('❌ Google authentication error:', error);
      
      let errorMessage = 'Google sign-in failed. Please try again.';
      
      if (error.message === 'Sign-in was cancelled') {
        errorMessage = 'Google sign-in was cancelled.';
      } else if (error.message === 'Pop-up was blocked by your browser') {
        errorMessage = 'Please allow pop-ups for Google sign-in to work.';
      } else if (error.message === 'An account already exists with this email address') {
        errorMessage = 'This email is already associated with another account.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-logo">
        <span className="soar-text">Soar</span>
        <span className="tv-text">TV</span>
      </div>
      
      <div className="setup-content">
        <h1 className="setup-title">
          {isSignUp ? "Let's get you set up" : "Welcome back"}
        </h1>
        <p className="setup-subtitle">
          {isSignUp ? "It's free. No subscription required" : "Sign in to continue watching"}
        </p>

        <Button 
          className="google-button"
          onClick={handleGoogleSignup}
        >
          Continue with Google
        </Button>

        <div className="divider">
          <span>OR</span>
        </div>

        <form id="signupForm" onSubmit={handleSubmit} className="setup-form">
          {errors.general && (
            <div className="error-message">{errors.general}</div>
          )}
          
          {isSignUp && (
            <>
              <input
                id="nameInput"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="First Name"
                required
                disabled={isLoading}
              />
              {errors.firstName && (
                <div className="error-message">{errors.firstName}</div>
              )}
            </>
          )}

          <input
            id="emailInput"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="Email"
            required
            disabled={isLoading}
          />
          {errors.email && (
            <div className="error-message">{errors.email}</div>
          )}

          <div className="password-input-wrapper">
            <input
              id="passwordInput"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Password"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? '👁️' : '🔒'}
            </button>
          </div>
          {errors.password && (
            <div className="error-message">{errors.password}</div>
          )}

          <button type="submit" className="next-button" disabled={isLoading}>
            {isLoading 
              ? (isSignUp ? 'Creating Account...' : 'Signing In...') 
              : (isSignUp ? 'Create Account' : 'Sign In')
            }
          </button>
          
          <div className="auth-toggle">
            <button 
              type="button" 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
                setFormData({ firstName: '', email: '', password: '' });
              }}
              className="toggle-auth-button"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>

        {isSignUp && (
          <p className="text-sm text-gray-400 text-center mt-4">
            Already have an account?{" "}
            <a href="/login" className="text-yellow-400 hover:text-yellow-300 underline transition-colors">
              Sign In
            </a>
          </p>
        )}

        <div className="shop-link">
          🎬 Paused? <a href="https://linktr.ee/FilmFlow7" target="_blank">Shop the look on FilmFlow7</a>
        </div>
      </div>
    </div>
  );
}