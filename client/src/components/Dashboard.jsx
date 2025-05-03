import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import UploadCSV from './UploadCSV';
import History from './History';
import AnalyzeResult from './AnalyzeResult'; // Add this import
import Register from '../pages/Register';
import Login from '../pages/Login';
import AnalyzeManual from './AnalyzeManualt'; 

const Dashboard = ({ toggleDarkMode, isDarkMode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Check if user is authenticated (simplified)
  const isAuthenticated = () => !!localStorage.getItem('token');

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
        <div className={`flex-1 p-6 transition-all duration-300 ${isSidebarOpen ? 'md:ml-60' : 'md:ml-0'}`}>
          <Routes>
            <Route 
              path="/" 
              element={isAuthenticated() ? <Navigate to="/dashboard" /> : <Navigate to="/register" />} 
            />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={isAuthenticated() ? <DashboardContent /> : <Navigate to="/login" />} />
            <Route path="/upload" element={isAuthenticated() ? <UploadCSV /> : <Navigate to="/login" />} />
            <Route path="/history" element={isAuthenticated() ? <History /> : <Navigate to="/login" />} />
            <Route path="/analyze_missing_value" element={isAuthenticated() ? <AnalyzeManual /> : <Navigate to="/login" />} />
            <Route path="/analyze-result" element={isAuthenticated() ? <AnalyzeResult /> : <Navigate to="/login" />} /> {/* Add this route */}
            <Route path="/logout" element={<div>Logging out...</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};
const DashboardContent = () => (
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

export default Dashboard;