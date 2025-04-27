'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';
import AnalyzeResults from './AnalyzeResults'; // Import the AnalyzeResults component

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FilesUpload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false); // Track upload success
  const [showAnalyzeResults, setShowAnalyzeResults] = useState(false); // Track whether to show AnalyzeResults
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
        setIsUploaded(false); // Reset upload status
        return;
      }
      setFile(selectedFile);
      setIsUploaded(false); // Reset upload status when a new file is selected
      setShowAnalyzeResults(false); // Hide AnalyzeResults when a new file is selected
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
      setIsUploaded(true); // Set upload status to true after successful upload
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

  const handleAnalyzeClick = () => {
    setShowAnalyzeResults(true); // Show AnalyzeResults component
  };

  // Conditionally render AnalyzeResults or the upload form
  if (showAnalyzeResults) {
    return <AnalyzeResults />;
  }

  return (
    <div className="file-upload-container">
      <h1>File Upload Page</h1>

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

      {isUploaded && (
        <button className="analyze-btn" onClick={handleAnalyzeClick}>
          Analyze
        </button>
      )}
    </div>
  );
};

export default FilesUpload;