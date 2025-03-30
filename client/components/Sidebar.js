'use client';

import React, { useState } from 'react';
import Link from 'next/link';

const Sidebar = () => {
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
        <Link href="/"><span className="menu-item">Home</span></Link>
        <Link href="/about"><span className="menu-item">Upload CSV</span></Link>
        <Link href="/contact"><span className="menu-item">History</span></Link>
        </nav>

      </div>
    </aside>
  );
};

export default Sidebar;
