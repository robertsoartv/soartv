// client/src/pages/UserPublicProfile.tsx

import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, getUserPreferences } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Film, Calendar } from 'lucide-react';
import { Link } from 'wouter';

interface UserProfile {
  name: string;
  bio: string;
  role: string;
  profilePhotoUrl?: string;
  featuredProjects?: string[];
}

interface Project {
  id: string;
  title: string;
  genre: string;
  description: string;
  posterURL?: string;
  videoURL?: string;
  createdAt: any;
  cast?: string[];
  crew?: string[];
  tags?: string[];
}

export default function UserPublicProfile() {
  const [match, params] = useRoute('/user/:userId');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (match && params?.userId) {
      fetchUserProfile(params.userId);
    }
  }, [match, params?.userId]);

  const fetchUserProfile = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Create timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );

      const loadPromise = async () => {
        // Use optimized getUserPreferences function with caching
        const userData = await getUserPreferences(userId);
        
        if (!userData) {
          throw new Error("User not found");
        }

        setProfile(userData as UserProfile);

        // Fetch user's public projects with simplified query
        const projectsQuery = query(
          collection(db, "projects"),
          where("uploadedBy", "==", userId),
          where("visibility", "==", "public")
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        const userProjects = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProjects(userProjects as Project[]);
      };

      await Promise.race([loadPromise(), timeoutPromise]);

    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      if (error.message === 'Request timeout') {
        setError("Loading timed out. Please check your connection and try again.");
      } else if (error.message === 'User not found') {
        setError("User not found");
      } else {
        setError("Failed to load user profile. Please try refreshing the page.");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-400">{error || "Profile not found"}</h1>
          <Link href="/browse">
            <Button className="bg-yellow-500 text-black hover:bg-yellow-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-black p-6">
        <div className="max-w-6xl mx-auto">
          <Link href="/browse">
            <Button className="mb-4 bg-gray-700 text-white border border-gray-500 hover:bg-gray-600 hover:border-gray-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
          
          <div className="flex items-start gap-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {profile.profilePhotoUrl ? (
                <img 
                  src={profile.profilePhotoUrl} 
                  alt={profile.name}
                  className="w-32 h-32 object-cover rounded-full border-4 border-yellow-500"
                />
              ) : (
                <div className="w-32 h-32 bg-gray-700 rounded-full border-4 border-yellow-500 flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{profile.name}</h1>
              <p className="text-xl text-yellow-400 mb-4">{profile.role}</p>
              <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
                {profile.bio || "This filmmaker hasn't added a bio yet."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <Film className="w-6 h-6 text-yellow-500" />
          <h2 className="text-2xl font-bold">Projects ({projects.length})</h2>
        </div>

        {projects.length === 0 ? (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <Film className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No projects uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="bg-gray-900 border-gray-700 hover:border-yellow-500 transition-colors cursor-pointer group">
                <CardHeader className="p-0">
                  {project.posterURL ? (
                    <img 
                      src={project.posterURL} 
                      alt={project.title}
                      className="w-full h-48 object-cover rounded-t-lg group-hover:opacity-75 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-800 rounded-t-lg flex items-center justify-center">
                      <Film className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                </CardHeader>
                
                <CardContent className="p-4">
                  <CardTitle className="text-white mb-2 group-hover:text-yellow-400 transition-colors">
                    {project.title}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                      {project.genre}
                    </span>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(project.createdAt)}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {project.description}
                  </p>
                  
                  {(project.cast && project.cast.length > 0) && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-400">
                        Cast: {project.cast.slice(0, 2).join(', ')}
                        {project.cast.length > 2 && '...'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}