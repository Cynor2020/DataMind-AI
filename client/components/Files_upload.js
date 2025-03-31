import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FilesUpload = () => {
  const [file, setFile] = useState(null); // State to store the selected file
  const [uploading, setUploading] = useState(false); // State to show loading status

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Optional: Add client-side validation for file types
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

  // Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload!');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first!');
      return;
    }

    // Create FormData to send the file
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`, // Add Bearer token
          'Content-Type': 'multipart/form-data', // Required for file uploads
        },
      });
      toast.success(response.data.message); // Show success message
      setFile(null); // Reset the file input
    } catch (error) {
      toast.error(error.response?.data?.message || 'File upload failed!');
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
            onChange={handleFileChange}
            accept=".csv,.txt,.pdf" // Restrict file types in the file picker
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