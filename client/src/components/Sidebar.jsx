import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUpload, FaHistory, FaSignOutAlt, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: FaHome },
    { name: 'Upload CSV', path: '/upload', icon: FaUpload },
    { name: 'History', path: '/history', icon: FaHistory },
    { name: 'Analyze ', path: '/analyze_missing_value', icon: FaHistory },
    { name: 'Analyze AI ', path: '/analyze-result', icon: FaHistory },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 w-60 neumorphic-bg text-black dark:text-white transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out z-30`}
    >
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-black dark:text-white">DataMind-AI</h1>
        <button
          className="text-black dark:text-white neumorphic-btn p-2 rounded-full"
          onClick={toggleSidebar}
        >
          {isOpen ? <FaArrowLeft /> : <FaArrowRight />}
        </button>
      </div>
      <hr className="border-gray-300 dark:border-gray-700 mx-4" />
      {isOpen && (
        <ul className="mt-3 p-4">
          {menuItems.map((item) => (
            <li
              key={item.name}
              className="mb-3 neumorphic-btn rounded-lg transition-all duration-300 animate-slideIn"
            >
              <Link
                to={item.path}
                className="flex items-center px-4 py-3 text-black dark:text-white hover:text-blue-500"
                onClick={() => window.innerWidth < 768 && toggleSidebar()}
              >
                <item.icon className="inline-block w-6 h-6 mr-3 animate-spin-slow hover:animate-pulse" />
                {item.name}
              </Link>
            </li>
          ))}
          {/* Logout Button */}
          <li
            className="mb-3 neumorphic-btn rounded-lg transition-all duration-300 animate-slideIn"
          >
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-3 w-full text-left text-black dark:text-white hover:text-blue-500"
            >
              <FaSignOutAlt className="inline-block w-6 h-6 mr-3 animate-spin-slow hover:animate-pulse" />
              Logout
            </button>
          </li>
        </ul>
      )}
      {isOpen && (
        <button
          className="md:hidden absolute top-4 right-4 text-black dark:text-white neumorphic-btn p-2 rounded-full"
          onClick={toggleSidebar}
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default Sidebar;