import { useEffect } from "react";
import { X } from "lucide-react";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trailerUrl: string;
  title?: string;
}

export default function TrailerModal({ isOpen, onClose, trailerUrl, title }: TrailerModalProps) {
  // Close modal on escape key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !trailerUrl) return null;

  // Function to convert various video URLs to embeddable format
  const getEmbedUrl = (url: string): string => {
    // YouTube URLs
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }
    
    // Vimeo URLs
    if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    
    // Direct video URLs or already embedded URLs
    return url;
  };

  const embedUrl = getEmbedUrl(trailerUrl);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-6xl mx-4 bg-black rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-yellow-400 transition-colors z-10"
          aria-label="Close trailer"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Title */}
        {title && (
          <div className="absolute -top-12 left-0 text-white text-lg font-semibold">
            {title} - Trailer
          </div>
        )}

        {/* Video Container */}
        <div className="w-full aspect-video rounded-lg overflow-hidden">
          {embedUrl.includes('youtube.com') || embedUrl.includes('vimeo.com') ? (
            <iframe
              src={embedUrl}
              title={title ? `${title} Trailer` : "Video Trailer"}
              className="w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          ) : (
            <video
              src={embedUrl}
              controls
              autoPlay
              className="w-full h-full object-cover"
              title={title ? `${title} Trailer` : "Video Trailer"}
            >
              Your browser does not support the video tag.
            </video>
          )}
        </div>

        {/* Instructions */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-gray-400 text-sm">
          Press ESC or click outside to close
        </div>
      </div>
    </div>
  );
}