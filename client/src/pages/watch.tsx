import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/authContext';
import { getVideoById, getRelatedVideos, incrementVideoViews, normalizeVideoURL } from '@/lib/firebase';
import { featuredSlides, movieDetails } from '@/data/featuredSlides';
import { Play, Pause, Volume2, VolumeX, Maximize, ArrowLeft, Calendar, Eye, Share2, Heart, Plus, User, Star, Clock, Film } from 'lucide-react';

interface VideoData {
  id: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  posterURL: string;
  videoURL: string;
  uploadedBy: string;
  uploaderData?: any;
  cast: string[] | { name: string; role: string }[];
  crew: string[] | { name: string; role: string }[];
  createdAt: string;
  views?: number;
  likes?: number;
  imdbRating?: number;
  duration?: string;
  maturityRating?: string;
  quality?: string;
}

export default function Watch() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [video, setVideo] = useState<VideoData | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadVideo(params.id);
    }
  }, [params.id]);

  const loadVideo = async (videoId: string) => {
    try {
      setLoading(true);
      
      let videoData: VideoData | null = null;
      
      // Check if it's a featured movie
      if (videoId.startsWith('featured-')) {
        const featuredId = parseInt(videoId.replace('featured-', ''));
        const movieDetail = movieDetails[featuredId];
        
        if (movieDetail) {
          // Convert featured movie to VideoData format with enhanced details
          videoData = {
            id: videoId,
            title: movieDetail.title,
            description: movieDetail.description,
            genre: movieDetail.subtitle.includes('Horror') ? 'Horror' : 
                   movieDetail.subtitle.includes('Comedy') ? 'Comedy' :
                   movieDetail.subtitle.includes('Drama') ? 'Drama' :
                   movieDetail.subtitle.includes('Romance') ? 'Romance' :
                   movieDetail.subtitle.includes('Thriller') ? 'Thriller' :
                   movieDetail.subtitle.includes('Sci-Fi') ? 'Sci-Fi' : 'Drama',
            tags: movieDetail.tags,
            posterURL: movieDetail.posterImage || movieDetail.bgImage,
            videoURL: movieDetail.trailer,
            uploadedBy: 'SoarTV',
            uploaderData: { name: 'SoarTV', role: 'Featured Content' },
            cast: movieDetail.cast,
            crew: movieDetail.crew,
            createdAt: movieDetail.year.toString(),
            views: Math.floor(Math.random() * 50000) + 10000,
            likes: Math.floor(Math.random() * 2000) + 500,
            // Additional Netflix-style data
            imdbRating: movieDetail.imdbRating,
            duration: movieDetail.duration,
            maturityRating: movieDetail.maturityRating,
            quality: movieDetail.quality
          };
          console.log('🎬 Loading featured movie:', videoData.title);
          
          // Set video immediately for instant loading
          setVideo(videoData as VideoData);
          setLoading(false);
          
          // Load related videos in background after main movie loads
          setTimeout(async () => {
            try {
              const related = await getRelatedVideos(videoId, videoData!.genre, videoData!.tags);
              setRelatedVideos(related);
            } catch (error) {
              console.error('Error loading related videos:', error);
              // Create related videos from other featured movies as fallback
              const otherFeatured = Object.entries(movieDetails)
                .filter(([id]) => `featured-${id}` !== videoId)
                .slice(0, 6)
                .map(([id, movie]) => ({
                  id: `featured-${id}`,
                  title: movie.title,
                  description: movie.description,
                  genre: movie.subtitle.includes('Horror') ? 'Horror' : 
                         movie.subtitle.includes('Comedy') ? 'Comedy' :
                         movie.subtitle.includes('Drama') ? 'Drama' : 'Drama',
                  tags: movie.tags,
                  posterURL: movie.posterImage || movie.bgImage,
                  videoURL: movie.trailer,
                  uploadedBy: 'SoarTV',
                  cast: movie.cast,
                  crew: movie.crew,
                  createdAt: movie.year.toString()
                }));
              setRelatedVideos(otherFeatured);
            }
          }, 100);
          
          return; // Exit early for featured movies
        }
      } else {
        // Load from Firebase
        videoData = await getVideoById(videoId);
        
        if (!videoData) {
          console.error('❌ Video not found:', videoId);
          setLocation('/browse');
          return;
        }
        
        setVideo(videoData as VideoData);
        
        // Increment views for Firebase videos
        await incrementVideoViews(videoId);
        
        // Load related videos for Firebase videos
        const related = await getRelatedVideos(videoId, (videoData as any).genre || '', (videoData as any).tags || []);
        setRelatedVideos(related);
      }
      
    } catch (error) {
      console.error('Error loading video:', error);
      setLocation('/browse');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = async () => {
    if (videoRef) {
      try {
        if (isPlaying) {
          videoRef.pause();
        } else {
          await videoRef.play();
        }
      } catch (error) {
        console.error('Error playing video:', error);
        // Try to reload video if play fails
        videoRef.load();
      }
    } else {
      console.error('Video element not ready');
    }
  };

  const toggleMute = () => {
    if (videoRef) {
      videoRef.muted = !videoRef.muted;
      setIsMuted(videoRef.muted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef && videoRef.requestFullscreen) {
      videoRef.requestFullscreen();
    }
  };

  const formatViews = (views: number): string => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    } else {
      return views.toString();
    }
  };

  const handleRelatedVideoClick = (relatedVideo: VideoData) => {
    setLocation(`/watch/${relatedVideo.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        {/* Loading Skeleton */}
        <div className="relative h-screen">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse"></div>
          
          <div className="relative z-20 h-full flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Poster Skeleton */}
                <div className="flex justify-center lg:justify-start">
                  <div className="w-80 h-96 bg-gray-700 rounded-lg animate-pulse"></div>
                </div>

                {/* Content Skeleton */}
                <div className="text-white space-y-6">
                  <div className="space-y-4">
                    <div className="h-12 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-6 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                    <div className="flex space-x-4">
                      <div className="h-8 w-20 bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-700 rounded w-4/5 animate-pulse"></div>
                  </div>
                  <div className="flex space-x-4">
                    <div className="h-12 w-32 bg-yellow-600 rounded animate-pulse"></div>
                    <div className="h-12 w-24 bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-white text-xl mb-4">Movie not found</p>
          <Button onClick={() => setLocation('/browse')} className="bg-yellow-400 hover:bg-yellow-500 text-black">
            Browse Movies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Movie Details */}
      <div className="relative h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${video.posterURL})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20"></div>
        </div>

        {/* Back Button */}
        <div className="absolute top-6 left-6 z-30">
          <Button
            onClick={() => setLocation('/browse')}
            size="sm"
            className="bg-black/60 backdrop-blur-sm text-white border border-gray-600 hover:bg-black/80"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Movie Information */}
        <div className="relative z-20 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Movie Poster */}
              <div className="flex justify-center lg:justify-start">
                <div className="relative">
                  <img
                    src={video.posterURL}
                    alt={video.title}
                    className="w-80 h-auto rounded-lg shadow-2xl"
                  />
                  {video.quality && (
                    <div className="absolute top-3 right-3 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
                      {video.quality}
                    </div>
                  )}
                </div>
              </div>

              {/* Movie Details */}
              <div className="text-white space-y-6">
                <div>
                  <h1 className="text-5xl font-bold mb-4 leading-tight">{video.title}</h1>
                  
                  {/* Rating and Duration */}
                  <div className="flex items-center space-x-6 mb-4">
                    {video.imdbRating && (
                      <div className="flex items-center space-x-2">
                        <Star className="w-5 h-5 text-yellow-400 fill-current" />
                        <span className="text-xl font-semibold">{video.imdbRating}</span>
                        <span className="text-gray-400">IMDB</span>
                      </div>
                    )}
                    {video.duration && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <span className="text-lg">{video.duration}</span>
                      </div>
                    )}
                    {video.maturityRating && (
                      <Badge className="bg-gray-700 text-white border-gray-600 text-sm px-3 py-1">
                        {video.maturityRating}
                      </Badge>
                    )}
                  </div>

                  {/* Genre and Tags */}
                  <div className="flex items-center space-x-3 mb-6">
                    <Badge className="bg-yellow-400 text-black font-semibold px-3 py-1">
                      {video.genre}
                    </Badge>
                    {video.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="border-gray-500 text-gray-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <p className="text-lg text-gray-300 leading-relaxed max-w-2xl">
                  {video.description}
                </p>

                {/* Action Buttons */}
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={togglePlay}
                    size="lg"
                    className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 text-lg"
                  >
                    <Play className="w-6 h-6 mr-2" />
                    Watch Now
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-gray-600 text-white hover:bg-white/10 px-6 py-3"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    My List
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-gray-400 hover:text-white px-4"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    className="text-gray-400 hover:text-red-400 px-4"
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>

                {/* Stats */}
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  {video.views && (
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{formatViews(video.views)} views</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{video.createdAt}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Watch {video.title}</h2>
          
          {/* Video Player */}
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video shadow-2xl">
            {video.videoURL.includes('youtube.com') || video.videoURL.includes('youtu.be') ? (
              <iframe
                className="w-full h-full"
                src={video.videoURL.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={video.title}
              />
            ) : (
              <video
                ref={setVideoRef}
                src={normalizeVideoURL(video.videoURL)}
                poster={video.posterURL}
                className="w-full h-full object-cover"
                onPlay={() => {
                  setIsPlaying(true);
                  setShowPauseOverlay(false);
                }}
                onPause={() => {
                  setIsPlaying(false);
                  setShowPauseOverlay(true);
                }}
                onLoadedData={() => console.log('Video loaded')}
                onError={(e) => console.error('Video error:', e)}
                preload="metadata"
                controls
              />
            )}

            {/* Shop the Scene Pause Overlay */}
            {showPauseOverlay && !isPlaying && (
              <div className="absolute inset-0 bg-black/20 flex flex-col justify-end pointer-events-none">
                <div className="bg-black/80 p-6 pointer-events-auto">
                  <h3 className="text-white text-lg font-semibold mb-4 text-center">Shop the Scene</h3>
                  <div className="flex items-center justify-between max-w-md mx-auto">
                    <Button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded">
                      Marketplace
                    </Button>
                    <div className="text-white">
                      <span className="text-base">
                        {video.title === "From Darkness to Light!" && "Starring: Carla Fitzgerald"}
                        {video.title === "Wicked" && "Starring: Cynthia Erivo"}
                        {video.title === "My Name Is Lola" && "Starring: Lola Martinez"}
                        {video.title === "Soul Damage" && "Starring: Marcus Johnson"}
                        {video.title === "!FREAKS!" && "Starring: Alex Rivera"}
                        {video.title === "Alphaville" && "Starring: Jean-Luc Godard"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Custom Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={togglePlay}
                    size="lg"
                    className="bg-yellow-400 text-black hover:bg-yellow-500 font-bold"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button
                    onClick={toggleMute}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                </div>
                <Button
                  onClick={toggleFullscreen}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Movie Details and Cast/Crew Section */}
      <div className="bg-black py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Cast Information */}
            {video.cast && video.cast.length > 0 && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center">
                    <User className="w-6 h-6 mr-3 text-yellow-400" />
                    Cast
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {video.cast.map((actor, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-yellow-400 text-black font-bold">
                            {typeof actor === 'string' ? actor.charAt(0) : actor.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white font-medium">
                            {typeof actor === 'string' ? actor : actor.name}
                          </p>
                          {typeof actor !== 'string' && actor.role && (
                            <p className="text-gray-400 text-sm">{actor.role}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Crew Information */}
            {video.crew && video.crew.length > 0 && (
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-2xl flex items-center">
                    <Film className="w-6 h-6 mr-3 text-yellow-400" />
                    Crew
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {video.crew.map((member, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-gray-700 text-white">
                              {typeof member === 'string' ? member.charAt(0) : member.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white font-medium">
                            {typeof member === 'string' ? member : member.name}
                          </span>
                        </div>
                        {typeof member !== 'string' && member.role && (
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            {member.role}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Related Movies Section */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-8">More Like This</h2>
          
          {relatedVideos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {relatedVideos.map((relatedVideo, index) => (
                <div
                  key={relatedVideo.id || index}
                  onClick={() => handleRelatedVideoClick(relatedVideo)}
                  className="group cursor-pointer transition-transform hover:scale-105"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-gray-800">
                    <img
                      src={relatedVideo.posterURL || '/api/placeholder/300/450'}
                      alt={relatedVideo.title}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="text-white font-semibold text-sm truncate">{relatedVideo.title}</h4>
                        <p className="text-gray-300 text-xs">{relatedVideo.genre || 'Movie'}</p>
                      </div>
                    </div>
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="bg-yellow-400 text-black hover:bg-yellow-500">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No related movies found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}