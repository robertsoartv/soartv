import { useState, useEffect, useRef } from 'react';
import { featuredSlides, Slide } from '../data/featuredSlides';
import { useLocation } from 'wouter';
import {
  FaPlay,
  FaPlus,
  FaInfoCircle,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import Player from './Player';
import './HeroCarousel.css';

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const trailerTimer = useRef<number>();
  const autoAdvanceTimer = useRef<number>();
  const slideContainer = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const nextSlide = () =>
    setCurrent((idx) => (idx + 1) % featuredSlides.length);
  const prevSlide = () =>
    setCurrent((idx) =>
      idx === 0 ? featuredSlides.length - 1 : idx - 1
    );

  // whenever current changes, reset trailer state & schedule poster→trailer switch
  useEffect(() => {
    // Reset to first slide if current index is out of bounds
    if (current >= featuredSlides.length) {
      setCurrent(0);
      return;
    }
    
    const slide = featuredSlides[current];
    if (!slide) return;
    
    // Reset video failed state on slide change
    setVideoFailed(false);
    
    // For immediate trailer slides, show trailer immediately (only if video didn't fail)
    if (slide.title === 'My Name Is Lola' || slide.title === 'Soul Damage' || slide.title === 'From Darkness to Light!' || slide.title === '!FREAKS!' || slide.title === 'Alphaville') {
      setShowTrailer(true);
      return;
    }

    setShowTrailer(false);

    // clear any pending timers
    clearTimeout(trailerTimer.current);
    
    // Auto-play trailer for other slides with trailers after 5 seconds
    if (slide.title === 'Wicked') {
      trailerTimer.current = window.setTimeout(() => {
        setShowTrailer(true);
      }, 5000);
    }

    // Set up auto-advance timer (15 seconds per slide)
    clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = window.setTimeout(() => {
      nextSlide();
    }, 15000);

    // cleanup
    return () => {
      clearTimeout(trailerTimer.current);
      clearTimeout(autoAdvanceTimer.current);
    };
  }, [current]);

  const slide = featuredSlides[current];

  const handleWatchNow = () => {
    // Navigate to the movie page using featured- prefix
    setLocation(`/watch/featured-${slide.id}`);
  };

  const handleMoreInfo = () => {
    // Navigate to the movie page for more info
    setLocation(`/watch/featured-${slide.id}`);
  };

  const getHeaderStyle = () => {
    // Show poster image as background when video fails or for slides with immediate posters
    if (videoFailed || !showTrailer) {
      return {
        backgroundImage: `
          linear-gradient(
            to right,
            rgba(0,0,0,0.8) 0%,
            rgba(0,0,0,0.3) 40%,
            rgba(0,0,0,0) 70%
          ),
          url('${slide.bgImage}')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    
    if (slide.title === 'Wicked') {
      return {
        backgroundImage: `
          linear-gradient(
            to right,
            rgba(0,0,0,1) 0%,
            rgba(0,0,0,0) 40%
          ),
          url('${slide.bgImage}')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    if (slide.title === '!FREAKS!') {
      return {
        backgroundImage: `
          linear-gradient(
            to right,
            rgba(0,0,0,0.9) 0%,
            rgba(139,0,0,0.3) 40%,
            rgba(0,0,0,0) 70%
          ),
          url('${slide.bgImage}')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    if (slide.title === 'Alphaville') {
      return {
        backgroundImage: `
          linear-gradient(
            to right,
            rgba(0,0,0,1) 0%,
            rgba(0,0,0,0) 40%
          ),
          url('${slide.bgImage}')
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    }
    return {};
  };

  return (
    <header 
      className="hero hero-slide" 
      data-slide={slide.title}
      style={getHeaderStyle()}
      ref={slideContainer}
    >
      {/* Background image for non-Wicked/!FREAKS!/Alphaville slides, but hide for immediate trailer slides */}
      {!showTrailer && slide.title !== 'My Name Is Lola' && slide.title !== 'Soul Damage' && slide.title !== 'From Darkness to Light!' && slide.title !== '!FREAKS!' && slide.title !== 'Alphaville' && (
        <div
          className="hero-bg"
          style={{ 
            backgroundImage: slide.title === 'Wicked' ? 'none' : `url('${slide.bgImage}')`,
            display: slide.title === 'Wicked' ? 'none' : 'block'
          }}
        />
      )}

      {/* trailer video - YouTube iframe or HLS/MP4 player */}
      {showTrailer && !videoFailed && (
        <>
          {slide.trailer.includes('youtube.com') || slide.trailer.includes('youtu.be') ? (
            <iframe
              className="hero-video"
              src={slide.trailer.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') + '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + slide.trailer.split('v=')[1]?.split('&')[0]}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={slide.title}
              style={{ border: 'none', width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
            />
          ) : (
            <div className="hero-video">
              <Player
                src={slide.trailer}
                className="w-full h-full object-cover"
                autoPlay
                muted
                controls={false}
                onEnded={() => nextSlide()}
                onError={(error) => {
                  console.warn('⚠️ Video unavailable, showing poster instead');
                  setVideoFailed(true);
                  setShowTrailer(false);
                }}
              />
            </div>
          )}
        </>
      )}

      {/* Only show overlay and gradients for non-Wicked/!FREAKS!/Alphaville slides */}
      {slide.title !== 'Wicked' && slide.title !== '!FREAKS!' && slide.title !== 'Alphaville' && <div className="hero-overlay" />}

      {/* arrows */}
      <button
        className="hero-arrow left"
        onClick={() => {
          clearTimeout(trailerTimer.current);
          clearTimeout(autoAdvanceTimer.current);
          prevSlide();
        }}
      >
        <FaChevronLeft />
      </button>
      <button
        className="hero-arrow right"
        onClick={() => {
          clearTimeout(trailerTimer.current);
          clearTimeout(autoAdvanceTimer.current);
          nextSlide();
        }}
      >
        <FaChevronRight />
      </button>

      {/* content layout with conditional poster */}
      <div className="hero-layout">
        {/* Movie Poster - only show if not using poster as background and not My Name Is Lola */}
        {slide.bgImage !== slide.posterImage && slide.title !== 'My Name Is Lola' && slide.posterImage && (
          <div className="hero-poster">
            <img src={slide.posterImage} alt={`${slide.title} poster`} />
          </div>
        )}
        
        {/* Content */}
        <div className={`hero-content ${slide.title === 'Wicked' ? 'wicked-layout' : ''} ${slide.title === 'My Name Is Lola' ? 'lola-layout' : ''} ${slide.title === 'Soul Damage' ? 'soul-layout' : ''} ${slide.title === 'From Darkness to Light!' ? 'darkness-layout' : ''} ${slide.title === '!FREAKS!' ? 'freaks-layout' : ''} ${slide.title === 'Alphaville' ? 'alphaville-layout' : ''}`}>
          <div className="hero-tags">
            {slide.primeBadge && (
              <span className="tag tag-prime">SoarTV</span>
            )}
            {slide.trendingBadge && (
              <span className="tag tag-trending">
                {slide.trendingBadge}
              </span>
            )}
          </div>

          {slide.logoImage ? (
            <img 
              src={slide.logoImage} 
              alt={`${slide.title} logo`} 
              className="hero-logo"
            />
          ) : (
            <h1 className={
              slide.title === 'Wicked' ? 'wicked-title' : 
              slide.title === 'My Name Is Lola' ? 'hero-title lola-title' : 
              slide.title === 'Soul Damage' ? 'hero-title soul-title' :
              slide.title === 'From Darkness to Light!' ? 'hero-title darkness-title' :
              slide.title === '!FREAKS!' ? 'hero-title freaks-title' :
              'hero-title'
            }>
              {slide.title}
            </h1>
          )}
          <p className="hero-subtitle">{slide.subtitle}</p>

          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={handleWatchNow}>
              <FaPlay className="btn-icon" /> {slide.actionLabel}
            </button>
            <button className="btn btn-secondary">
              <FaPlus />
            </button>
            <button className="btn btn-secondary" onClick={handleMoreInfo}>
              <FaInfoCircle />
            </button>
          </div>

          {slide.rating && (
            <span className="tag tag-rating">{slide.rating}</span>
          )}

          {/* dots */}
          <div className="hero-dots">
            {featuredSlides.map((_, idx) => (
              <span
                key={idx}
                className={idx === current ? 'dot active' : 'dot'}
                onClick={() => {
                  clearTimeout(trailerTimer.current);
                  setCurrent(idx);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}