import { useState, useRef, useEffect } from "react";
import { X, ThumbsUp, Share, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Video } from "@shared/schema";
import "./pause-overlay.css";

interface VideoPlayerModalProps {
  video: Video;
  onClose: () => void;
}

export default function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showShopOverlay, setShowShopOverlay] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shopOverlayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    // Set a timeout to stop loading after 10 seconds
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('Video loading timeout reached');
      setIsLoading(false);
    }, 10000);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (shopOverlayTimeoutRef.current) {
        clearTimeout(shopOverlayTimeoutRef.current);
      }
    };
  }, [onClose]);

  const handleVideoLoad = () => {
    setIsLoading(false);
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
  };

  const handlePlay = () => {
    setIsPaused(false);
    setShowShopOverlay(false);
    if (shopOverlayTimeoutRef.current) {
      clearTimeout(shopOverlayTimeoutRef.current);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    // Only show shopping overlay for "From Darkness to Light!" after 3 seconds of being paused
    if (video.title === "From Darkness to Light!") {
      shopOverlayTimeoutRef.current = setTimeout(() => {
        setShowShopOverlay(true);
      }, 3000);
    }
  };

  const handleVideoClick = () => {
    if (showShopOverlay) {
      setShowShopOverlay(false);
      if (videoRef.current) {
        videoRef.current.play();
      }
    }
  };

  // Helper function to convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      const timeMatch = url.match(/[?&]t=(\d+)/);
      const startTime = timeMatch ? `&start=${timeMatch[1]}` : '';
      return `https://www.youtube.com/embed/${videoId}?autoplay=1${startTime}`;
    }
    return null;
  };

  const isYouTube = video.videoUrl.includes('youtube.com') || video.videoUrl.includes('youtu.be');
  const embedUrl = isYouTube ? getYouTubeEmbedUrl(video.videoUrl) : null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-6xl mx-auto">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-accent text-2xl z-10"
        >
          <X className="h-6 w-6" />
        </Button>
        
        {/* Video Player Container */}
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl">
          <div className="relative">
            {isYouTube && embedUrl ? (
              /* YouTube Iframe Player */
              <iframe
                className="w-full aspect-video bg-black"
                src={embedUrl}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={handleVideoLoad}
              />
            ) : (
              /* HTML5 Video Player for non-YouTube videos */
              <video 
                ref={videoRef}
                className="w-full aspect-video bg-black" 
                controls 
                poster={video.thumbnailUrl}
                onLoadedData={() => {
                  console.log('Video loaded successfully:', video.videoUrl);
                  handleVideoLoad();
                }}
                onLoadStart={() => {
                  console.log('Video loading started:', video.videoUrl);
                }}
                onProgress={() => {
                  console.log('Video loading progress:', video.videoUrl);
                }}
                onPlay={handlePlay}
                onPause={handlePause}
                onClick={handleVideoClick}
                onError={(e) => {
                  console.error('Video error:', e.currentTarget.error, 'Video URL:', video.videoUrl);
                  console.error('Error code:', e.currentTarget.error?.code);
                  console.error('Error message:', e.currentTarget.error?.message);
                  setIsLoading(false);
                }}
                preload="auto"
              >
                <source src={video.videoUrl} type="video/mp4" />
                <source src={video.videoUrl} type="video/webm" />
                <source src={video.videoUrl} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
            )}
            
            {/* Amazon Prime Style Shop the Scene Overlay - Only for "From Darkness to Light!" */}
            {showShopOverlay && isPaused && video.title === "From Darkness to Light!" && (
              <div id="pauseBar" className="pause-bar" style={{ display: 'block' }}>
                <p className="pause-caption">Shop the Scene</p>
                <div className="pause-links">
                  <a href="https://linktr.ee/FilmFlow7" target="_blank" rel="noopener noreferrer" className="btn-gold">
                    Marketplace
                  </a>
                  <div className="btn-dark" style={{ cursor: 'default' }}>
                    Starring: Carla Fitzgerald
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-white text-center">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                  <p className="text-lg">Loading video...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Video Information */}
          <div className="p-6 bg-secondary">
            <h3 className="text-2xl font-bold text-neutral-light mb-2">{video.title}</h3>
            <div className="flex items-center space-x-4 text-neutral-light opacity-70 mb-4">
              <span>{video.views}</span>
              <span>•</span>
              <span>{video.year}</span>
              <span>•</span>
              <span>{video.duration}</span>
              <span>•</span>
              <span>{video.category}</span>
            </div>
            
            {/* Video Actions */}
            <div className="flex items-center space-x-4 mb-4">
              <Button className="bg-accent hover:bg-red-600 text-white">
                <ThumbsUp className="mr-2 h-4 w-4" />
                Like
              </Button>
              <Button variant="secondary" className="bg-neutral-medium hover:bg-neutral-dark text-neutral-light">
                <Share className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="secondary" className="bg-neutral-medium hover:bg-neutral-dark text-neutral-light">
                <Plus className="mr-2 h-4 w-4" />
                My List
              </Button>
            </div>
            
            {/* Video Description */}
            <div className="text-neutral-light">
              <p className="text-sm opacity-90 leading-relaxed">
                {video.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
