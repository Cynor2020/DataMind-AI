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

  const handleDownload = async (fileId, filename) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first!');
      router.push('/login');
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

    try {
      const response = await axios.get(`${API_URL}/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
        },
        responseType: 'blob', // Important for file downloads
      });

      // Create a URL for the blob and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename); // Use original filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Downloaded ${filename} successfully!`);
    } catch (error) {
      console.error('Download error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to download file';
      toast.error(errorMessage);
      if (errorMessage === 'Token is missing' || errorMessage === 'Invalid token' || errorMessage === 'Token has expired') {
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again.');
        router.push('/login');
      }
    }
  };

  if (loading) {
    return <div>Loading file history...</div>;
  }

  return (
    <div>
      <h1>My Files</h1>
      {files.length > 0 ? (
        <ul>
          {files.map((file) => (
            <li key={file._id}>
              <strong>{file.filename}</strong> ({file.filetype}) - Uploaded on {new Date(file.upload_date).toLocaleString()}
              <button
                onClick={() => handleDownload(file._id, file.filename)}
                style={{ marginLeft: '10px' }}
              >
                Download
              </button>
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