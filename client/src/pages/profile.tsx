import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, orderBy, getDocs, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Film } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';
import EditProjectModal from '@/components/EditProjectModal';
import imageCompression from 'browser-image-compression';

interface Project {
  id: string;
  title: string;
  description: string;
  genre?: string;
  posterURL?: string;
  videoURL?: string;
  uploadedBy: string;
  createdAt?: any;
  tags?: string[];
  cast?: string[];
  crew?: string[];
  visibility?: 'public' | 'private';
  public?: boolean;
  owner?: string;
  userId?: string;
}

const genresList = [
  "Action",
  "Drama", 
  "Comedy",
  "Romance",
  "Horror",
  "Thriller",
  "Documentary",
  "Sci-Fi",
  "Animated",
  "Musical",
];

export default function ProfilePage() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [profile, setProfile] = useState({
    name: "",
    role: "",
    photoUrl: "",
    bio: "",
    genres: [] as string[],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setLocation('/setup');
      } else {
        setUser(firebaseUser);
        setLoading(false);
        
        // Load profile data with timeout
        try {
          const profilePromise = async () => {
            const docRef = doc(db, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const data = docSnap.data();
              setProfile({
                name: data.name || "",
                role: data.role || "",
                photoUrl: data.profilePhotoURL || data.profilePhotoUrl || "",
                bio: data.bio || "",
                genres: data.genres || data.favoriteGenres || [],
              });
            }
          };
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile load timeout')), 5000) // 5 second timeout
          );
          
          await Promise.race([profilePromise(), timeoutPromise]);
        } catch (error) {
          console.warn('⚠️ Could not load profile data (Firebase issues), using defaults:', error);
          // Use default profile data
          setProfile({
            name: firebaseUser.displayName || "User",
            role: "Filmmaker",
            photoUrl: "",
            bio: "",
            genres: [],
          });
        }
        
        // Load user projects with timeout
        fetchUserProjects(firebaseUser.uid);
      }
    });
    return () => unsubscribe();
  }, [setLocation]);

  const fetchUserProjects = async (uid: string) => {
    try {
      // Try Firebase first with timeout
      const firebaseProjectsPromise = async () => {
        const uploadedByQuery = query(
          collection(db, "projects"),
          where("uploadedBy", "==", uid),
          orderBy("createdAt", "desc")
        );
        
        const uploadedBySnapshot = await getDocs(uploadedByQuery);
        return uploadedBySnapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
          public: doc.data().public !== false
        })) as Project[];
      };
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firebase timeout')), 3000) // 3 second timeout
      );
      
      let allProjects: Project[] = [];
      
      try {
        // Try Firebase first
        const firebaseProjects = await Promise.race([firebaseProjectsPromise(), timeoutPromise]) as Project[];
        allProjects = [...firebaseProjects];
        console.log(`✅ Loaded ${firebaseProjects.length} projects from Firebase`);
      } catch (firebaseError) {
        console.warn('⚠️ Firebase failed, trying Replit storage fallback:', firebaseError);
      }
      
      // Always also fetch from Replit storage (contains uploaded videos)
      try {
        const response = await fetch(`/api/projects/user/${uid}`);
        if (response.ok) {
          const replitProjects = await response.json();
          allProjects = [...allProjects, ...replitProjects];
          console.log(`✅ Loaded ${replitProjects.length} projects from Replit storage`);
        }
      } catch (replitError) {
        console.warn('⚠️ Could not load from Replit storage:', replitError);
      }
      
      // Remove duplicates and sort by date
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id || p.title === project.title)
      );
      
      uniqueProjects.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      setProjects(uniqueProjects);
      console.log(`📂 Total unique projects: ${uniqueProjects.length}`);
    } catch (error) {
      console.warn('⚠️ Could not load projects from any source:', error);
      setProjects([]);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    
    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        name: profile.name,
        role: profile.role,
        bio: profile.bio,
        genres: profile.genres,
        profilePhotoURL: profile.photoUrl,
        uid: user.uid,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      alert("Profile saved!");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile. Please try again.");
    }
  };

  const toggleGenre = (genre: string) => {
    setProfile((prev) => {
      const genres = prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre];
      return { ...prev, genres };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      // Create timeout promise to prevent indefinite hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout')), 30000) // 30 second timeout
      );

      const uploadPromise = async () => {
        // Compress the image before uploading
        const options = {
          maxSizeMB: 0.2, // 200KB max
          maxWidthOrHeight: 400, // 400px max dimension
          useWebWorker: true,
        };
        
        console.log('🔧 Compressing image...', 'Original size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
        const compressedFile = await imageCompression(file, options);
        console.log('✅ Image compressed:', 'New size:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB');
        
        const fileRef = ref(storage, `profilePhotos/${user.uid}`);
        const snapshot = await uploadBytes(fileRef, compressedFile);
        return await getDownloadURL(snapshot.ref);
      };

      const downloadURL = await Promise.race([uploadPromise(), timeoutPromise]) as string;
      setProfile(prev => ({ ...prev, photoUrl: downloadURL }));
      console.log('✅ Profile photo uploaded:', downloadURL);
      alert('Profile photo uploaded successfully!');
    } catch (error: any) {
      console.error('❌ Error uploading photo:', error);
      if (error.message === 'Upload timeout') {
        alert('Upload timed out. Please check your connection and try again.');
      } else if (error.code === 'storage/unauthorized') {
        alert('Upload failed: Storage permissions error. Please try again.');
      } else if (error.code === 'storage/quota-exceeded') {
        alert('Upload failed: Storage quota exceeded.');
      } else {
        alert('Failed to upload photo. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleSaveProject = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setEditingProject(null);
    setShowEditModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-neutral-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-black via-neutral-900 to-black text-white">
      <div className="max-w-2xl mx-auto bg-neutral-900 p-8 rounded-2xl shadow-md">
        {/* Header with Navigation Buttons */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🎬 Edit Your Filmmaker Profile
          </h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation(`/user/${user?.uid}`)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black rounded-lg font-medium transition"
            >
              View My Profile
            </button>
            <button
              onClick={() => setLocation('/')}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg font-medium transition"
            >
              ← Back to Home
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-300">Name</label>
            <input
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Enter your full name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300">
              Role (e.g. Director, Actor, Editor)
            </label>
            <input
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="e.g. Director, Actor, Editor"
              value={profile.role}
              onChange={(e) => setProfile({ ...profile, role: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-1">Profile Photo</label>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => document.getElementById('photo-upload')?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-400 text-black font-semibold"
                disabled={uploading}
              >
                📸 {uploading ? 'Uploading...' : 'Upload Photo'}
              </button>
              <input 
                id="photo-upload"
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              {profile.photoUrl && (
                <img 
                  src={profile.photoUrl} 
                  alt="Profile" 
                  className="w-12 h-12 object-cover rounded-full border-2 border-yellow-400"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300">Bio</label>
            <textarea
              rows={4}
              className="w-full px-4 py-2 rounded-lg bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Tell us about yourself and your filmmaking goals..."
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-300 mb-2">Favorite Genres</label>
            <div className="flex flex-wrap gap-2">
              {genresList.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1 rounded-full border text-sm font-medium transition ${
                    profile.genres.includes(genre)
                      ? "bg-yellow-500 text-black"
                      : "bg-neutral-700 text-white hover:bg-yellow-500 hover:text-black"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <button
            className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black font-bold transition"
            onClick={saveProfile}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Save Profile'}
          </button>
        </div>
      </div>

      <div className="mt-10 max-w-2xl mx-auto bg-neutral-900 p-6 rounded-2xl shadow-md text-center">
        <h3 className="text-white font-semibold text-lg mb-2 flex items-center justify-center gap-2">
          🎥 Your Projects ({projects.length})
        </h3>
        {projects.length === 0 ? (
          <>
            <p className="text-neutral-400 text-sm mb-4">No projects uploaded yet.</p>
            <button 
              onClick={() => setLocation('/upload')}
              className="px-4 py-2 bg-yellow-500 text-black font-semibold rounded hover:bg-yellow-400"
            >
              Upload Your First Project
            </button>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                user={user}
                onProjectUpdate={handleSaveProject}
                onProjectDelete={(projectId) => {
                  setProjects(prev => prev.filter(p => p.id !== projectId));
                }}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
}