import React, { useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Video } from '@shared/schema';
import './TrendingWeek.css';

export default function TrendingWeek() {
  const rowRef = useRef<HTMLDivElement>(null);

  const { data: videos = [] } = useQuery<Video[]>({
    queryKey: ['/api/videos'],
  });

  // Get trending movies (first 6 for better performance)
  const trendingMovies = videos.filter(v => v.category === 'movies').slice(0, 6);

  useEffect(() => {
    const interval = setInterval(() => {
      const row = rowRef.current;
      if (!row) return;

      // scroll forward one card-width
      const cardWidth = 200 + 16; // img width + gap
      row.scrollBy({ left: cardWidth, behavior: 'smooth' });

      // loop back to start
      if (row.scrollLeft + row.offsetWidth >= row.scrollWidth) {
        setTimeout(() => {
          row.scrollTo({ left: 0, behavior: 'smooth' });
        }, 500);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="trending-week">
      <h2>Top Movies This Week</h2>
      <div className="trending-row" ref={rowRef}>
        {trendingMovies.map(movie => (
          <div key={movie.id} className="trending-card">
            <img src={movie.thumbnail} alt={movie.title} />
            <span className="trending-title">{movie.title}</span>
          </div>
        ))}
      </div>
    </section>
  );
}