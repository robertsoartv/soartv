// MovieRow.tsx
import "./MovieRow.css";

interface Movie {
  poster: string;
  trailer: string;
}

const movies: Movie[] = [
  {
    poster: "https://via.placeholder.com/200x300?text=Movie+1",
    trailer: "https://www.w3schools.com/html/mov_bbb.mp4",
  },
  {
    poster: "https://via.placeholder.com/200x300?text=Movie+2",
    trailer: "https://www.w3schools.com/html/movie.mp4",
  },
  // Add more movies as needed
];

export default function MovieRow() {
  const handleMouseEnter = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement;
    video.play();
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLVideoElement>) => {
    const video = e.target as HTMLVideoElement;
    video.pause();
    video.currentTime = 0;
  };

  return (
    <section className="movie-row">
      <h2>Featured</h2>
      <div className="movies">
        {movies.map((movie, index) => (
          <video
            key={index}
            className="movie"
            muted
            preload="none"
            poster={movie.poster}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <source src={movie.trailer} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ))}
      </div>
    </section>
  );
}