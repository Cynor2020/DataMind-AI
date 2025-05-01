import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

// Use import.meta.env for Vite
const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';

const History = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchFiles = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first!');
      navigate('/login');
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
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [navigate]);

  const handleDownload = async (fileId, filename) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first!');
      navigate('/login');
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

    try {
      const response = await axios.get(`${API_URL}/download/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
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
        navigate('/login');
      }
    }
  };

  const handleDelete = async (fileId, filename) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first!');
      navigate('/login');
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

    try {
      const response = await axios.delete(`${API_URL}/delete/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
        },
      });

      toast.success(response.data.message);
      // Refresh the file list after deletion
      fetchFiles();
    } catch (error) {
      console.error('Delete error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to delete file';
      toast.error(errorMessage);
      if (errorMessage === 'Token is missing' || errorMessage === 'Invalid token' || errorMessage === 'Token has expired') {
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    }
  };

  const handleAnalyze = (fileId) => {
    navigate(`/analyze-result?fileId=${fileId}`);
  };

  if (loading) {
    return (
      <div className="animate-fadeIn">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-black dark:text-white text-center">
          History
        </h2>
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow mx-2 sm:mx-4 md:mx-auto max-w-xs sm:max-w-sm md:max-w-2xl w-full">
          <p className="text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base">Loading file history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-black dark:text-white text-center">
        History
      </h2>
      <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow mx-2 sm:mx-4 md:mx-auto max-w-xs sm:max-w-sm md:max-w-2xl w-full">
        {files.length > 0 ? (
          <ul className="text-gray-600 dark:text-gray-300 space-y-2">
            {files.map((file) => (
              <li
                key={file._id}
                className="p-2 sm:p-3 border-b border-gray-300 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center"
              >
                <span className="text-xs sm:text-sm md:text-base mb-2 sm:mb-0 break-words w-full sm:w-auto">
                  <strong>{file.filename}</strong> ({file.filetype}) - Uploaded on{' '}
                  {new Date(file.upload_date).toLocaleString()}
                </span>
                <div className="gap-2 flex flex-row sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto mt-2 sm:mt-0">
                  <button
                    onClick={() => handleDownload(file._id, file.filename)}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-2 sm:px-3 rounded text-xs sm:text-sm w-70 sm:w-auto"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleDelete(file._id, file.filename)}
                    className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 sm:px-3 rounded text-xs sm:text-sm w-70 sm:w-auto"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleAnalyze(file._id)}
                    className="bg-green-500 hover:bg-green-600 text-white py-1 px-2 sm:px-3 rounded text-xs sm:text-sm w-70 sm:w-auto"
                  >
                    Analyze
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base">No files uploaded yet.</p>
        )}
      </div>
    </div>
  );
};

export default History;