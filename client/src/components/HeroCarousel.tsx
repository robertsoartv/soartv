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
import './HeroCarousel.css';

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [showTrailer, setShowTrailer] = useState(false);
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
    
    // For immediate trailer slides, show trailer immediately
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

      {/* trailer video */}
      {showTrailer && (
        <video
          className="hero-video"
          src={slide.trailer}
          autoPlay
          muted
          onError={(e) => {
            console.error('🚨 Hero video error:', e);
            console.error('📹 Failed video URL:', slide.trailer);
            console.error('📍 Current environment:', import.meta.env.MODE);
            console.error('🌐 Current hostname:', window.location.hostname);
            console.error('🔗 Full video URL:', new URL(slide.trailer, window.location.origin).href);
            if (e.target.error) {
              console.error('💥 Video error details:', e.target.error.code, e.target.error.message);
            }
          }}
          onLoadStart={() => {
            console.log('📹 Video loading:', slide.trailer);
            console.log('🌐 Environment:', import.meta.env.MODE);
            console.log('🔗 Full URL:', new URL(slide.trailer, window.location.origin).href);
          }}
          onEnded={() => {
            nextSlide();
          }}
        />
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