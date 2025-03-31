import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FilesHistory = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFiles = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first!');
        router.push('/login');
        return;
      }

      const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

      try {
        const response = await axios.get(`${API_URL}/files-history`, {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
          },
        });
        setFiles(response.data.files);
        toast.success(response.data.message);
      } catch (error) {
        console.error('Files history error:', error.response?.data);
        const errorMessage = error.response?.data?.message || 'Failed to load file history';
        toast.error(errorMessage);
        if (errorMessage === 'Token is missing' || errorMessage === 'Invalid token' || errorMessage === 'Token has expired') {
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again.');
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [router]);

  if (loading) {
    return <div>Loading file history...</div>;
  }

  return (
    <div>
      <h1>Files History</h1>
      <p>Yahan par aapki files ki history hogi!</p>
      {files.length > 0 ? (
        <ul>
          {files.map((file) => (
            <li key={file._id}>
              <strong>{file.filename}</strong> ({file.filetype}) - Uploaded on {new Date(file.upload_date).toLocaleString()}
            </li>
          ))}
        </ul>
      ) : (
        <p>No files uploaded yet.</p>
      )}
    </div>
  );
};

export default FilesHistory;