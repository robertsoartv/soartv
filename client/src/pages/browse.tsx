import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/authContext';
import { getBrowseVideos, normalizeVideoURL } from '@/lib/firebase';
import { Search, Filter, Grid, List, Play, Calendar, Eye, Star, User } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';

interface Video {
  id: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  posterURL: string;
  videoURL: string;
  uploadedBy: string;
  uploaderData?: any;
  createdAt: string;
  views?: number;
  rating?: number;
}

const categories = [
  { id: 'all', label: 'All Videos', filter: {} },
  { id: 'drama', label: 'Drama', filter: { genre: 'Drama' } },
  { id: 'horror', label: 'Horror', filter: { genre: 'Horror' } },
  { id: 'comedy', label: 'Comedy', filter: { genre: 'Comedy' } },
  { id: 'action', label: 'Action', filter: { genre: 'Action' } },
  { id: 'thriller', label: 'Thriller', filter: { genre: 'Thriller' } },
  { id: 'sci-fi', label: 'Sci-Fi', filter: { genre: 'Sci-Fi' } },
  { id: 'documentary', label: 'Documentary', filter: { genre: 'Documentary' } },
  { id: 'newest', label: 'Newest', filter: { sortBy: 'createdAt', order: 'desc' } },
  { id: 'popular', label: 'Most Popular', filter: { sortBy: 'views', order: 'desc' } }
];

const sortOptions = [
  { value: 'newest', label: 'Newest First', sortBy: 'createdAt', order: 'desc' },
  { value: 'oldest', label: 'Oldest First', sortBy: 'createdAt', order: 'asc' },
  { value: 'title-asc', label: 'Title A-Z', sortBy: 'title', order: 'asc' },
  { value: 'title-desc', label: 'Title Z-A', sortBy: 'title', order: 'desc' },
  { value: 'popular', label: 'Most Popular', sortBy: 'views', order: 'desc' }
];

export default function Browse() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  const genres = ["Drama", "Comedy", "Action", "Thriller", "Horror", "Sci-Fi"];

  useEffect(() => {
    // Always load videos regardless of auth state since Browse is public
    loadVideos(true);
  }, [selectedCategory, sortBy, searchQuery, selectedGenre]);

  const loadVideos = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    } else {
      setLoadingMore(true);
    }

    try {
      const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
      const selectedSortData = sortOptions.find(sort => sort.value === sortBy);
      
      const filters = {
        ...selectedCategoryData?.filter,
        sortBy: selectedSortData?.sortBy || 'createdAt',
        order: selectedSortData?.order || 'desc',
        search: searchQuery,
        genre: selectedGenre,
        page: reset ? 1 : page,
        limit: 12
      };

      const result = await getBrowseVideos(filters);
      
      if (reset) {
        setVideos(result.videos);
      } else {
        setVideos(prev => [...prev, ...result.videos]);
      }
      
      setHasMore(result.hasMore);
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    setLocation(`/watch/${video.id}`);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <div className="bg-black/80 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-3xl font-bold text-yellow-400">Soar</span>
                <span className="text-3xl font-bold text-red-500">TV</span>
              </div>
              <span className="text-xl text-white">Browse</span>
            </div>
            <Button
              onClick={() => setLocation('/')}
              variant="outline"
              className="border-gray-600 text-white hover:bg-gray-800"
            >
              Back to Home
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : undefined}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white border border-gray-500 hover:bg-gray-600 hover:border-gray-400'}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : undefined}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white border border-gray-500 hover:bg-gray-600 hover:border-gray-400'}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : undefined}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`${
                  selectedCategory === category.id
                    ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                    : 'bg-gray-700 text-white border border-gray-500 hover:bg-gray-600 hover:border-gray-400'
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Genre Filter Bar */}
        <div className="flex gap-2 flex-wrap my-4">
          {genres.map((genre) => (
            <button
              key={genre}
              className={`px-4 py-2 rounded-full border ${
                selectedGenre === genre
                  ? "bg-yellow-700 text-white"
                  : "bg-white text-gray-800 border-gray-300"
              }`}
              onClick={() => setSelectedGenre(genre === selectedGenre ? null : genre)}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Video Grid/List */}
        {(() => {
          const filteredProjects = selectedGenre
            ? videos.filter((project) =>
                project.tags?.includes(selectedGenre)
              )
            : videos;

          if (loading) {
            return (
              <div className="text-center py-12">
                <div className="text-white text-xl">Loading videos...</div>
              </div>
            );
          }

          if (filteredProjects.length === 0) {
            return (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">No videos found</div>
                <p className="text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            );
          }

          return (
            <>
              <div className="grid md:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    user={user} 
                    showActions={false}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="text-center mt-8">
                  <Button
                    onClick={() => loadVideos(false)}
                    disabled={loadingMore}
                    className="bg-yellow-500 text-black hover:bg-yellow-600"
                  >
                    {loadingMore ? 'Loading...' : 'Load More Videos'}
                  </Button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}