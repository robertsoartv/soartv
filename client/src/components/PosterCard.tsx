
import './PosterCard.css';

interface PosterProps {
  src: string;
  alt: string;
}

export default function PosterCard({ src, alt }: PosterProps) {
  return (
    <div className="poster-card">
      <span className="badge-prime">SoarTV</span>
      <img src={src} alt={alt} />
    </div>
  );
}