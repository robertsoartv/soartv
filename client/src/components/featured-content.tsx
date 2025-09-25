import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import type { Video } from "@shared/schema";

interface FeaturedContentProps {
  onVideoSelect: (video: Video) => void;
}

// Component specifically for Wicked movie with hover-to-play functionality
function WickedMovieCard({ movie, onVideoSelect }: { movie: Video; onVideoSelect: (video: Video) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.style.opacity = '1';
        videoRef.current.play().catch((error) => {
          console.log('Video play failed:', error);
        });
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.style.opacity = '0';
    }
  };

  return (
    <div 
      className="group cursor-pointer transform transition-all duration-300 hover:scale-105 flex-shrink-0"
      onClick={() => onVideoSelect(movie)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="relative overflow-hidden rounded-lg shadow-lg border border-gray-800 hover:border-yellow-400 transition-all duration-300 w-48 md:w-56">
        <img 
          src={movie.thumbnailUrl}
          alt={`${movie.title} Movie Poster`}
          className="w-full h-64 md:h-80 object-cover"
        />
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{ opacity: 0 }}
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src={movie.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
          <Play className="text-yellow-400 text-3xl opacity-0 group-hover:opacity-100 transition-all duration-300 h-12 w-12" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 235, 59, 0.8))' }} />
        </div>
      </div>
      <h3 className="text-white font-medium mt-2 truncate" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{movie.title}</h3>
      <p className="text-gray-400 text-sm" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>{movie.year} • {movie.category}</p>
    </div>
  );
}

export default function FeaturedContent({ onVideoSelect }: FeaturedContentProps) {
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  if (isLoading) {
    return (
      <section className="py-8 bg-prime-dark">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-normal text-white">Kids and family movies</h2>
            <button className="text-prime-blue hover:underline text-sm flex items-center">
              See more 
              <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse flex-shrink-0">
                <div className="bg-gray-800 rounded-lg h-64 md:h-80 mb-2 w-48 md:w-56"></div>
                <div className="bg-gray-800 rounded h-4 mb-1"></div>
                <div className="bg-gray-800 rounded h-3 w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Prioritize Wicked movie and include it in featured content
  const wickedMovie = videos?.find(video => video.title === 'Wicked');
  const otherMovies = videos?.filter(video => video.type === 'movie' && video.title !== 'Wicked').slice(0, 5) || [];
  
  const featuredMovies = wickedMovie ? [wickedMovie, ...otherMovies] : otherMovies;

  return (
    <section className="py-8 bg-prime-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-normal text-white">Kids and family movies</h2>
          <button className="text-prime-blue hover:underline text-sm flex items-center">
            See more 
            <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {featuredMovies.map((movie) => (
            <div 
              key={movie.id}
              className="group cursor-pointer flex-shrink-0 relative"
              onClick={() => onVideoSelect(movie)}
            >
              <div className="relative overflow-hidden rounded w-48 md:w-52 transition-all duration-300 hover:scale-105">
                <img 
                  src={movie.thumbnailUrl}
                  alt={`${movie.title} Movie Poster`}
                  className="w-full h-64 md:h-72 object-cover"
                />
                {(movie.title === "My Name Is Lola" || movie.title === "Soul Damage" || movie.title === "From Darkness to Light!" || movie.title === "If Love Could Heal" || movie.title === "!FREAKS!") && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-1 rounded text-black text-xs font-medium">
                    Soar
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                  <Play className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 h-12 w-12 fill-current" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
