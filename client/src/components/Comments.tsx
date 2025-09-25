import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/authContext';
import { addComment, getProjectComments, deleteComment, getUserPreferences } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Trash2, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: any;
  userName?: string;
  userPhoto?: string;
}

interface CommentsProps {
  projectId: string;
}

// Debounce utility function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export default function Comments({ projectId }: CommentsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingComment, setDeletingComment] = useState<string | null>(null);
  const lastSubmissionRef = useRef<number>(0);

  useEffect(() => {
    loadComments();
  }, [projectId]);

  const loadComments = async () => {
    try {
      const commentsData = await getProjectComments(projectId);
      
      // Load user data for each comment
      const commentsWithUserData = await Promise.all(
        commentsData.map(async (comment: any) => {
          try {
            const userData = await getUserPreferences(comment.userId);
            return {
              ...comment,
              userName: userData?.name || 'Anonymous User',
              userPhoto: userData?.profilePhotoUrl || ''
            };
          } catch (error) {
            return {
              ...comment,
              userName: 'Anonymous User',
              userPhoto: ''
            };
          }
        })
      );

      setComments(commentsWithUserData);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced comment submission to prevent Firebase quota overload
  const submitCommentToFirebase = useCallback(async (commentText: string) => {
    try {
      // Create timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Comment timeout')), 10000)
      );

      const commentPromise = async () => {
        const comment = await addComment(projectId, user.uid, commentText);
        
        // Add user data to the new comment
        const userData = await getUserPreferences(user.uid);
        const commentWithUserData = {
          ...comment,
          userName: userData?.name || 'You',
          userPhoto: userData?.profilePhotoUrl || ''
        };

        setComments(prev => [commentWithUserData, ...prev]);
        setNewComment('');
      };

      await Promise.race([commentPromise(), timeoutPromise]);
      console.log('✅ Comment posted successfully');
      
      // Show success toast
      toast({
        title: "Comment Posted!",
        description: "Your comment has been added successfully.",
      });
    } catch (error: any) {
      console.error('Error adding comment:', error);
      
      // Show error toast based on error type
      if (error.message === 'Comment timeout') {
        toast({
          title: "Comment Taking Long",
          description: "Your comment is still being posted. Please check your connection.",
          variant: "destructive"
        });
      } else if (error.code === 'unavailable') {
        toast({
          title: "Connection Issue",
          description: "Your comment will be posted when connection is restored.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Comment Failed",
          description: "Failed to add comment. Please check your connection and try again.",
          variant: "destructive"
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [projectId, user, toast]);

  // Debounced version with 1.5 second delay to prevent spam
  const debouncedSubmitComment = useCallback(
    debounce(submitCommentToFirebase, 1500),
    [submitCommentToFirebase]
  );

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || submitting) return;

    // Prevent rapid submissions
    const now = Date.now();
    if (now - lastSubmissionRef.current < 1500) {
      toast({
        title: "Please Wait",
        description: "Please wait before submitting another comment.",
        variant: "destructive"
      });
      return;
    }

    lastSubmissionRef.current = now;
    setSubmitting(true);
    
    // Use debounced submission
    debouncedSubmitComment(newComment.trim());
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || deletingComment) return;

    setDeletingComment(commentId);
    try {
      await deleteComment(projectId, commentId);
      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setDeletingComment(null);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-yellow-400" />
        <h3 className="text-lg font-semibold text-white">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Add Comment Form */}
      {user && (
        <div className="mb-6">
          <Textarea
            placeholder="Share your thoughts about this project..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-3">
            <Button
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || submitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium flex items-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="text-gray-400 text-center py-8">
          Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-gray-400 text-center py-8">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={comment.userPhoto} />
                  <AvatarFallback className="bg-gray-700 text-white">
                    {comment.userName?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-white font-medium">{comment.userName}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    
                    {/* Delete button for comment owner */}
                    {user && comment.userId === user.uid && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingComment === comment.id}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-gray-300 whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sign in prompt */}
      {!user && (
        <div className="text-center py-8 text-gray-400">
          <p>Sign in to join the conversation and share your thoughts.</p>
        </div>
      )}
    </div>
  );
}