import React, { useState, useEffect } from 'react';
import { FaBars, FaSearch, FaMoon, FaSun } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ toggleDarkMode, isDarkMode, isSidebarOpen, toggleSidebar }) => {
  const [userData, setUserData] = useState({ username: 'John Doe', photo: null });
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        if (response.ok) {
          setUserData({
            username: data.username || 'User',
            photo: data.photo ? `data:image/jpeg;base64,${data.photo}` : null,
          });
        } else {
          console.error('Failed to fetch user data:', data.message);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handlePhotoClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleEditProfile = () => {
    setShowDropdown(false);
    navigate('/edit-profile');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 px-4 py-3 flex justify-between items-center w-full sticky top-0 z-20 border border-gray-300 dark:border-blue-400">
      <div className="flex items-center text-xl gap-4">
        <FaBars
          className="text-black dark:text-white cursor-pointer"
          onClick={toggleSidebar}
        />
        <span className="text-black dark:text-white font-semibold">DataMind-AI</span>
      </div>
      <div className="flex items-center gap-x-5">
        <div className="relative hidden md:block">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FaSearch className="text-gray-400 dark:text-gray-300" />
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-64 px-4 py-1 pl-10 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
        >
          {isDarkMode ? (
            <FaSun className="text-yellow-400" />
          ) : (
            <FaMoon className="text-gray-600" />
          )}
        </button>
        <div className="relative flex items-center gap-2">
          <img
            src={userData.photo || 'https://randomuser.me/api/portraits/men/1.jpg'}
            alt="User"
            className="w-8 h-8 rounded-full cursor-pointer"
            onClick={handlePhotoClick}
          />
          <span className="text-black dark:text-white hidden md:block">{userData.username}</span>
          {showDropdown && (
            <div className="absolute right-0 top-10 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-blue-400 rounded-md shadow-lg z-50">
              <button
                onClick={handleEditProfile}
                className="block w-full text-left px-4 py-2 text-black dark:text-white hover:bg-blue-500 hover:text-white transition-colors duration-200"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;