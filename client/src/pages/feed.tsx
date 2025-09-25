import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/authContext';
import { getAllPosts, createPost, getUserPreferences } from '@/lib/firebase';
import { Heart, MessageCircle, Share2, Play, Film, Calendar, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Post {
  id: string;
  type: 'project' | 'status';
  userId: string;
  content: string;
  projectId?: string;
  projectData?: any;
  userData?: any;
  createdAt: string;
  likes?: number;
  comments?: number;
}

// Debounce utility function
const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

export default function Feed() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const lastPostSubmissionRef = useRef<number>(0);

  useEffect(() => {
    // Don't redirect while authentication is loading
    if (authLoading) return;
    
    if (!user) {
      setLocation('/setup');
      return;
    }
    
    loadFeed();
  }, [user, authLoading, setLocation]);

  const loadFeed = async () => {
    try {
      const feedPosts = await getAllPosts();
      
      // Filter and enrich posts with user data and project data
      const enrichedPosts = await Promise.all(
        feedPosts.map(async (post: any) => {
          try {
            // Get user data for each post
            const userData = await getUserPreferences(post.userId);
            
            // For project posts, only show if project is public
            if (post.type === 'project' && post.projectData) {
              // Skip private projects in the community feed
              if (post.projectData.visibility === 'private') {
                return null;
              }
            }
            
            return {
              ...post,
              userData: userData || { name: 'Unknown User', role: 'Filmmaker' }
            };
          } catch (error) {
            console.error('Error enriching post:', error);
            return {
              ...post,
              userData: { name: 'Unknown User', role: 'Filmmaker' }
            };
          }
        })
      );
      
      // Filter out null posts (private projects)
      const filteredPosts = enrichedPosts.filter(post => post !== null);
      
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced post submission to prevent Firebase quota overload
  const submitPostToFirebase = useCallback(async (postContent: string) => {
    if (!user) {
      console.error('❌ User not authenticated for post submission');
      return;
    }
    
    try {
      // Create timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Post timeout')), 15000)
      );

      const postPromise = async () => {
        const postData = {
          type: 'status' as const,
          userId: user.uid,
          content: postContent,
          createdAt: new Date().toISOString()
        };

        await createPost(postData);
        setNewPost('');
        
        // Add the new post to local state immediately for faster feedback
        const userData = await getUserPreferences(user.uid);
        const newPostWithData = {
          id: 'temp-' + Date.now(),
          ...postData,
          userData: userData || { name: 'You', role: 'Filmmaker' }
        };
        setPosts(prev => [newPostWithData, ...prev]);
        
        // Refresh feed in background
        setTimeout(() => loadFeed(), 1000);
      };

      await Promise.race([postPromise(), timeoutPromise]);
      console.log('✅ Post created successfully');
      
      // Show success toast
      toast({
        title: "Post Published!",
        description: "Your post has been shared with the community.",
      });
    } catch (error: any) {
      console.error('❌ Error creating post:', error);
      
      // Show error toast based on error type
      if (error.message === 'Post timeout') {
        toast({
          title: "Post Taking Long",
          description: "Your post is still being published. Please check your connection.",
          variant: "destructive"
        });
      } else if (error.code === 'unavailable') {
        toast({
          title: "Connection Issue",
          description: "Your post will be published when connection is restored.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Post Failed",
          description: "Failed to create post. Please check your connection and try again.",
          variant: "destructive"
        });
      }
    } finally {
      setPosting(false);
    }
  }, [user, toast, loadFeed]);

  // Debounced version with 1.5 second delay to prevent spam
  const debouncedSubmitPost = useCallback(
    debounce(submitPostToFirebase, 1500),
    [submitPostToFirebase]
  );

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !newPost.trim()) return;

    // Prevent rapid submissions
    const now = Date.now();
    if (now - lastPostSubmissionRef.current < 1500) {
      toast({
        title: "Please Wait",
        description: "Please wait before posting again.",
        variant: "destructive"
      });
      return;
    }

    lastPostSubmissionRef.current = now;
    setPosting(true);
    
    // Use debounced submission
    debouncedSubmitPost(newPost.trim());
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return postDate.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Please sign in to view the feed</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-3xl font-bold text-yellow-400">Soar</span>
            <span className="text-3xl font-bold text-red-500">TV</span>
            <span className="text-xl text-white ml-3">Community Feed</span>
          </div>
          <Button
            onClick={() => setLocation('/')}
            variant="outline"
            className="border-gray-600 text-white hover:bg-gray-800"
          >
            Back to Home
          </Button>
        </div>

        {/* Create Post */}
        <Card className="bg-black/80 border-gray-800 text-white">
          <CardContent className="p-6">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex items-start space-x-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="" alt="Your Avatar" />
                  <AvatarFallback className="bg-gray-700 text-white">
                    {user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 min-h-[100px] resize-none"
                    placeholder="Share an update with the filmmaking community..."
                    disabled={posting}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-400">
                      {newPost.length}/500 characters
                    </span>
                    <Button
                      type="submit"
                      disabled={!newPost.trim() || posting}
                      className="bg-yellow-500 text-black hover:bg-yellow-600 disabled:opacity-50 flex items-center gap-2"
                    >
                      {posting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {posting ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Feed Posts */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-white text-xl">Loading community feed...</div>
          </div>
        ) : posts.length === 0 ? (
          <Card className="bg-black/80 border-gray-800 text-white">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">No posts in the community feed yet</div>
              <p className="text-sm text-gray-500 mb-6">
                Be the first to share your filmmaking journey!
              </p>
              <Button
                onClick={() => setLocation('/upload-project')}
                className="bg-yellow-500 text-black hover:bg-yellow-600"
              >
                Upload Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="bg-black/80 border-gray-800 text-white">
                <CardContent className="p-6">
                  {/* Post Header */}
                  <div className="flex items-start space-x-4 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={post.userData?.profileImageURL} alt={post.userData?.name} />
                      <AvatarFallback className="bg-gray-700 text-white">
                        {post.userData?.name?.charAt(0).toUpperCase() || 'F'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link href={`/user/${post.userId}`}>
                          <h3 className="font-semibold hover:text-yellow-400 cursor-pointer transition-colors">
                            {post.userData?.name || 'Filmmaker'}
                          </h3>
                        </Link>
                        <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                          {post.userData?.role || 'Filmmaker'}
                        </Badge>
                        <Link href={`/user/${post.userId}`}>
                          <Button variant="ghost" size="sm" className="text-xs text-gray-400 hover:text-yellow-400 h-6 px-2">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>{formatTimeAgo(post.createdAt)}</span>
                        {post.type === 'project' && (
                          <>
                            <span>•</span>
                            <Film className="w-4 h-4" />
                            <span>Shared a project</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-white leading-relaxed">{post.content}</p>
                  </div>

                  {/* Project Preview (if post is about a project) */}
                  {post.type === 'project' && post.projectData && (
                    <div className="bg-gray-800 rounded-lg p-4 mb-4">
                      <div className="flex items-start space-x-4">
                        {post.projectData.posterURL ? (
                          <img 
                            src={post.projectData.posterURL} 
                            alt={post.projectData.title}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-700 rounded flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{post.projectData.title}</h4>
                          <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                            {post.projectData.description}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {post.projectData.tags?.slice(0, 3).map((tag: string, index: number) => (
                              <span key={index} className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Watch
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center space-x-6 pt-4 border-t border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      {post.likes || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {post.comments || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}