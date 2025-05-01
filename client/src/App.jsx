import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import UploadCSV from './components/UploadCSV';
import History from './components/History';
import AnalyzeResult from './components/AnalyzeResult'; // Add this import
import Register from './pages/Register';
import Login from './pages/Login';
import EditProfile from './pages/EditProfile';
import Home from './pages/Home';
import './components/Sidebar.css';

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const isAuthenticated = () => !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={<Navigate to="/home" />}
        />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/edit-profile" element={isAuthenticated() ? <EditProfile /> : <Navigate to="/home" />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoutes
              isDarkMode={isDarkMode}
              toggleDarkMode={toggleDarkMode}
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

// ProtectedRoutes Component to Handle Sidebar and Content
const ProtectedRoutes = ({ isDarkMode, toggleDarkMode, isSidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = () => !!localStorage.getItem('token');

  // Check token on every route change and redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/home', { replace: true });
    }
  }, [location, navigate]);

  // If not authenticated, don't render the protected content
  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-300 border border-gray-300 dark:border-blue-400 rounded-md">
      <Navbar
        toggleDarkMode={toggleDarkMode}
        isDarkMode={isDarkMode}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
      />
      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'md:ml-0'} bg-white dark:bg-gray-800`}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<UploadCSV />} />
            <Route path="/history" element={<History />} />
            <Route path="/analyze-result" element={<AnalyzeResult />} /> Add this route
            <Route path="/logout" element={<div>Logging out...</div>} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => (
  <div className="animate-fadeIn">
    <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Dashboard</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
        <h3 className="text-black dark:text-white">Stats Card 1</h3>
        <p className="text-gray-600 dark:text-gray-300">Some data here</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow duration-200">
        <h3 className="text-black dark:text-white">Stats Card 2</h3>
        <p className="text-gray-600 dark:text-gray-300">Some data here</p>
      </div>
    </div>
  </div>
);

export default App;