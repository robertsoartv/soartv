import { useState, useEffect } from "react";
import { doc, deleteDoc, updateDoc, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { User } from "firebase/auth";
import { db, likeProject, unlikeProject, checkUserLikedProject, getProjectLikesCount, saveProject, unsaveProject, checkUserSavedProject, getUserPreferences } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Play, Bookmark, BookmarkCheck } from "lucide-react";
import { FaThumbsUp, FaRegThumbsUp } from "react-icons/fa";
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import EditProjectModal from "./EditProjectModal";
import TrailerModal from "./TrailerModal";

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
}

interface ProjectCardProps {
  project: Project;
  user: User | null;
  onProjectUpdate?: (updatedProject: Project) => void;
  onProjectDelete?: (projectId: string) => void;
  showActions?: boolean;
}

export default function ProjectCard({ 
  project, 
  user, 
  onProjectUpdate, 
  onProjectDelete,
  showActions = true 
}: ProjectCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const isOwner = user && (
    project.uploadedBy === user.uid || 
    (project as any).owner === user.uid || 
    (project as any).userId === user.uid
  );

  useEffect(() => {
    if (user && project.id) {
      loadInteractionData();
    }
  }, [user, project.id]);

  // Fetch comments live (with error handling for Firebase issues)
  useEffect(() => {
    if (!project.id || !showComments) return;

    setLoadingComments(true);
    
    try {
      const q = query(
        collection(db, "projects", project.id, "comments"),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
          setLoadingComments(false);
        },
        (error) => {
          console.warn('⚠️ Comments unavailable (Firebase issues):', error);
          setComments([]);
          setLoadingComments(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.warn('⚠️ Could not load comments (Firebase issues):', error);
      setComments([]);
      setLoadingComments(false);
    }
  }, [project.id, showComments]);

  const loadInteractionData = async () => {
    if (!user || !project.id) return;

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Interaction data timeout')), 3000)
      );
      
      const dataPromise = Promise.all([
        checkUserLikedProject(project.id, user.uid),
        checkUserSavedProject(user.uid, project.id),
        getProjectLikesCount(project.id)
      ]);

      const [liked, saved, likes] = await Promise.race([dataPromise, timeoutPromise]) as [boolean, boolean, number];

      setIsLiked(liked);
      setIsSaved(saved);
      setLikesCount(likes);
    } catch (error) {
      console.warn('⚠️ Interaction data unavailable (Firebase issues):', error);
      // Set defaults when Firebase fails
      setIsLiked(false);
      setIsSaved(false);
      setLikesCount(0);
    }
  };

  const handleAddComment = async (projectId: string) => {
    if (!user || !commentText.trim()) return;

    try {
      const userData = await getUserPreferences(user.uid);
      
      await addDoc(collection(db, "projects", projectId, "comments"), {
        text: commentText.trim(),
        userId: user.uid,
        userName: userData?.name || user.displayName || 'Anonymous User',
        userPhoto: userData?.profilePhotoUrl || user.photoURL || null,
        timestamp: serverTimestamp(),
      });

      setCommentText("");
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, "projects", project.id, "comments", commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const handleEditSave = (updatedProject: Project) => {
    setShowEditModal(false);
    if (onProjectUpdate) {
      onProjectUpdate(updatedProject);
    }
  };

  const toggleLike = async (projectId: string) => {
    if (!user || !projectId || loadingLike) return;

    setLoadingLike(true);
    try {
      if (isLiked) {
        await unlikeProject(projectId, user.uid);
        setIsLiked(false);
        setLikesCount(prev => prev - 1);
      } else {
        await likeProject(projectId, user.uid);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoadingLike(false);
    }
  };

  const handleSave = async () => {
    if (!user || !project.id || loadingSave) return;

    setLoadingSave(true);
    try {
      if (isSaved) {
        await unsaveProject(user.uid, project.id);
        setIsSaved(false);
      } else {
        await saveProject(user.uid, project.id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setLoadingSave(false);
    }
  };

  const toggleVisibility = async (projectId: string, currentVisibility: string) => {
    if (!isOwner || togglingVisibility) return;

    setTogglingVisibility(true);
    try {
      const newVisibility = currentVisibility === "public" ? "private" : "public";
      const projectRef = doc(db, "projects", projectId);
      
      await updateDoc(projectRef, {
        visibility: newVisibility,
        public: newVisibility === 'public', // Sync public boolean with visibility
        updatedAt: new Date().toISOString()
      });

      console.log(`✅ Project visibility changed to ${newVisibility}`);
      
      // Update local state
      const updatedProject: Project = { 
        ...project, 
        visibility: newVisibility as 'public' | 'private',
        public: newVisibility === 'public'
      };
      if (onProjectUpdate) {
        onProjectUpdate(updatedProject);
      }
    } catch (error) {
      console.error('❌ Error updating project visibility:', error);
      alert('Failed to update project visibility. Please try again.');
    } finally {
      setTogglingVisibility(false);
    }
  };


  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "projects", project.id));
      console.log('✅ Project deleted successfully');
      
      if (onProjectDelete) {
        onProjectDelete(project.id);
      }
    } catch (error) {
      console.error('❌ Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Card className="bg-gray-900 border-gray-700 hover:border-yellow-500 transition-colors">
        <CardContent className="p-0">
          {/* Project Poster */}
          <div className="aspect-video bg-gray-800 relative overflow-hidden rounded-t-lg">
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
            
            {/* Play Button Overlay */}
            {project.videoURL && (
              <div 
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setShowTrailerModal(true)}
              >
                <Play className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* Project Info */}
          <div className="p-4">
            <h3 className="font-semibold text-white mb-2 line-clamp-1">{project.title}</h3>
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {project.description || "No description available"}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {project.genre && (
                  <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded">
                    {project.genre}
                  </span>
                )}
                {project.visibility === 'private' && (
                  <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded flex items-center gap-1">
                    🔒 Private
                  </span>
                )}
              </div>
              <span className="text-gray-500 text-xs">
                {project.createdAt && new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Tags */}
            {project.tags && (
              <div className="mt-2 flex flex-wrap gap-2">
                {project.tags.map((tag: string, index: number) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-yellow-700 text-white rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Like and Save Buttons - Show for all users except on their own projects */}
            {user && !isOwner && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-700">
                <button
                  onClick={() => toggleLike(project.id)}
                  disabled={loadingLike}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                    isLiked ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-800"
                  } hover:scale-105`}
                >
                  {isLiked ? <FaThumbsUp size={16} /> : <FaRegThumbsUp size={16} />}
                  <span>{likesCount}</span>
                </button>

                <button
                  onClick={handleSave}
                  disabled={loadingSave}
                  className={`p-2 rounded-full ${
                    isSaved ? "bg-yellow-500 text-white" : "bg-gray-200 text-gray-700"
                  } hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isSaved ? "Remove from Saved" : "Save for Later"}
                >
                  {isSaved ? <BookmarkCheck /> : <Bookmark />}
                </button>

                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors duration-200 bg-gray-700 hover:bg-gray-600 text-gray-300"
                >
                  💬 Comments
                </button>
              </div>
            )}

            {/* Comments Section */}
            {showComments && (
              <div className="mt-4">
                <h3 className="font-semibold text-lg text-white">Comments</h3>

                {user && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Leave a comment..."
                      className="flex-1 px-3 py-2 rounded border bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(project.id)}
                    />
                    <button
                      onClick={() => handleAddComment(project.id)}
                      disabled={!commentText.trim()}
                      className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>
                )}

                {loadingComments ? (
                  <div className="text-gray-400 text-center py-4">Loading comments...</div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {comments.map((comment: any) => (
                      <li key={comment.id} className="bg-gray-50 p-3 rounded flex gap-3 items-start">
                        <img
                          src={comment.userPhoto || "/default-avatar.png"}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/default-avatar.png";
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{comment.userName}</p>
                          <p className="text-base text-gray-700">{comment.text}</p>
                        </div>
                        {comment.userId === user?.uid && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {!user && (
                  <div className="text-gray-400 text-center py-4">
                    Please sign in to add comments.
                  </div>
                )}
              </div>
            )}

            {/* Actions for project owner */}
            {showActions && isOwner && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                {/* Visibility Toggle */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-300">Visibility:</span>
                  <button
                    onClick={() => toggleVisibility(project.id, project.visibility || 'private')}
                    disabled={togglingVisibility}
                    className={`px-2 py-1 rounded text-xs transition-colors disabled:opacity-50 ${
                      project.visibility === "public" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {togglingVisibility ? 'Updating...' : (project.visibility === "public" ? "Public" : "Private")}
                  </button>
                </div>

                {/* Edit/Delete Actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded transition duration-300 flex-1"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded transition duration-300 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🗑 {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Project Modal */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleEditSave}
        />
      )}

      {/* Trailer Modal */}
      {showTrailerModal && project.videoURL && (
        <TrailerModal
          isOpen={showTrailerModal}
          onClose={() => setShowTrailerModal(false)}
          trailerUrl={project.videoURL}
          title={project.title}
        />
      )}
    </>
  );
}