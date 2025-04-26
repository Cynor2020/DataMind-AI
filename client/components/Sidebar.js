'use client';

import React, { useState } from 'react';

const Sidebar = ({ setActiveComponent }) => {  // Receive setActiveComponent
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar Toggle Button */}
      <button className="menu-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✖' : '☰'}
      </button>

      {/* Sidebar Menu */}
      <div className="sidebar-content">
        <div className="menu-title">Main Menu</div>
        <nav className="menu-nav">
          <span className="menu-item" onClick={() => setActiveComponent('dashboard')}>Home</span>
          <span className="menu-item" onClick={() => setActiveComponent('upload')}>Upload CSV</span>
          <span className="menu-item" onClick={() => setActiveComponent('history')}>History</span>
          <span className="menu-item" onClick={() => setActiveComponent('results')}>Analyze</span>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
