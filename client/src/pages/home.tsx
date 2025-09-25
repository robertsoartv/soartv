import HeroCarousel from "@/components/HeroCarousel";
import CategorySection from "@/components/category-section";
import FeaturedContent from "@/components/featured-content";
import VideoGrid from "@/components/video-grid";
import TVShowsSection from "@/components/tv-shows-section";
import TrendingWeek from "@/components/TrendingWeek";
import Footer from "@/components/footer";
import RecommendedForYou from "@/components/RecommendedForYou";
import { useState } from "react";
import { useLocation } from "wouter";
import type { Video } from "@shared/schema";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [, setLocation] = useLocation();

  const handleVideoSelect = (video: Video) => {
    // Check if this is a featured movie by matching title with featuredSlides
    const featuredSlide = [
      { id: 1, title: 'From Darkness to Light!' },
      { id: 2, title: 'Wicked' },
      { id: 3, title: 'My Name Is Lola' },
      { id: 4, title: 'Soul Damage' },
      { id: 5, title: '!FREAKS!' },
      { id: 6, title: 'Alphaville' }
    ].find(slide => slide.title === video.title);
    
    if (featuredSlide) {
      // Navigate to featured movie page
      setLocation(`/watch/featured-${featuredSlide.id}`);
    } else {
      // Navigate to regular Firebase video page
      setLocation(`/watch/${video.id}`);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="bg-prime-dark text-white font-sans overflow-x-hidden">
      <main className="pt-16">
        <HeroCarousel />
        <TrendingWeek />
        <RecommendedForYou onVideoSelect={handleVideoSelect} />
        <CategorySection 
          selectedCategory={selectedCategory} 
          onCategoryChange={handleCategoryChange} 
        />
        <VideoGrid 
          onVideoSelect={handleVideoSelect} 
          selectedCategory={selectedCategory} 
        />
        <FeaturedContent onVideoSelect={handleVideoSelect} />
        <TVShowsSection onVideoSelect={handleVideoSelect} />
        <Footer />
      </main>
    </div>
  );
}
