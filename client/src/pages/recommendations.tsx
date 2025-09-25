import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/authContext';
import { getUserRecommendations, fetchRecommended, fetchProfile } from '@/lib/firebase';
import { Film, Users, MapPin, Heart, Eye, Calendar } from 'lucide-react';

interface RecommendedUser {
  uid: string;
  name: string;
  role: string;
  genres: string[];
  bio: string;
  profileImageURL: string;
  location?: string;
  projects: any[];
  matchScore: number;
  matchReasons: string[];
}

interface RecommendedProject {
  id: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  posterURL: string;
  videoURL: string;
  uploadedBy: string;
  uploaderData: any;
  createdAt: string;
  matchScore: number;
  matchReasons: string[];
}

export default function Recommendations() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [recommendedProjects, setRecommendedProjects] = useState<RecommendedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');

  useEffect(() => {
    if (!user) {
      setLocation('/setup');
      return;
    }
    
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;
    
    try {
      const recommendations = await getUserRecommendations(user.uid);
      setRecommendedUsers(recommendations.users || []);
      setRecommendedProjects(recommendations.projects || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Potential Match';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Please sign in to see recommendations</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold text-yellow-400">Soar</span>
            <span className="text-3xl font-bold text-red-500">TV</span>
            <span className="text-xl text-white ml-3">Recommendations</span>
          </div>
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            Back to Home
          </Button>
        </div>

        {/* Recommendations Tabs */}
        <Card className="bg-black/80 border-gray-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-yellow-400" />
              Personalized for You
            </CardTitle>
            <p className="text-gray-400">
              Discover projects and filmmakers that match your interests and skills
            </p>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="projects" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                  <Film className="w-4 h-4 mr-2" />
                  Projects
                </TabsTrigger>
                <TabsTrigger value="filmmakers" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                  <Users className="w-4 h-4 mr-2" />
                  Filmmakers
                </TabsTrigger>
              </TabsList>

              {/* Recommended Projects */}
              <TabsContent value="projects" className="mt-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">Loading project recommendations...</div>
                  </div>
                ) : recommendedProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <div className="text-gray-400 mb-4">No project recommendations available yet</div>
                    <p className="text-sm text-gray-500 mb-6">
                      Complete your profile and interact with the community to get personalized recommendations
                    </p>
                    <Button
                      onClick={() => setLocation('/profile')}
                      className="bg-yellow-500 text-black hover:bg-yellow-600"
                    >
                      Complete Profile
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedProjects.map((project) => (
                      <Card key={project.id} className="bg-gray-800 border-gray-700 overflow-hidden hover:border-yellow-400/50 transition-colors">
                        {/* Project Thumbnail */}
                        <div className="aspect-video bg-gray-900 relative">
                          {project.posterURL ? (
                            <img 
                              src={project.posterURL} 
                              alt={project.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-12 h-12 text-gray-600" />
                            </div>
                          )}
                          
                          {/* Match Score Badge */}
                          <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                            <span className={getMatchScoreColor(project.matchScore)}>
                              {project.matchScore}% match
                            </span>
                          </div>
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Button size="sm" className="bg-yellow-500 text-black hover:bg-yellow-600">
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </Button>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          {/* Project Info */}
                          <h3 className="font-semibold mb-2 line-clamp-1">{project.title}</h3>
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                            {project.description}
                          </p>

                          {/* Match Reasons */}
                          <div className="mb-3">
                            <div className={`text-xs font-medium mb-1 ${getMatchScoreColor(project.matchScore)}`}>
                              {getMatchScoreLabel(project.matchScore)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {project.matchReasons.slice(0, 2).join(' • ')}
                            </div>
                          </div>

                          {/* Genre and Creator */}
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="border-gray-600 text-gray-300">
                              {project.genre}
                            </Badge>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={project.uploaderData?.profileImageURL} />
                                <AvatarFallback className="bg-gray-700 text-white text-xs">
                                  {project.uploaderData?.name?.charAt(0) || 'F'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-gray-400">
                                {project.uploaderData?.name || 'Filmmaker'}
                              </span>
                            </div>
                          </div>

                          {/* Tags */}
                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {project.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Recommended Filmmakers */}
              <TabsContent value="filmmakers" className="mt-6">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">Loading filmmaker recommendations...</div>
                  </div>
                ) : recommendedUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <div className="text-gray-400 mb-4">No filmmaker recommendations available yet</div>
                    <p className="text-sm text-gray-500 mb-6">
                      Complete your profile and engage with the community to find potential collaborators
                    </p>
                    <Button
                      onClick={() => setLocation('/feed')}
                      className="bg-yellow-500 text-black hover:bg-yellow-600"
                    >
                      Explore Community
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendedUsers.map((filmmaker) => (
                      <Card key={filmmaker.uid} className="bg-gray-800 border-gray-700 hover:border-yellow-400/50 transition-colors">
                        <CardContent className="p-6">
                          {/* Filmmaker Header */}
                          <div className="flex items-start space-x-4 mb-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={filmmaker.profileImageURL} alt={filmmaker.name} />
                              <AvatarFallback className="bg-gray-700 text-white">
                                {filmmaker.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{filmmaker.name}</h3>
                              <Badge variant="outline" className="border-gray-600 text-gray-300 mb-2">
                                {filmmaker.role}
                              </Badge>
                              <div className={`text-sm font-medium ${getMatchScoreColor(filmmaker.matchScore)}`}>
                                {filmmaker.matchScore}% compatibility
                              </div>
                            </div>
                          </div>

                          {/* Match Reasons */}
                          <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-1">Why you might collaborate:</div>
                            <div className="text-sm text-gray-300">
                              {filmmaker.matchReasons.slice(0, 2).join(' • ')}
                            </div>
                          </div>

                          {/* Bio */}
                          <p className="text-sm text-gray-400 mb-4 line-clamp-3">
                            {filmmaker.bio || "No bio provided yet."}
                          </p>

                          {/* Genres */}
                          <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-2">Specializes in:</div>
                            <div className="flex flex-wrap gap-1">
                              {filmmaker.genres.slice(0, 4).map((genre, index) => (
                                <span key={index} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                  {genre}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Location */}
                          {filmmaker.location && (
                            <div className="flex items-center text-sm text-gray-400 mb-4">
                              <MapPin className="w-4 h-4 mr-2" />
                              {filmmaker.location}
                            </div>
                          )}

                          {/* Projects Count */}
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-400">
                              {filmmaker.projects.length} project{filmmaker.projects.length !== 1 ? 's' : ''}
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
                            >
                              View Profile
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Recommendation Tips */}
        <Card className="bg-black/80 border-gray-800 text-white">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">How we personalize your recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start space-x-3">
                <Film className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Genre Preferences</div>
                  <div className="text-gray-400">Projects matching your favorite genres and styles</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Role Compatibility</div>
                  <div className="text-gray-400">Filmmakers with complementary skills for collaboration</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <div className="font-medium mb-1">Location & Timing</div>
                  <div className="text-gray-400">Recent activity and geographical proximity</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}