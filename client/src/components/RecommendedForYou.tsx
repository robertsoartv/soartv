import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { fetchRecommended, getUserPreferences } from '@/lib/firebase';
import ProjectCard from '@/components/ProjectCard';
import { Skeleton } from '@/components/ui/skeleton';

interface Project {
  id: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  posterURL: string;
  videoURL: string;
  uploadedBy: string;
  createdAt: any;
  public: boolean;
  visibility?: "public" | "private";
}

interface RecommendedForYouProps {
  onVideoSelect: (video: Project) => void;
}

export default function RecommendedForYou({ onVideoSelect }: RecommendedForYouProps) {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGenres, setUserGenres] = useState<string[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's favorite genres
      const userProfile = await getUserPreferences(user.uid);
      const favoriteGenres = userProfile?.favoriteGenres || userProfile?.genres || [];
      setUserGenres(favoriteGenres);

      // Fetch recommended projects based on user's favorite genres
      const recommendedProjects = await fetchRecommended(favoriteGenres);
      setRecommendations(recommendedProjects as Project[]);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show section if user is not logged in
  if (!user) {
    return null;
  }

  // Don't show section if no recommendations and not loading
  if (!loading && recommendations.length === 0) {
    return null;
  }

  return (
    <section className="px-4 md:px-8 lg:px-12 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Recommended For You
          </h2>
          {userGenres.length > 0 && (
            <p className="text-gray-400 text-sm">
              Based on your interests: {userGenres.join(', ')}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg bg-gray-800" />
                <Skeleton className="h-4 w-3/4 bg-gray-800" />
                <Skeleton className="h-3 w-1/2 bg-gray-800" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendations.map((project) => (
              <div 
                key={project.id}
                onClick={() => onVideoSelect(project)}
                className="cursor-pointer"
              >
                <ProjectCard
                  project={project}
                  user={user}
                  showActions={false}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}