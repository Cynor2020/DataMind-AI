import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FilesUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

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
      router.push('/login');
      return;
    }

    console.log('Token being sent:', token); // Debug: Log the token

    // Ensure the token doesn't already have "Bearer"
    const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`, // Add Bearer prefix only once
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success(response.data.message);
      setFile(null);
      fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'File upload failed!';
      toast.error(errorMessage);
      if (errorMessage === 'Token is missing' || errorMessage === 'Invalid token' || errorMessage === 'Token has expired') {
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again.');
        router.push('/login');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <h1>File Upload Page</h1>
      <p>Bhai yeh hamara Upload Page aa chuka hai</p>

      <form onSubmit={handleUpload}>
        <div className="file-input">
          <label htmlFor="file-upload">Choose a file (CSV, TXT, PDF):</label>
          <input
            type="file"
            id="file-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.txt,.pdf"
          />
        </div>
        {file && <p>Selected file: {file.name}</p>}
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload File'}
        </button>
      </form>
    </div>
  );
};

export default FilesUpload;