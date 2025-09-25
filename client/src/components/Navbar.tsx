import React from 'react';
import { FaSearch, FaQuestionCircle } from 'react-icons/fa';
import './Navbar.css';
import Logo from './Logo';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Logo />
        <div className="nav-links">
          <a href="#">Browse ▾</a>
          <a href="#">Movies</a>
          <a href="#">TV Shows</a>
          <a href="#">Live TV</a>
          <a href="#">Español</a>
          <a href="#">Soar Kids</a>
        </div>
      </div>
      <div className="navbar-right">
        <div className="search-container">
          <input
            type="text"
            placeholder="Find movies, TV shows and more"
            className="search-input"
          />
          <FaSearch className="search-icon" />
        </div>
        <button className="btn register-btn">Register</button>
        <a href="#" className="signin-link">Sign In</a>
        <FaQuestionCircle className="help-icon" />
      </div>
    </nav>
  );
};

export default Navbar;