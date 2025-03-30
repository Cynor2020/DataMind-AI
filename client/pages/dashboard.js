import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const Dashboard = () => {
  const [message, setMessage] = useState('');
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

  if (!message) return <div>Loading...</div>;

  return (
    <div>
      <h1>{message}</h1>
    </div>
  );
};

export default Dashboard;