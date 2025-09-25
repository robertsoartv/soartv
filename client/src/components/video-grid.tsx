import { useQuery } from "@tanstack/react-query";
import { Play, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Video } from "@shared/schema";

interface VideoGridProps {
  onVideoSelect: (video: Video) => void;
  selectedCategory: string;
}

export default function VideoGrid({ onVideoSelect, selectedCategory }: VideoGridProps) {
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: selectedCategory === "All" ? ["/api/videos"] : ["/api/videos/category", selectedCategory],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-light">Trending Now</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-neutral-medium rounded-lg h-32 sm:h-40 mb-2"></div>
                <div className="bg-neutral-medium rounded h-4 mb-1"></div>
                <div className="bg-neutral-medium rounded h-3 w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Filter for public videos only (for user-generated content with visibility property)
  const displayVideos = (videos || []).filter(video => 
    !video.hasOwnProperty('visibility') || video.visibility === 'public'
  );

  return (
    <section className="py-8 bg-prime-dark">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-normal text-white">
            {selectedCategory === "All" ? "Trending Now" : `${selectedCategory} Videos`}
          </h2>
          <button className="text-prime-blue hover:underline text-sm flex items-center">
            See more 
            <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        <div className="flex gap-6 overflow-x-scroll pb-4 scrollbar-hide" style={{ scrollSnapType: 'x mandatory' }}>
          {displayVideos.map((video) => (
            <div 
              key={video.id}
              className="group cursor-pointer flex-shrink-0"
              onClick={() => onVideoSelect(video)}
              style={{ scrollSnapAlign: 'start' }}
            >
              <div className="relative overflow-hidden rounded w-48 md:w-52 transition-all duration-300 hover:scale-105">
                <img 
                  src={video.thumbnailUrl}
                  alt={`${video.title} Thumbnail`}
                  className="w-full h-64 md:h-72 object-cover"
                />
                {(video.title === "My Name Is Lola" || video.title === "Soul Damage" || video.title === "From Darkness to Light!" || video.title === "If Love Could Heal" || video.title === "!FREAKS!" || video.title === "Alphaville") && (
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
