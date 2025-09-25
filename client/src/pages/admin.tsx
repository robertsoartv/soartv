import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/authContext';
import { 
  getPendingVideos, 
  approveVideo, 
  rejectVideo, 
  getFeaturedCreators, 
  setFeaturedCreator, 
  removeFeaturedCreator,
  getAdminStats 
} from '@/lib/firebase';
import { 
  Shield, 
  Check, 
  X, 
  Star, 
  StarOff, 
  Play, 
  Calendar, 
  Eye, 
  Users, 
  Film, 
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';

interface PendingVideo {
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
  status: 'pending' | 'approved' | 'rejected';
}

interface FeaturedCreator {
  uid: string;
  name: string;
  role: string;
  bio: string;
  profileImageURL: string;
  projectCount: number;
  totalViews: number;
  featuredSince: string;
}

interface AdminStats {
  totalVideos: number;
  pendingVideos: number;
  totalUsers: number;
  totalViews: number;
  newUsersThisWeek: number;
  newVideosThisWeek: number;
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [featuredCreators, setFeaturedCreators] = useState<FeaturedCreator[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    // Check if user is admin (simplified check)
    if (!user || !user.email?.includes('admin')) {
      setLocation('/');
      return;
    }
    
    loadAdminData();
  }, [user]);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [pending, featured, adminStats] = await Promise.all([
        getPendingVideos(),
        getFeaturedCreators(),
        getAdminStats()
      ]);
      
      setPendingVideos(pending);
      setFeaturedCreators(featured);
      setStats(adminStats);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveVideo = async (videoId: string) => {
    setProcessingId(videoId);
    try {
      await approveVideo(videoId);
      await loadAdminData(); // Refresh data
      console.log('✅ Video approved successfully');
    } catch (error) {
      console.error('❌ Error approving video:', error);
      alert('Failed to approve video');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectVideo = async (videoId: string) => {
    setProcessingId(videoId);
    try {
      await rejectVideo(videoId);
      await loadAdminData(); // Refresh data
      console.log('✅ Video rejected successfully');
    } catch (error) {
      console.error('❌ Error rejecting video:', error);
      alert('Failed to reject video');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFeaturedCreator = async (creatorId: string, isFeatured: boolean) => {
    try {
      if (isFeatured) {
        await removeFeaturedCreator(creatorId);
      } else {
        await setFeaturedCreator(creatorId);
      }
      await loadAdminData(); // Refresh data
      console.log(`✅ Creator ${isFeatured ? 'unfeatured' : 'featured'} successfully`);
    } catch (error) {
      console.error('❌ Error toggling featured creator:', error);
      alert('Failed to update featured creator status');
    }
  };

  const filteredVideos = pendingVideos.filter(video => {
    const matchesSearch = !searchQuery || 
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.uploaderData?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!user || !user.email?.includes('admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Access Denied - Admin Only</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-yellow-400" />
            <div>
              <span className="text-3xl font-bold text-yellow-400">Soar</span>
              <span className="text-3xl font-bold text-red-500">TV</span>
              <span className="text-xl text-white ml-3">Admin Panel</span>
            </div>
          </div>
          <Button
            onClick={() => setLocation('/')}
            className="bg-gray-700 text-white border border-gray-500 hover:bg-gray-600 hover:border-gray-400"
          >
            Back to Platform
          </Button>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-black/80 border-gray-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Videos</p>
                    <p className="text-2xl font-bold">{stats.totalVideos}</p>
                  </div>
                  <Film className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-gray-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Pending Review</p>
                    <p className="text-2xl font-bold text-yellow-400">{stats.pendingVideos}</p>
                  </div>
                  <Filter className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-gray-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-black/80 border-gray-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Views</p>
                    <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Admin Tabs */}
        <Card className="bg-black/80 border-gray-800 text-white">
          <CardContent className="p-6">
            <Tabs defaultValue="videos" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="videos" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                  <Filter className="w-4 h-4 mr-2" />
                  Video Moderation
                </TabsTrigger>
                <TabsTrigger value="creators" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
                  <Star className="w-4 h-4 mr-2" />
                  Featured Creators
                </TabsTrigger>
              </TabsList>

              {/* Video Moderation Tab */}
              <TabsContent value="videos" className="space-y-6">
                {/* Search and Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search videos or creators..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="flex space-x-2">
                    {['all', 'pending', 'approved', 'rejected'].map((status) => (
                      <Button
                        key={status}
                        variant={statusFilter === status ? 'default' : undefined}
                        size="sm"
                        onClick={() => setStatusFilter(status as any)}
                        className={statusFilter === status ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white border border-gray-500 hover:bg-gray-600 hover:border-gray-400'}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Video List */}
                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400">Loading videos...</div>
                  </div>
                ) : filteredVideos.length === 0 ? (
                  <div className="text-center py-8">
                    <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <div className="text-gray-400 mb-4">No videos found</div>
                    <p className="text-sm text-gray-500">
                      {statusFilter === 'pending' ? 'All videos have been reviewed' : 'Try adjusting your filters'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredVideos.map((video) => (
                      <Card key={video.id} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            {/* Video Thumbnail */}
                            <div className="w-32 h-20 bg-gray-900 rounded overflow-hidden flex-shrink-0 relative">
                              {video.posterURL ? (
                                <img 
                                  src={video.posterURL} 
                                  alt={video.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Play className="w-6 h-6 text-gray-600" />
                                </div>
                              )}
                              
                              {/* Status Badge */}
                              <div className="absolute top-1 right-1">
                                <Badge 
                                  variant={video.status === 'approved' ? 'default' : 
                                          video.status === 'rejected' ? 'destructive' : 'secondary'}
                                  className={
                                    video.status === 'approved' ? 'bg-green-500 text-white' :
                                    video.status === 'rejected' ? 'bg-red-500 text-white' :
                                    'bg-yellow-500 text-black'
                                  }
                                >
                                  {video.status}
                                </Badge>
                              </div>
                            </div>

                            {/* Video Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-semibold text-lg line-clamp-1">{video.title}</h3>
                                <Badge variant="outline" className="border-gray-600 text-gray-300 ml-2">
                                  {video.genre}
                                </Badge>
                              </div>
                              
                              <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                                {video.description || "No description provided"}
                              </p>

                              {/* Creator Info */}
                              <div className="flex items-center space-x-3 mb-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={video.uploaderData?.profileImageURL} />
                                  <AvatarFallback className="bg-gray-700 text-white text-xs">
                                    {video.uploaderData?.name?.charAt(0) || 'F'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="text-sm font-medium">{video.uploaderData?.name || 'Unknown User'}</div>
                                  <div className="text-xs text-gray-400">{video.uploaderData?.role || 'Filmmaker'}</div>
                                </div>
                              </div>

                              {/* Metadata */}
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                                </div>
                                {video.tags && video.tags.length > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <span>Tags: {video.tags.slice(0, 3).join(', ')}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              {video.status === 'pending' && (
                                <div className="flex items-center space-x-3">
                                  <Button
                                    onClick={() => handleApproveVideo(video.id)}
                                    disabled={processingId === video.id}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    {processingId === video.id ? 'Processing...' : 'Approve'}
                                  </Button>
                                  <Button
                                    onClick={() => handleRejectVideo(video.id)}
                                    disabled={processingId === video.id}
                                    size="sm"
                                    variant="destructive"
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    {processingId === video.id ? 'Processing...' : 'Reject'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-600 text-white hover:bg-gray-700"
                                    onClick={() => window.open(video.videoURL, '_blank')}
                                  >
                                    <Play className="w-4 h-4 mr-1" />
                                    Preview
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Featured Creators Tab */}
              <TabsContent value="creators" className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Featured Creators</h3>
                  <div className="text-sm text-gray-400">
                    {featuredCreators.length} creator{featuredCreators.length !== 1 ? 's' : ''} featured
                  </div>
                </div>

                {featuredCreators.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <div className="text-gray-400 mb-4">No featured creators yet</div>
                    <p className="text-sm text-gray-500">
                      Feature talented creators to spotlight their work
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featuredCreators.map((creator) => (
                      <Card key={creator.uid} className="bg-gray-800 border-gray-700">
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4 mb-4">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={creator.profileImageURL} alt={creator.name} />
                              <AvatarFallback className="bg-gray-700 text-white">
                                {creator.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="font-semibold mb-1">{creator.name}</h3>
                              <Badge variant="outline" className="border-gray-600 text-gray-300 mb-2">
                                {creator.role}
                              </Badge>
                              <div className="flex items-center text-xs text-yellow-400">
                                <Star className="w-3 h-3 mr-1 fill-current" />
                                Featured since {new Date(creator.featuredSince).toLocaleDateString()}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                            {creator.bio || "No bio provided"}
                          </p>

                          <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                            <div>
                              <div className="text-lg font-bold">{creator.projectCount}</div>
                              <div className="text-xs text-gray-400">Projects</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold">{creator.totalViews.toLocaleString()}</div>
                              <div className="text-xs text-gray-400">Total Views</div>
                            </div>
                          </div>

                          <Button
                            onClick={() => handleToggleFeaturedCreator(creator.uid, true)}
                            variant="outline"
                            size="sm"
                            className="w-full border-gray-600 text-white hover:bg-gray-700"
                          >
                            <StarOff className="w-4 h-4 mr-1" />
                            Remove Feature
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}