import React from 'react';

const Header = ({ username }) => { // Accept username as a prop
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
      
      <div className="user-info">
        {username ? `Welcome, ${username}` : 'Loading...'} {/* Display username */}
      </div>
      
      <button className="login-btn">Login</button>
    </header>
  );
};

export default Header;