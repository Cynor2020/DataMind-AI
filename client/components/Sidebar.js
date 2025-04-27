'use client';

import React, { useState } from 'react';

const Sidebar = ({ setActiveComponent }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Function to handle menu item click
  const handleMenuItemClick = (component) => {
    setActiveComponent(component); // Set the active component
    setIsOpen(false); // Close the sidebar
  };

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
          <span
            className="menu-item"
            onClick={() => handleMenuItemClick('dashboard')}
          >
            Home
          </span>
          <span
            className="menu-item"
            onClick={() => handleMenuItemClick('upload')}
          >
            Upload CSV
          </span>
          <span
            className="menu-item"
            onClick={() => handleMenuItemClick('history')}
          >
            History
          </span>
          <span
            className="menu-item"
            onClick={() => handleMenuItemClick('results')}
          >
            Analyze
          </span>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;