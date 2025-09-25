import { useQuery } from "@tanstack/react-query";
import { Play, Star, StarHalf } from "lucide-react";
import type { Video } from "@shared/schema";

interface TVShowsSectionProps {
  onVideoSelect: (video: Video) => void;
}

export default function TVShowsSection({ onVideoSelect }: TVShowsSectionProps) {
  const { data: videos, isLoading } = useQuery<Video[]>({
    queryKey: ["/api/videos"],
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-neutral-light mb-8">Popular TV Shows</h2>
          <div className="flex space-x-6 overflow-x-auto pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 animate-pulse">
                <div className="bg-neutral-medium rounded-lg h-36 mb-3"></div>
                <div className="bg-neutral-medium rounded h-4 mb-1"></div>
                <div className="bg-neutral-medium rounded h-3 w-2/3 mb-2"></div>
                <div className="bg-neutral-medium rounded h-3 w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const tvShows = videos?.filter(video => video.type === 'tv') || [];

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating / 2);
    const hasHalfStar = rating % 2 >= 1;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="h-4 w-4 fill-current" />);
    }

    const remainingStars = 5 - stars.length;
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4" />);
    }

    return stars;
  };

  return (
    <section className="py-12 bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-neutral-light mb-8">Popular TV Shows</h2>
        
        <div className="flex space-x-6 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {tvShows.map((show) => (
            <div 
              key={show.id}
              className="flex-shrink-0 w-64 group cursor-pointer"
              onClick={() => onVideoSelect(show)}
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105">
                <img 
                  src={show.thumbnailUrl}
                  alt={`${show.title} TV Show`}
                  className="w-full h-36 object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center">
                  <Play className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 h-8 w-8" />
                </div>
              </div>
              <h3 className="text-neutral-light font-medium mt-3 truncate">{show.title}</h3>
              <p className="text-neutral-light opacity-70 text-sm">Season 1 • Episodes</p>
              <div className="flex items-center mt-2">
                <div className="flex text-accent-gold text-sm">
                  {renderStars(show.rating)}
                </div>
                <span className="text-neutral-light opacity-70 text-sm ml-2">{show.rating}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
