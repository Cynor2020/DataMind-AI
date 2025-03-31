import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import FilesHistory from '../components/Files_history';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [message, setMessage] = useState('');
  const [activeComponent, setActiveComponent] = useState('dashboard'); // 🔥 Define activeComponent state
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        router.push('/login');
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/dashboard`, {
          headers: { Authorization: token },
        });
        setMessage(response.data.message);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to load dashboard');
        router.push('/login');
      }
    };

    fetchData();
  }, [router]);

  return (
    <div className="dashboard-container">
      <Header />
      <div className="dashboard-content">
        <Sidebar setActiveComponent={setActiveComponent} />  {/* 🔥 Pass setActiveComponent */}
        <main className="dashboard-main">
          <h1>Dashboard</h1>
          {activeComponent === 'dashboard' && <p>Welcome to Dashboard</p>}
          {activeComponent === 'history' && <FilesHistory />}  {/* 🔥 Render History Component */}
          <p>{message || 'Loading...'}</p>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
