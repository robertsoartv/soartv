import React from 'react';
import { Search } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/lib/authContext';
import ProfileMenu from './ProfileMenu';
import './PrimeNavbar.css';

const navItems = [
  { label: 'Home',      href: '/',               active: true  },
  { label: 'Browse',    href: '/browse',         active: false },
  { label: 'Search',    href: '/search',         active: false },
  { label: 'Community', href: '/feed',           active: false },
  { label: 'Discover',  href: '/recommendations', active: false },
  { label: 'Saved',     href: '/saved',          active: false },
];

export default function PrimeNavbar() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleJoinClick = () => {
    setLocation('/setup');
  };

  const handleProfileClick = () => {
    if (user) {
      setLocation('/user-profile');
    } else {
      setLocation('/setup');
    }
  };



  return (
    <header className="soartv-nav">
      <div className="soartv-nav-left">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <video 
            className="soartv-nav-video-large" 
            autoPlay 
            loop 
            muted 
            playsInline
            onLoadStart={() => console.log('🎞️ Navbar video loading:', '/attached_assets/soartvai animated_1758563103226.mp4')}
            onCanPlay={() => console.log('✅ Navbar video can play')}
            onError={(e) => {
              console.error('❌ Navbar video error:', e);
              console.error('📁 Video path:', '/attached_assets/soartvai animated_1758563103226.mp4');
            }}
          >
            <source src="/attached_assets/soartvai animated_1758563103226.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <nav className="soartv-links">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={item.href !== '#' ? (e) => {
                e.preventDefault();
                setLocation(item.href);
              } : undefined}
              className={item.active ? 'soartv-link active' : 'soartv-link'}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="soartv-divider" />
        <img src="/assets/soartv-logo.svg" alt="SoarTV" className="soartv-logo" />
      </div>

      <div className="soartv-nav-right">
        <Search 
          className="icon-grid" 
          onClick={() => setLocation('/search')}
          style={{ cursor: 'pointer' }}
        />
        {!user ? (
          <button className="soartv-btn" onClick={handleJoinClick}>Join SoarTV</button>
        ) : (
          <ProfileMenu />
        )}
      </div>
    </header>
  );
}