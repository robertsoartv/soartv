import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Video } from "@shared/schema";

interface HeroBannerProps {
  onVideoSelect: (video: Video) => void;
}

export default function HeroBanner({ onVideoSelect }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  if (isLoading || !videos) {
    return (
      <section className="relative h-[70vh] flex items-end justify-start bg-gradient-to-r from-gray-900 to-gray-800 animate-pulse">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="max-w-2xl">
            <div className="h-12 bg-gray-700 rounded mb-4"></div>
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-gray-700 rounded w-1/2 mb-8"></div>
            <div className="h-12 bg-yellow-500 rounded w-48"></div>
          </div>
        </div>
      </section>
    );
  }

  const featuredMovies = videos.filter(video => video.type === 'movie').slice(0, 5);
  const currentMovie = featuredMovies[currentSlide] || featuredMovies[0];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredMovies.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  };

  return (
    <section className="relative h-screen flex items-center justify-start overflow-hidden bg-prime-dark">
      {/* Hero background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 opacity-40"
        style={{
          backgroundImage: `url('${currentMovie.thumbnailUrl}')`
        }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      
      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-2xl">
          {/* Prime badge */}
          <div className="inline-flex items-center bg-prime-blue px-3 py-1 rounded text-white text-sm font-medium mb-4">
            prime
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            we were liars
          </h1>
          
          <div className="flex items-center space-x-4 mb-4">
            <span className="bg-orange-500 text-white px-2 py-1 text-xs font-bold rounded">#2 in the US</span>
          </div>
          
          <p className="text-lg text-gray-300 mb-6 leading-relaxed max-w-lg">
            Season 1 • On an exclusive island estate, 17-year-old Cadence confronts her wealthy family's silence about t...
          </p>
          
          <div className="flex items-center space-x-4 mb-6">
            <button 
              onClick={() => onVideoSelect(currentMovie)}
              className="bg-white text-black px-6 py-3 rounded font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>Episode 1</span>
              <span className="text-sm">Watch now</span>
            </button>
            
            <button className="bg-prime-light-gray text-white px-4 py-3 rounded hover:bg-gray-600 transition-all duration-200">
              <span className="text-2xl">+</span>
            </button>
            
            <button className="bg-prime-light-gray text-white p-3 rounded hover:bg-gray-600 transition-all duration-200">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center text-sm text-gray-400">
            <span className="flex items-center">
              <span className="text-prime-blue mr-1">○</span>
              Watch for free
            </span>
          </div>
        </div>
      </div>
      
      {/* Carousel indicators */}
      <div className="absolute bottom-8 right-8 flex space-x-1 z-20">
        <div className="w-8 h-1 bg-white rounded-full"></div>
        <div className="w-8 h-1 bg-white bg-opacity-30 rounded-full"></div>
        <div className="w-8 h-1 bg-white bg-opacity-30 rounded-full"></div>
        <div className="w-8 h-1 bg-white bg-opacity-30 rounded-full"></div>
      </div>
      
      {/* Age rating badge */}
      <div className="absolute bottom-8 right-24 bg-white text-black px-2 py-1 text-xs font-bold rounded z-20">
        TV-14
      </div>
    </section>
  );
}
