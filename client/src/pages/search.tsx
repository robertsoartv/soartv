import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/authContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Search, Film, User, Loader2, Filter, Mic, MicOff } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { debounce } from 'lodash';
import LiveSearchBar from '@/components/LiveSearchBar';
import { featuredSlides } from '@/data/featuredSlides';

// Web Speech API types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

const genreOptions = [
  "All",
  "Drama",
  "Comedy", 
  "Horror",
  "Documentary",
  "Thriller",
  "Sci-Fi",
  "Romance",
  "Action",
  "Animation",
];

interface Project {
  id: string;
  title: string;
  description: string;
  genre: string;
  posterURL?: string;
  uploadedBy: string;
  visibility: string;
  tags: string[];
}

interface UserProfile {
  id: string;
  name: string;
  bio?: string;
  role: string;
  profilePhotoUrl?: string;
}

export default function SearchPage() {
  const { user, loading: authLoading } = useAuth();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<{ users: UserProfile[]; projects: Project[] }>({ users: [], projects: [] });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  
  // Parse URL query parameter
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const urlQuery = urlParams.get('query') || '';

  // Cache featured movies data for performance
  const featuredProjectsCache = featuredSlides.map(slide => ({
    id: `featured-${slide.id}`,
    title: slide.title,
    description: slide.subtitle,
    genre: slide.subtitle.includes('Horror') ? 'Horror' : 
           slide.subtitle.includes('Comedy') ? 'Comedy' :
           slide.subtitle.includes('Drama') ? 'Drama' :
           slide.subtitle.includes('Romance') ? 'Romance' :
           slide.subtitle.includes('Thriller') ? 'Thriller' :
           slide.subtitle.includes('Sci-Fi') ? 'Sci-Fi' : 'Drama',
    posterURL: slide.posterImage || slide.bgImage,
    uploadedBy: 'featured',
    visibility: 'public',
    tags: slide.subtitle.split('•')[2]?.split(',').map(t => t.trim()) || []
  }));

  const fetchSuggestions = async (term: string) => {
    if (!term.trim()) {
      setSuggestions({ users: [], projects: [] });
      setHasSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const searchTerm = term.trim().toLowerCase();

      // Filter featured projects first (instant local search)
      const matchedFeaturedProjects = featuredProjectsCache.filter(project => {
        const titleMatch = project.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = project.description && project.description.toLowerCase().includes(searchTerm);
        const tagMatch = project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        const genreMatch = selectedGenre === "All" || project.genre === selectedGenre;
        
        return genreMatch && (titleMatch || descriptionMatch || tagMatch);
      });

      // Only query Firebase if we need more results or if search term is long enough
      let matchedUsers: UserProfile[] = [];
      let matchedFirebaseProjects: Project[] = [];

      if (searchTerm.length >= 2) {
        // Optimized Firebase queries - smaller limits for speed
        const userQuery = query(collection(db, 'users'), limit(20));
        const projectQuery = selectedGenre !== "All" 
          ? query(collection(db, 'projects'), where('genre', '==', selectedGenre), limit(20))
          : query(collection(db, 'projects'), limit(20));

        const [userSnap, projectSnap] = await Promise.all([
          getDocs(userQuery),
          getDocs(projectQuery)
        ]);

        const allUsers = userSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserProfile[];
        const allProjects = projectSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Project[];

        // Fast client-side filtering
        matchedUsers = allUsers.filter(user => 
          user.name && user.name.toLowerCase().includes(searchTerm)
        );

        matchedFirebaseProjects = allProjects.filter(project => {
          if (!project.title) return false;
          const titleMatch = project.title.toLowerCase().includes(searchTerm);
          const descriptionMatch = project.description && project.description.toLowerCase().includes(searchTerm);
          const tagMatch = project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchTerm));
          const isPublic = !project.visibility || project.visibility === 'public';
          
          return isPublic && (titleMatch || descriptionMatch || tagMatch);
        });
      }

      // Combine results (featured first for priority)
      const matchedProjects = [...matchedFeaturedProjects, ...matchedFirebaseProjects];

      setSuggestions({
        users: matchedUsers,
        projects: matchedProjects
      });

    } catch (error) {
      console.error('❌ Search error:', error);
      setSuggestions({ users: [], projects: [] });
    } finally {
      setLoading(false);
    }
  };

  // Debounced version of fetchSuggestions - faster response
  const debouncedFetch = debounce(fetchSuggestions, 150);

  useEffect(() => {
    debouncedFetch(searchTerm);
    return () => debouncedFetch.cancel(); // cleanup
  }, [searchTerm, selectedGenre]);

  // Handle URL query parameter on page load
  useEffect(() => {
    if (urlQuery && urlQuery !== searchTerm) {
      setSearchTerm(urlQuery);
      fetchSuggestions(urlQuery);
    }
  }, [urlQuery]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdvancedSearch();
    }
  };

  const handleAdvancedSearch = () => {
    if (!searchTerm.trim()) return;
    
    // Update URL with query parameter
    const newUrl = `/search?query=${encodeURIComponent(searchTerm.trim())}`;
    setLocation(newUrl);
    
    // Perform search
    fetchSuggestions(searchTerm.trim());
  };

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setSpeechSupported(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.interimResults = true;
    recog.continuous = false;
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      setIsListening(true);
      setInterimTranscript('');
    };

    recog.onend = () => setIsListening(false);

    recog.onresult = (event: SpeechRecognitionEvent) => {
      let final = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setSearchTerm(final);
        setInterimTranscript('');
        fetchSuggestions(final);
      } else {
        setInterimTranscript(interim);
      }
    };

    setRecognition(recog);
  }, []);

  // Voice search handlers
  const startVoiceSearch = () => {
    if (recognition && !isListening) {
      recognition.start();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold text-yellow-400">Soar</span>
            <span className="text-3xl font-bold text-red-500">TV</span>
          </div>
        </div>

        {/* Live Search Section */}
        <Card className="bg-black/80 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Search className="w-6 h-6 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">Search Projects & Filmmakers</h1>
            </div>
            <p className="text-gray-400 mb-6">
              Discover amazing films and connect with talented creators in the SoarTV community
            </p>
            
            {/* Live Search Bar Component */}
            <LiveSearchBar />
          </CardContent>
        </Card>

        {/* Advanced Search Section */}
        <Card className="bg-black/80 border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Search className="w-5 h-5 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Advanced Search</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Search for comprehensive results across all content
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter search terms for detailed results or click the microphone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-yellow-400"
                />
                {/* Voice Search Button */}
                {speechSupported ? (
                  <Button
                    onClick={startVoiceSearch}
                    disabled={loading || isListening}
                    className={`px-3 ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                    }`}
                    title={isListening ? 'Listening...' : 'Start voice search'}
                  >
                    {isListening ? <Mic className="w-4 h-4 text-red-100" /> : <Mic className="w-4 h-4" />}
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="px-3 bg-gray-800 text-gray-500"
                    title="Voice search not supported in this browser"
                  >
                    <MicOff className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={handleAdvancedSearch}
                  disabled={loading || !searchTerm.trim()}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-6"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {loading ? 'Searching...' : 'Search All'}
                </Button>
              </div>

              {/* Interim Transcript Display */}
              {isListening && interimTranscript && (
                <div className="text-sm text-yellow-400 italic bg-gray-900/50 p-2 rounded border border-gray-700">
                  <span className="text-gray-400">Listening:</span> "{interimTranscript}..."
                </div>
              )}

              {/* Genre Filter */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-white">
                  <Filter className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium">Filter by Genre:</span>
                </div>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white focus:border-yellow-400">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    {genreOptions.map((genre) => (
                      <SelectItem 
                        key={genre} 
                        value={genre}
                        className="text-white hover:bg-gray-800 focus:bg-gray-800"
                      >
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedGenre !== "All" && (
                  <Button
                    onClick={() => setSelectedGenre("All")}
                    variant="outline"
                    size="sm"
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Clear Filter
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {(hasSearched || urlQuery) && (
          <>
            <Card className="bg-black/80 border-gray-800">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  Search Results {urlQuery && `for "${urlQuery}"`}
                </h2>
                
                {/* Projects Results */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Projects ({suggestions.projects.length} found)
                    </h3>
                  </div>
              
              {suggestions.projects.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {suggestions.projects.map(project => (
                    <Link key={project.id} href={`/watch/${project.id}`}>
                      <Card className="bg-black/80 border-gray-800 hover:border-yellow-400/50 transition-all cursor-pointer">
                        <CardContent className="p-4">
                          {project.posterURL && (
                            <div className="aspect-video bg-gray-900 rounded-lg mb-3 overflow-hidden">
                              <img
                                src={project.posterURL}
                                alt={project.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <h3 className="text-lg font-bold text-white mb-2">{project.title}</h3>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">{project.description}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400 text-xs">
                              {project.genre}
                            </Badge>
                            {project.tags?.slice(0, 2).map(tag => (
                              <Badge key={tag} variant="outline" className="border-gray-600 text-gray-300 text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="bg-black/80 border-gray-800">
                  <CardContent className="p-6 text-center">
                    <Film className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400">No matching projects found for "{searchTerm}"</p>
                    </CardContent>
                  </Card>
                )}
                </div>

                {/* Users Results */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-semibold text-white">
                      Filmmakers ({suggestions.users.length} found)
                    </h3>
                  </div>
              
                  {suggestions.users.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {suggestions.users.map((userProfile: UserProfile) => (
                        <Link key={userProfile.id} href={`/user/${userProfile.id}`}>
                          <Card className="bg-black/80 border-gray-800 hover:border-yellow-400/50 transition-all cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={userProfile.profilePhotoUrl} />
                                  <AvatarFallback className="bg-yellow-400 text-black font-bold">
                                    {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-lg font-bold text-white">{userProfile.name}</h3>
                                  <Badge variant="secondary" className="bg-yellow-400/20 text-yellow-400 text-xs">
                                    {userProfile.role}
                                  </Badge>
                                </div>
                              </div>
                              {userProfile.bio && (
                                <p className="text-sm text-gray-400 line-clamp-2">{userProfile.bio}</p>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-black/80 border-gray-800">
                      <CardContent className="p-6 text-center">
                        <User className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-400">No matching filmmakers found for "{searchTerm}"</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* No Results Message */}
                {suggestions.users.length === 0 && suggestions.projects.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No Results Found</h3>
                    <p className="text-gray-400">
                      No projects or filmmakers found {urlQuery && `for "${urlQuery}"`}. Try different keywords.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Initial State */}
        {!hasSearched && !loading && (
          <Card className="bg-black/80 border-gray-800">
            <CardContent className="p-12 text-center">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Start Your Search</h3>
              <p className="text-gray-400">
                Enter keywords to find amazing projects and talented filmmakers in the SoarTV community
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}