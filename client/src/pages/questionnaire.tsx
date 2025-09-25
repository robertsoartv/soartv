import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/authContext';
import { saveUserPreferences } from '@/lib/firebase';

const roles = [
  'Director', 'Actor', 'Editor', 'Producer', 'Cinematographer', 
  'Screenwriter', 'Sound Designer', 'Production Designer', 'Composer', 'Other'
];

const genres = [
  'Drama', 'Horror', 'Comedy', 'Action', 'Thriller', 'Sci-Fi', 
  'Romance', 'Documentary', 'Animation', 'Fantasy', 'Mystery', 'Adventure'
];

export default function Questionnaire() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    role: [] as string[],
    genres: [] as string[],
    bio: '',
    portfolioLinks: '',
    profileImageURL: ''
  });

  const handleGenreToggle = (genre: string) => {
    setUserData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleRoleToggle = (role: string) => {
    setUserData(prev => ({
      ...prev,
      role: prev.role.includes(role)
        ? prev.role.filter(r => r !== role)
        : [...prev.role, role]
    }));
  };

  const handleComplete = async () => {
    if (authLoading || !user) {
      setLocation('/');
      return;
    }
    
    setIsLoading(true);
    
    // Build minimal profile data
    const userProfile = {
      uid: user.uid,
      name: userData.name,
      role: userData.role,
      genres: userData.genres,
      bio: userData.bio,
      portfolioLinks: userData.portfolioLinks.split('\n').filter(link => link.trim()),
      updatedAt: new Date().toISOString()
    };
    
    // Save in background with fast timeout and redirect immediately
    try {
      const savePromise = saveUserPreferences(user.uid, userProfile);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout')), 3000)
      );
      
      // Don't wait for save - redirect immediately for speed
      setLocation('/');
      
      // Save happens in background
      Promise.race([savePromise, timeoutPromise]).catch(() => {
        // Silent fail - user can edit profile later if needed
      });
    } catch {
      // Redirect even on immediate error
      setLocation('/');
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return userData.name.trim() !== '' && userData.role.length > 0;
      case 2: return userData.genres.length > 0;
      case 3: return userData.bio.trim() !== '';
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-black/80 border-gray-800 text-white">
        <CardHeader className="text-center">
          <div className="mb-4">
            <span className="text-3xl font-bold text-yellow-400">Soar</span>
            <span className="text-3xl font-bold text-red-500">TV</span>
          </div>
          <CardTitle className="text-2xl mb-2">Build Your Filmmaker Profile</CardTitle>
          <p className="text-gray-400">
            Let us know about your role and goals in filmmaking
          </p>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep ? 'bg-yellow-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Tell us about yourself</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Enter your full name"
                    value={userData.name}
                    onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Your Roles in Film</label>
                  <p className="text-gray-400 mb-4 text-sm">Select all that apply</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {roles.map((role) => (
                      <Button
                        key={role}
                        variant={userData.role.includes(role) ? "default" : "outline"}
                        className={`${
                          userData.role.includes(role)
                            ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                            : 'border-gray-600 text-white hover:bg-gray-800'
                        }`}
                        onClick={() => handleRoleToggle(role)}
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">What genres do you work with?</h3>
              <p className="text-gray-400 mb-6">Select all that apply</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {genres.map((genre) => (
                  <Button
                    key={genre}
                    variant={userData.genres.includes(genre) ? "default" : "outline"}
                    className={`${
                      userData.genres.includes(genre)
                        ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                        : 'border-gray-600 text-white hover:bg-gray-800'
                    }`}
                    onClick={() => handleGenreToggle(genre)}
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Tell us about your goals</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Bio / Goals</label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[120px]"
                    placeholder="Tell us about yourself, your experience, and your filmmaking goals..."
                    value={userData.bio}
                    onChange={(e) => setUserData(prev => ({ ...prev, bio: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Portfolio Links (Optional)</label>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Add your portfolio links, one per line..."
                    value={userData.portfolioLinks}
                    onChange={(e) => setUserData(prev => ({ ...prev, portfolioLinks: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="border-gray-600 text-white hover:bg-gray-800"
              >
                Previous
              </Button>
            )}
            
            <div className="ml-auto">
              {currentStep < 3 ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!isStepValid()}
                  className="bg-yellow-500 text-black hover:bg-yellow-600 disabled:opacity-50"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={!isStepValid() || isLoading}
                  className="bg-yellow-500 text-black hover:bg-yellow-600 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </div>

          {userData.genres.length > 0 && currentStep === 2 && (
            <div className="pt-4">
              <p className="text-sm text-gray-400 mb-2">Selected genres:</p>
              <div className="flex flex-wrap gap-2">
                {userData.genres.map((genre) => (
                  <Badge key={genre} variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}