import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';
import { getUserSavedProjects } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProjectCard from '@/components/ProjectCard';
import { Button } from '@/components/ui/button';
import { Bookmark, ArrowLeft } from 'lucide-react';

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
  visibility: 'public' | 'private';
}

export default function SavedProjects() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [savedProjects, setSavedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation('/setup');
      return;
    }
    
    loadSavedProjects();
  }, [user]);

  const loadSavedProjects = async () => {
    if (!user) return;

    try {
      const projects = await getUserSavedProjects(user.uid);
      setSavedProjects(projects as Project[]);
    } catch (error) {
      console.error('Error loading saved projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setSavedProjects(prev => 
      prev.map(project => 
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  };

  const handleProjectDelete = (projectId: string) => {
    setSavedProjects(prev => prev.filter(project => project.id !== projectId));
  };

  const removeSavedProject = async (projectId: string) => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid, "savedProjects", projectId);
      await deleteDoc(docRef);
      setSavedProjects((prev) => prev.filter((p) => p.id !== projectId));
      console.log("✅ Project removed from saved");
    } catch (error) {
      console.error("❌ Error removing saved project:", error);
      alert("Failed to remove project. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Please sign in to view saved projects</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/')}
              variant="ghost"
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
        
        <h1 className="text-3xl font-extrabold mb-6 border-b border-gray-700 pb-2">
          🎬 Your Saved Projects
        </h1>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-white text-xl">Loading your saved projects...</div>
          </div>
        ) : savedProjects.length === 0 ? (
          <div className="text-center py-20">
            <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-2">No saved projects yet</h2>
            <p className="text-gray-500 mb-6">
              Start exploring and save projects you're interested in!
            </p>
            <Button
              onClick={() => setLocation('/browse')}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
            >
              Browse Projects
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-gray-400 mb-6">
              You have saved {savedProjects.length} project{savedProjects.length !== 1 ? 's' : ''}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {savedProjects.map((project) => (
                <div key={project.id} className="relative">
                  <ProjectCard
                    project={project}
                    user={user}
                    onProjectUpdate={handleProjectUpdate}
                    onProjectDelete={handleProjectDelete}
                    showActions={false}
                  />
                  <button
                    onClick={() => removeSavedProject(project.id)}
                    className="mt-2 text-sm text-red-500 hover:underline"
                  >
                    Remove from saved
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}