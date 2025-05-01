import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';

const AnalyzeResult = () => {
  const [currentFile, setCurrentFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchFile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, redirecting to login');
        toast.error('Please login first!');
        navigate('/login');
        return;
      }

      const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;
      console.log('Token used for fetch:', cleanToken);

      // Check if fileId is passed in query parameters (from History page)
      const queryParams = new URLSearchParams(location.search);
      const fileId = queryParams.get('fileId');

      let endpoint = `${API_URL}/current_files`; // Default endpoint for latest file
      if (fileId) {
        endpoint = `${API_URL}/file/${fileId}`; // Use specific file endpoint if fileId is provided
      }

      try {
        console.log('Sending request to:', endpoint);
        const response = await axios.get(endpoint, {
          headers: { 'Authorization': `Bearer ${cleanToken}` },
        });
        console.log('API Response:', response.data);

        // Handle response based on endpoint
        if (fileId) {
          setCurrentFile(response.data.file || null); // Response has 'file' key for /file/<file_id>
        } else {
          setCurrentFile(response.data.files[0] || null); // Response has 'files' array for /current_files
        }

        if (response.data.message) toast.success(response.data.message);
      } catch (error) {
        console.error('Fetch error details:', error.response?.data || error.message);
        toast.error('Failed to load file. Check console for details.');
      } finally {
        setLoading(false);
        console.log('Loading set to false');
      }
    };

    fetchFile();
  }, [navigate, location]);

  const analyzeFile = async (fileId) => {
    console.log('Analyze button clicked for fileId:', fileId);
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token for analysis, redirecting to login');
      toast.error('Please login first!');
      navigate('/login');
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;
    console.log('Token used for analysis:', cleanToken);

    setAnalyzing(true);
    try {
      console.log('Sending analyze request to:', `${API_URL}/analyze/${fileId}`);
      const response = await axios.get(`${API_URL}/analyze/${fileId}`, {
        headers: { 'Authorization': `Bearer ${cleanToken}` },
      });
      console.log('Analyze API Response:', response.data);
      if (response.data.results) {
        setAnalysisResults(response.data.results);
        toast.success('Analysis completed successfully!');
      } else {
        toast.error(response.data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analyze error details:', error.response?.data || error.message);
      toast.error('Failed to analyze file. Check console for details.');
    } finally {
      setAnalyzing(false);
      console.log('Analyzing set to false');
    }
  };

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="animate-fadeIn">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-black dark:text-white text-center">
          Analyze File
        </h2>
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow mx-2 sm:mx-4 md:mx-auto max-w-xs sm:max-w-sm md:max-w-2xl w-full">
          <p className="text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base">Loading file...</p>
        </div>
      </div>
    );
  }

  console.log('Rendering main content, currentFile:', currentFile, 'analysisResults:', analysisResults);
  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-black dark:text-white text-center">
        Analyze File
      </h2>
      <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow mx-2 sm:mx-4 md:mx-auto max-w-xs sm:max-w-sm md:max-w-2xl w-full">
        {currentFile ? (
          <div className="p-2 sm:p-3 border-b border-gray-300 dark:border-gray-600 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <span className="text-xs sm:text-sm md:text-base mb-2 sm:mb-0 break-words w-full sm:w-auto text-gray-600 dark:text-gray-300">
              <strong>{currentFile.filename}</strong> ({currentFile.filetype}) - Uploaded on{' '}
              {new Date(currentFile.upload_date).toLocaleString()}
            </span>
            {currentFile.filetype === 'csv' && (
              <button
                onClick={() => analyzeFile(currentFile._id)}
                disabled={analyzing}
                className={`mt-2 sm:mt-0 py-1 px-2 sm:px-3 rounded text-xs sm:text-sm w-full sm:w-auto ${
                  analyzing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            )}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-300 text-center text-sm sm:text-base">No file found.</p>
        )}
        {analysisResults && (
          <div className="mt-8">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-black dark:text-white text-center">Analysis Results</h3>
            <div className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow">
              <h4 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-300">Dataset Insights</h4>
              {analysisResults.insights?.shape ? (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                  Rows: {analysisResults.insights.shape.rows}, Columns: {analysisResults.insights.shape.columns}
                </p>
              ) : (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">No shape data available.</p>
              )}
              <h5 className="mt-2 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Missing Values</h5>
              {analysisResults.insights?.missing_values ? (
                <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 text-xs sm:text-sm">
                  {Object.entries(analysisResults.insights.missing_values).map(([col, count]) => (
                    <li key={col}>{col}: {count}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">No missing values data available.</p>
              )}
              {analysisResults.predictions?.target ? (
                <div className="mt-4">
                  <h5 className="text-gray-600 dark:text-gray-300 font-semibold text-xs sm:text-sm">Predictions</h5>
                  <p className="text-xs sm:text-sm">Target: {analysisResults.predictions.target}</p>
                  <p className="text-xs sm:text-sm">R² Score: {analysisResults.predictions.r2_score?.toFixed(4) || 'N/A'}</p>
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">No predictions available.</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {Array.isArray(analysisResults.plots) && analysisResults.plots.length > 0 ? (
                analysisResults.plots.map((plot, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-2 sm:p-4 rounded-lg shadow">
                    <img
                      src={plot}
                      alt={`Plot ${index + 1}`}
                      className="w-full max-h-48 sm:max-h-64 object-cover rounded"
                      onError={(e) => console.error(`Failed to load plot ${index + 1}:`, e)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm text-center">No plots available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyzeResult;