import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';

const AnalyzeManual = () => {
  const [formData, setFormData] = useState({
    column: '',
    fill_method: 'none',
    method: 'none',
    value: 'none',
    changes: 'none',
    type: 'none',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Get fileId from query params
  const queryParams = new URLSearchParams(location.search);
  const fileId = queryParams.get('fileId');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first!');
      navigate('/login');
      setLoading(false);
      return;
    }

    if (!fileId) {
      toast.error('File ID is missing!');
      setError('File ID is missing');
      setLoading(false);
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

    try {
      console.log('Sending POST to:', `${API_URL}/analyze_missing_value/${fileId}`);
      const response = await axios.post(
        `${API_URL}/analyze_missing_value/${fileId}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('Response:', response.data);

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Analysis failed');
      }

      setResult(response.data);
      toast.success('Analysis completed successfully!');
    } catch (err) {
      console.error('Error details:', err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || 'Failed to analyze data';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-black dark:text-white text-center">
        Data Analysis
      </h2>
      <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow mx-2 sm:mx-4 md:mx-auto max-w-xs sm:max-w-sm md:max-w-2xl w-full">
        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label htmlFor="column" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Row/Column
            </label>
            <input
              type="text"
              id="column"
              name="column"
              value={formData.column}
              onChange={handleChange}
              placeholder="Enter the row/column"
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="fill_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fill Method
            </label>
            <select
              name="fill_method"
              id="fill_method"
              value={formData.fill_method}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="none">None</option>
              <option value="mean">Mean</option>
              <option value="median">Median</option>
              <option value="mode">Mode</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Method
            </label>
            <select
              name="method"
              id="method"
              value={formData.method}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="none">None</option>
              <option value="remove">Remove</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Value
            </label>
            <select
              name="value"
              id="value"
              value={formData.value}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="none">None</option>
              <option value="custom">Custom</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="changes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Changes
            </label>
            <select
              name="changes"
              id="changes"
              value={formData.changes}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="none">None</option>
              <option value="fix">Fix</option>
              <option value="revert">Revert</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <select
              name="type"
              id="type"
              value={formData.type}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="none">None</option>
              <option value="row">Row</option>
              <option value="column">Column</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded text-white text-sm sm:text-base ${
              loading ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          >
            {loading ? 'Analyzing...' : 'Submit'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 text-sm sm:text-base">
            Error: {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-8">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-black dark:text-white text-center">
              Analysis Results
            </h3>
            <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow">
              <div className="space-y-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                <p>
                  <strong>Status:</strong> {result.status || 'N/A'}
                </p>
                <p>
                  <strong>Affected Rows:</strong> {result.affected_rows || 'N/A'}
                </p>
                <p>
                  <strong>Affected Columns:</strong> {result.affected_columns || 'N/A'}
                </p>
                <p>
                  <strong>Removed Row:</strong> {result.removed_row || 'N/A'}
                </p>
                <p>
                  <strong>Removed Column:</strong> {result.removed_column || 'N/A'}
                </p>
              </div>
              {result.form_data && (
                <div className="mt-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-300">
                    Form Data
                  </h4>
                  <ul className="list-none space-y-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    {Object.entries(result.form_data).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {value || 'N/A'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzeManual;