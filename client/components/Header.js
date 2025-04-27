'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const Header = ({ username }) => {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/'); // Redirect to homepage
  };

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
        {username ? `Welcome, ${username}` : 'Loading...'}
      </div>

      <button className="login-btn" onClick={handleLogout}>
        Log Out
      </button>
    </header>
  );
};

export default Header;