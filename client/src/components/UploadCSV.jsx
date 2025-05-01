import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5000';

const UploadCSV = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedExtensions = ['csv', 'txt', 'pdf'];
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('Only CSV, TXT, and PDF files are allowed!');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload!');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first!');
      navigate('/login');
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(response.data.message);
      setFile(null);
      fileInputRef.current.value = '';
      // Redirect to analyze-result page after successful upload
      navigate('/analyze-result');
    } catch (error) {
      console.error('Upload error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'File upload failed!';
      toast.error(errorMessage);
      if (errorMessage === 'Token is missing' || errorMessage === 'Invalid token' || errorMessage === 'Token has expired') {
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again.');
        navigate('/login');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold mb-4 text-black dark:text-white">Upload CSV</h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <form onSubmit={handleUpload}>
          <div className="mb-4">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Choose a file (CSV, TXT, PDF):
            </label>
            <input
              type="file"
              id="file-upload"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,.txt,.pdf"
              className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600"
            />
          </div>
          {file && <p className="text-gray-600 dark:text-gray-300 mb-4">Selected file: {file.name}</p>}
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:bg-gray-400"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadCSV;