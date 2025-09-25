// client/src/UserProfile.tsx

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, deleteDoc, limit, orderBy } from "firebase/firestore";
import { auth, db } from "./lib/firebase"; // use existing exports
import { useLocation } from 'wouter';
import EditProjectModal from '@/components/EditProjectModal';
import TrailerModal from '@/components/TrailerModal';

interface UserProfile {
  name: string;
  bio: string;
  role: string;
  profilePhotoUrl?: string; // Link to Firebase Storage
  featuredProjects?: string[]; // Array of project IDs
  favoriteGenres?: string[]; // User's preferred genres
}

interface Project {
  id: string;
  title: string;
  genre?: string;
  description?: string;
  posterURL?: string;
  videoURL?: string;
  owner?: string;
  userId?: string;
  uploadedBy: string; // For project ownership identification
  createdAt?: any;
  tags?: string[];
  cast?: string[];
  crew?: string[];
  visibility?: 'public' | 'private'; // Project visibility setting
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [, setLocation] = useLocation();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [selectedTrailerUrl, setSelectedTrailerUrl] = useState<string>("");
  const [selectedProjectTitle, setSelectedProjectTitle] = useState<string>("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setLocation('/setup');
      } else {
        setUser(currentUser);
        
        // Show basic UI immediately with cached or default data
        setLoading(false);
        
        // Set fallback profile immediately to show something
        setUserProfile({
          name: currentUser.displayName || "User",
          bio: "",
          role: "Filmmaker"
        });
        
        // Load data in background without blocking UI
        fetchUserProfile(currentUser.uid);
        fetchProjects(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [setLocation]);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        console.log("No user profile found in Firestore");
        // Create a basic profile if none exists
        setUserProfile({
          name: "User",
          bio: "",
          role: "Filmmaker"
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set fallback profile on error
      setUserProfile({
        name: "User",
        bio: "",
        role: "Filmmaker"
      });
    }
  };

  const fetchProjects = async (uid: string) => {
    try {
      // Quick 3-second timeout for better UX
      const fetchWithTimeout = (promise: Promise<any>, timeoutMs = 3000) => {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        );
        return Promise.race([promise, timeoutPromise]);
      };

      let allProjects: Project[] = [];

      // Try Firebase first
      try {
        const q = query(
          collection(db, "projects"), 
          where("uploadedBy", "==", uid),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        
        const snapshot = await fetchWithTimeout(getDocs(q));
        const firebaseProjects = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Project[];
        allProjects = [...firebaseProjects];
        console.log(`✅ Found ${firebaseProjects.length} projects from Firebase`);
      } catch (firebaseError) {
        console.warn('⚠️ Firebase failed, using Replit storage:', firebaseError);
      }

      // Also fetch from Replit backend storage (contains uploaded videos)
      try {
        const response = await fetch(`/api/projects/user/${uid}`);
        if (response.ok) {
          const replitProjects = await response.json();
          allProjects = [...allProjects, ...replitProjects];
          console.log(`✅ Found ${replitProjects.length} projects from Replit storage`);
        }
      } catch (replitError) {
        console.warn('⚠️ Could not load from Replit storage:', replitError);
      }

      // Remove duplicates and sort by date
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id || (p.title === project.title && p.uploadedBy === project.uploadedBy))
      );
      
      uniqueProjects.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      console.log(`📂 Total unique projects loaded: ${uniqueProjects.length}`);
      setProjects(uniqueProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Don't block UI - projects will just show empty state
      setProjects([]);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setLocation('/');
    } catch (error) {
      console.error("Sign-out error:", error);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowEditModal(true);
  };

  const handleSaveProject = (updatedProject: any) => {
    // Update the project in local state
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject as Project : p));
    setEditingProject(null);
    setShowEditModal(false);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeleting(projectId);
    try {
      await deleteDoc(doc(db, "projects", projectId));
      
      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      
      console.log('✅ Project deleted successfully');
      alert('Project deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <p>Loading your profile...</p>;

  return (
    <div style={{ padding: "1rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Profile Header */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "20px", 
        marginBottom: "2rem",
        padding: "20px",
        backgroundColor: "#111",
        borderRadius: "10px",
        border: "1px solid #ffd700"
      }}>
        {/* Profile Photo */}
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          backgroundColor: "#333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "24px",
          color: "#ffd700",
          fontWeight: "bold",
          backgroundImage: userProfile?.profilePhotoUrl ? `url(${userProfile.profilePhotoUrl})` : 'none',
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}>
          {!userProfile?.profilePhotoUrl && (userProfile?.name?.[0] || user?.displayName?.[0] || user?.email?.[0] || 'U')}
        </div>

        {/* Profile Info */}
        <div style={{ flex: 1, color: "white" }}>
          <h1 style={{ margin: "0 0 10px 0", color: "#ffd700" }}>
            {userProfile?.name || user?.displayName || "User"}
          </h1>
          <p style={{ margin: "0 0 10px 0", color: "#ccc" }}>
            {userProfile?.role || "Filmmaker"} • {user?.email}
          </p>
          {userProfile?.bio && (
            <p style={{ margin: "0", color: "#aaa", fontSize: "14px" }}>
              {userProfile.bio}
            </p>
          )}
        </div>

        {/* Sign Out Button */}
        <button 
          onClick={handleSignOut} 
          style={{ 
            padding: "0.5rem 1rem",
            backgroundColor: '#900', 
            color: 'white', 
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Sign Out
        </button>
      </div>

      {/* Projects Section */}
      <h2 style={{ color: "white", marginBottom: "1rem" }}>Your Uploaded Projects</h2>
      {projects.length === 0 ? (
        <div style={{ 
          padding: "40px", 
          textAlign: "center", 
          backgroundColor: "#111", 
          borderRadius: "10px", 
          color: "#aaa" 
        }}>
          <p>No projects found.</p>
          <p style={{ fontSize: "14px" }}>
            Start uploading your films to showcase your work!
          </p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((proj) => (
            <div key={proj.id} className="project-card">
              {proj.posterURL && (
                <div 
                  style={{ 
                    position: "relative", 
                    width: "100%", 
                    height: "150px", 
                    marginBottom: "10px" 
                  }}
                >
                  <img 
                    src={proj.posterURL} 
                    alt={proj.title} 
                    style={{ 
                      width: "100%", 
                      height: "100%", 
                      objectFit: "cover", 
                      borderRadius: "5px",
                      cursor: proj.videoURL ? "pointer" : "default"
                    }}
                    onClick={() => {
                      if (proj.videoURL) {
                        setSelectedTrailerUrl(proj.videoURL);
                        setSelectedProjectTitle(proj.title || "");
                        setShowTrailerModal(true);
                      }
                    }}
                  />
                  {proj.videoURL && (
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      opacity: 0.8
                    }}>
                      <span style={{ color: "white", fontSize: "16px" }}>▶</span>
                    </div>
                  )}
                </div>
              )}
              <h3 style={{ margin: "0 0 10px 0", color: "#ffd700" }}>{proj.title}</h3>
              <p style={{ margin: "0 0 10px 0", color: "#ccc", fontSize: "14px" }}>
                <em>{proj.description}</em>
              </p>
              {proj.genre && (
                <p style={{ margin: "0 0 10px 0", color: "#aaa", fontSize: "12px" }}>
                  Genre: {proj.genre}
                </p>
              )}
              {proj.videoURL && (
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  {proj.videoURL && (
                    <button
                      onClick={() => {
                        setSelectedTrailerUrl(proj.videoURL!);
                        setSelectedProjectTitle(proj.title || "");
                        setShowTrailerModal(true);
                      }}
                      style={{ 
                        color: "#ffd700", 
                        backgroundColor: "transparent",
                        border: "1px solid #ffd700",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      Watch Trailer
                    </button>
                  )}
                  
                  {/* Actions for project owner */}
                  {user && (proj.owner === user.uid || proj.userId === user.uid || (proj as any).uploadedBy === user.uid) && (
                    <div style={{ marginTop: "10px" }}>
                      {/* Visibility toggle */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <span style={{ fontSize: "12px", color: "#ccc" }}>Visibility:</span>
                        <button
                          style={{
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            border: "none",
                            cursor: "pointer",
                            backgroundColor: proj.visibility === "public" ? "#16a34a" : "#dc2626",
                            color: "white"
                          }}
                        >
                          {proj.visibility === "public" ? "Public" : "Private"}
                        </button>
                      </div>
                      
                      {/* Edit/Delete buttons */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEditProject(proj)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-3 py-1 rounded transition duration-300"
                          style={{ fontSize: "12px" }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          disabled={deleting === proj.id}
                          className="bg-red-500 hover:bg-red-600 text-white font-semibold px-3 py-1 rounded transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ fontSize: "12px" }}
                        >
                          🗑 {deleting === proj.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Featured Projects Section */}
      {userProfile?.featuredProjects && userProfile.featuredProjects.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h3 style={{ color: "white", marginBottom: "1rem" }}>Featured Projects</h3>
          <div style={{ 
            display: "flex", 
            gap: "10px", 
            flexWrap: "wrap" 
          }}>
            {userProfile.featuredProjects.map((projectId, index) => {
              const featuredProject = projects.find(p => p.id === projectId);
              return featuredProject ? (
                <div key={index} style={{
                  padding: "10px",
                  backgroundColor: "#222",
                  borderRadius: "5px",
                  border: "2px solid #ffd700",
                  color: "white",
                  fontSize: "14px"
                }}>
                  ⭐ {featuredProject.title}
                </div>
              ) : null;
            })}
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject as any}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
        />
      )}

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={showTrailerModal}
        onClose={() => {
          setShowTrailerModal(false);
          setSelectedTrailerUrl("");
          setSelectedProjectTitle("");
        }}
        trailerUrl={selectedTrailerUrl}
        title={selectedProjectTitle}
      />
    </div>
  );
}