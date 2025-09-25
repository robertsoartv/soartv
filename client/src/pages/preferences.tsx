import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveUserPreferences } from '@/lib/firebase';
import './preferences.css';

interface UserPreferences {
  genres: string[];
  watchPreference: string;
  notifications: boolean;
  theme: string;
}

export default function Preferences() {
  const [, setLocation] = useLocation();
  const [preferences, setPreferences] = useState<UserPreferences>({
    genres: [],
    watchPreference: 'Both',
    notifications: true,
    theme: 'Auto'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID from localStorage
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
      // If no user ID, redirect to setup
      setLocation('/setup');
      return;
    }
    setUserId(currentUserId);
  }, [setLocation]);

  const genres = ["Action", "Drama", "Comedy", "Romance", "Horror", "Thriller", "Documentary", "Sci-Fi", "Animated", "Musical"];
  const watchOptions = [
    { value: 'Movies', label: 'Movies' },
    { value: 'Series', label: 'Series' },
    { value: 'Both', label: 'Both' }
  ];

  const handleGenreChange = (genre: string) => {
    setPreferences(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const handleWatchPreferenceChange = (preference: string) => {
    setPreferences(prev => ({
      ...prev,
      watchPreference: preference
    }));
  };

  const handleNotificationChange = (checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notifications: checked
    }));
  };

  const handleThemeChange = (theme: string) => {
    setPreferences(prev => ({
      ...prev,
      theme
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setIsLoading(true);
    try {
      await saveUserPreferences(userId, preferences);
      console.log('Preferences saved successfully:', preferences);
      // Clear user ID from localStorage as setup is complete
      localStorage.removeItem('currentUserId');
      alert('Preferences saved!');
      setLocation('/');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="preferences-container min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md mx-auto shadow-xl bg-gray-800/90 border-gray-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-yellow-400 text-xl font-bold">Account Preferences</CardTitle>
          <CardDescription className="text-gray-300">Customize your viewing experience</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-gray-200 font-medium">What genres do you enjoy?</Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {genres.map(genre => (
                  <div key={genre} className="flex items-center space-x-2">
                    <Checkbox 
                      id={genre}
                      checked={preferences.genres.includes(genre)}
                      onCheckedChange={() => handleGenreChange(genre)}
                      className="border-gray-500"
                    />
                    <Label htmlFor={genre} className="text-gray-300 text-sm cursor-pointer">
                      {genre}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-gray-200 font-medium">What do you prefer to watch?</Label>
              <RadioGroup 
                value={preferences.watchPreference} 
                onValueChange={handleWatchPreferenceChange}
                className="mt-3"
              >
                {watchOptions.map(option => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                      className="border-gray-500"
                    />
                    <Label htmlFor={option.value} className="text-gray-300 text-sm cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-gray-200 font-medium">Receive New Release Alerts?</Label>
              <Switch 
                checked={preferences.notifications}
                onCheckedChange={handleNotificationChange}
                className="data-[state=checked]:bg-yellow-500"
              />
            </div>

            <div>
              <Label className="text-gray-200 font-medium">Theme Preference</Label>
              <Select value={preferences.theme} onValueChange={handleThemeChange}>
                <SelectTrigger className="mt-2 bg-gray-700 border-gray-600 text-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="Auto" className="text-gray-200">Auto</SelectItem>
                  <SelectItem value="Light" className="text-gray-200">Light</SelectItem>
                  <SelectItem value="Dark" className="text-gray-200">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700 text-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save & Continue'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}