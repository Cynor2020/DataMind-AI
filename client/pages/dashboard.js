import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import FilesHistory from '../components/Files_history';
import FilesUpload from '../components/Files_upload';
import AnalyzeResults from '../components/AnalyzeResults';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [activeComponent, setActiveComponent] = useState('dashboard');
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        router.push('/login');
        return;
      }

      // Ensure the token doesn't already have "Bearer"
      const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

      try {
        const response = await axios.get(`${API_URL}/dashboard`, {
          headers: { Authorization: `Bearer ${cleanToken}` },
        });
        setMessage(response.data.message);
        setUsername(response.data.username);
      } catch (error) {
        console.error('Dashboard error:', error.response?.data);
        const errorMessage = error.response?.data?.message || 'Failed to load dashboard';
        toast.error(errorMessage);
        if (errorMessage === 'Token is missing' || errorMessage === 'Invalid token' || errorMessage === 'Token has expired') {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    };

    fetchData();
  }, [router]);

  return (
    <div className="dashboard-container">
      <Header username={username} />
      <div className="dashboard-content">
        <Sidebar setActiveComponent={setActiveComponent} />
        <main className="dashboard-main">
          <h1>Dashboard</h1>
          {activeComponent === 'dashboard' && <p>Welcome to Dashboard</p>}
          {activeComponent === 'history' && <FilesHistory />}
          {activeComponent === 'upload' && <FilesUpload />}
          {activeComponent === 'results' && <AnalyzeResults />}
          <p>{message || 'Loading...'}</p>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;