// components/Header.js
import React from 'react';

const Header = () => {
  return (
    <header className="header">
      <div className="logo">DataMind-AI</div>
      <nav className="nav-menu">
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
      </nav>
      
      
      <div className="search-bar">
        <input type="text" placeholder="Search..." />
      </div>
      
      <button className="login-btn">Login</button>
    </header>
  );
};

export default Header;