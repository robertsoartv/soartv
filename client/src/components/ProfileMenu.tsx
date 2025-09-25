import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { useLocation } from 'wouter';
import { auth } from '@/lib/firebase';

export default function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setLocation('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const user = auth.currentUser;

  if (!user) return null;

  return (
    <div className="profile-menu" onClick={toggleMenu} style={{ position: 'relative', cursor: 'pointer' }}>
      <div style={{
        backgroundColor: '#900',
        color: 'white',
        borderRadius: '50%',
        padding: '10px',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '50px',
          right: 0,
          backgroundColor: '#111',
          border: '1px solid #ffd700',
          borderRadius: '8px',
          padding: '10px',
          zIndex: 999,
          minWidth: '150px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <p onClick={(e) => { e.stopPropagation(); setLocation('/user-profile'); }} style={menuItemStyle}>
            My Profile
          </p>
          <p onClick={(e) => { e.stopPropagation(); setLocation('/upload-project'); }} style={menuItemStyle}>
            Upload Project
          </p>
          <p onClick={(e) => { e.stopPropagation(); setLocation('/browse'); }} style={menuItemStyle}>
            Browse
          </p>
          <p onClick={(e) => { e.stopPropagation(); setLocation('/feed'); }} style={menuItemStyle}>
            Community
          </p>
          <hr style={{ border: '1px solid #333', margin: '8px 0' }} />
          <p onClick={(e) => { e.stopPropagation(); handleSignOut(); }} style={{ ...menuItemStyle, color: '#ffd700' }}>
            Sign Out
          </p>
        </div>
      )}
    </div>
  );
}

const menuItemStyle = {
  margin: '8px 0',
  color: 'white',
  cursor: 'pointer',
  fontSize: '14px',
  padding: '4px 8px',
  borderRadius: '4px',
  transition: 'background-color 0.2s ease'
};