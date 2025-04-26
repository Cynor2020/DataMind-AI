import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { toast } from 'react-toastify';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const FilesHistory = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
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
        // Sort files by upload_date (descending) and take only the latest one
        const sortedFiles = response.data.files.sort((a, b) => 
          new Date(b.upload_date) - new Date(a.upload_date)
        );
        setFiles(sortedFiles.slice(0, 1)); // Keep only the latest file
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


  const analyzeFile = async (fileId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first!');
      router.push('/login');
      return;
    }

    const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

    setAnalyzing(true);
    try {
      const response = await axios.get(`${API_URL}/analyze/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
        },
      });
      if (response.data.results) {
        console.log('Analysis Results:', response.data.results);
        console.log('Plot URLs:', response.data.results.plots);
        setAnalysisResults(response.data.results);
        toast.success('Analysis completed successfully!');
      } else {
        toast.error(response.data.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Failed to analyze file';
      toast.error(errorMessage);
      if (errorMessage === 'Token is missing' || errorMessage === 'Invalid token' || errorMessage === 'Token has expired') {
        localStorage.removeItem('token');
        toast.error('Session expired. Please login again.');
        router.push('/login');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div>Loading file history...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Files</h1>
      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file._id} className="p-2 bg-gray-100 rounded flex justify-between items-center">
              <div>
                <strong>{file.filename}</strong> ({file.filetype}) - Uploaded on{' '}
                {new Date(file.upload_date).toLocaleString()}
              </div>
              <div>

                {file.filetype === 'csv' && (
                  <button
                    onClick={() => analyzeFile(file._id)}
                    disabled={analyzing}
                    className={`px-4 py-2 rounded ${
                      analyzing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
                    } text-white`}
                  >
                    {analyzing ? 'Analyzing...' : 'Analyze'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No files uploaded yet.</p>
      )}
      {analysisResults && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Analysis Results</h2>
          {/* Display Insights */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold">Dataset Insights</h3>
            <p>Rows: {analysisResults.insights.shape.rows}, Columns: {analysisResults.insights.shape.columns}</p>
            <h4 className="mt-2">Missing Values</h4>
            <ul className="list-disc pl-5">
              {Object.entries(analysisResults.insights.missing_values).map(([col, count]) => (
                <li key={col}>
                  {col}: {count}
                </li>
              ))}
            </ul>
            {analysisResults.predictions.target && (
              <div className="mt-4">
                <h4 className="font-semibold">Predictions</h4>
                <p>Target: {analysisResults.predictions.target}</p>
                <p>R² Score: {analysisResults.predictions.r2_score.toFixed(4)}</p>
              </div>
            )}
          </div>
          {/* Display Plots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {analysisResults.plots && analysisResults.plots.length > 0 ? (
              analysisResults.plots.map((plot, index) => (
                <div key={index} className="bg-white p-4 rounded shadow">
                  <img
                    src={plot}
                    alt={`Plot ${index + 1}`}
                    className="w-full max-h-64 object-cover"
                    onError={(e) => console.error(`Failed to load plot ${index + 1}:`, plot)}
                  />
                </div>
              ))
            ) : (
              <p>No plots available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesHistory;