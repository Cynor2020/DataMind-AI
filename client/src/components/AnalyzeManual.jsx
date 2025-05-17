import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:5000';

const AnalyzeManual = () => {
  const [formData, setFormData] = useState({
    action: 'none',
    column: '',
    fill_method: 'none', // For outlier and handel_missing_values
    outlier_method: 'none', // For outlier (std_dev, z_score)
    method: 'none', // For handel_missing_values (none, remove)
    value: 'none', // For custom fill
    changes: '', // For handel_missing_values and remove_data (empty for preview)
    type: 'none', // For handel_missing_values and remove_duplicates
    target_type: 'none', // For fix_datatypes
    standardize_to: 'none', // For correct_data, standardize_data
    rule: 'none', // For standardize_data
    list_columns: '', // For remove_data
    list_row: '', // For remove_data
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

    // Validation
    if (formData.action === 'none') {
      toast.error('Please select an action!');
      setError('Please select an action');
      setLoading(false);
      return;
    }

    if (['handel_missing_values', 'outlier', 'fix_datatypes', 'correct_data', 'standardize_data'].includes(formData.action) && !formData.column) {
      toast.error('Column name is required!');
      setError('Column name is required');
      setLoading(false);
      return;
    }

    // Convert list_columns and list_row to arrays if not empty
    const listColumns = formData.list_columns ? formData.list_columns.split(',').map(item => item.trim()).filter(item => item) : [];
    const listRows = formData.list_row ? formData.list_row.split(',').map(item => {
      const num = parseInt(item.trim());
      return isNaN(num) ? null : num;
    }).filter(n => n !== null) : [];

    if (formData.action === 'remove_data' && listRows.some(n => n === null)) {
      toast.error('List of rows must contain valid numbers!');
      setError('List of rows must contain valid numbers');
      setLoading(false);
      return;
    }

    const submitData = {
      action: formData.action,
      column: formData.column,
      fill_method: formData.fill_method,
      method: formData.method,
      outlier_method: formData.outlier_method,
      value: formData.value,
      changes: formData.changes,
      type: formData.type,
      target_type: formData.target_type,
      standardize_to: formData.standardize_to,
      rule: formData.rule,
      list_columns: listColumns,
      list_row: listRows,
    };

    const cleanToken = token.startsWith('Bearer ') ? token.replace('Bearer ', '') : token;

    try {
      const response = await axios.post(
        `${API_URL}/analyze_missing_value/${fileId}`,
        submitData,
        {
          headers: {
            'Authorization': `Bearer ${cleanToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Analysis failed');
      }

      setResult(response.data);
      toast.success('Analysis completed successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to analyze data';
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
          {/* Action Dropdown */}
          <div className="mb-4">
            <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Action
            </label>
            <select
              name="action"
              id="action"
              value={formData.action}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="none">Select Action</option>
              <option value="handel_missing_values">Handle Missing Values</option>
              <option value="outlier">Outlier Detection</option>
              <option value="remove_duplicates">Remove Duplicates</option>
              <option value="fix_datatypes">Fix Datatypes</option>
              <option value="correct_data">Correct Data</option>
              <option value="standardize_data">Standardize Data</option>
              <option value="remove_data">Remove Data</option>
            </select>
          </div>

          {/* Handle Missing Values Section */}
          {formData.action === 'handel_missing_values' && (
            <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Handle Missing Values</h3>
              <div className="mb-4">
                <label htmlFor="column" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Column
                </label>
                <input
                  type="text"
                  id="column"
                  name="column"
                  value={formData.column}
                  onChange={handleChange}
                  placeholder="Enter column name"
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
              {formData.fill_method === 'custom' && (
                <div className="mb-4">
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Value
                  </label>
                  <input
                    type="text"
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    placeholder="Enter custom value (e.g., Unknown)"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              )}
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
              {formData.method === 'remove' && (
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
              )}
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
                  <option value="">Preview</option>
                  <option value="fix">Fix</option>
                  <option value="revert">Revert</option>
                </select>
              </div>
            </div>
          )}

          {/* Outlier Detection Section */}
          {formData.action === 'outlier' && (
            <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Outlier Detection</h3>
              <div className="mb-4">
                <label htmlFor="column" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Column
                </label>
                <input
                  type="text"
                  id="column"
                  name="column"
                  value={formData.column}
                  onChange={handleChange}
                  placeholder="Enter column name"
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
                  <option value="remove">Remove</option>
                  <option value="mean">Mean</option>
                  <option value="median">Median</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="outlier_method" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Outlier Method
                </label>
                <select
                  name="outlier_method"
                  id="outlier_method"
                  value={formData.outlier_method}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="none">None</option>
                  <option value="std_dev">Standard Deviation</option>
                  <option value="z_score">Z-Score</option>
                </select>
              </div>
            </div>
          )}

          {/* Remove Duplicates Section */}
          {formData.action === 'remove_duplicates' && (
            <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Remove Duplicates</h3>
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
                  <option value="all">All</option>
                  <option value="column">Column</option>
                </select>
              </div>
              {formData.type === 'column' && (
                <div className="mb-4">
                  <label htmlFor="column" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Column
                  </label>
                  <input
                    type="text"
                    id="column"
                    name="column"
                    value={formData.column}
                    onChange={handleChange}
                    placeholder="Enter column name"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* Fix Datatypes Section */}
          {formData.action === 'fix_datatypes' && (
            <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Fix Datatypes</h3>
              <div className="mb-4">
                <label htmlFor="column" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Column
                </label>
                <input
                  type="text"
                  id="column"
                  name="column"
                  value={formData.column}
                  onChange={handleChange}
                  placeholder="Enter column name"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="target_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Type
                </label>
                <select
                  name="target_type"
                  id="target_type"
                  value={formData.target_type}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="none">None</option>
                  <option value="int">Integer</option>
                  <option value="float">Float</option>
                  <option value="datetime">Datetime</option>
                </select>
              </div>
            </div>
          )}

          {/* Correct Data Section */}
          {formData.action === 'correct_data' && (
            <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Correct Data</h3>
              <div className="mb-4">
                <label htmlFor="column" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Column
                </label>
                <input
                  type="text"
                  id="column"
                  name="column"
                  value={formData.column}
                  onChange={handleChange}
                  placeholder="Enter column name"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="standardize_to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Standardize To
                </label>
                <select
                  name="standardize_to"
                  id="standardize_to"
                  value={formData.standardize_to}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="none">None</option>
                  <option value="lower">Lowercase</option>
                  <option value="upper">Uppercase</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {formData.standardize_to === 'custom' && (
                <div className="mb-4">
                  <label htmlFor="value" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Mapping (JSON)
                  </label>
                  <input
                    type="text"
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleChange}
                    placeholder='e.g., {"old": "new"}'
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              )}
            </div>
          )}

          {/* Standardize Data Section */}
          {formData.action === 'standardize_data' && (
            <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Standardize Data</h3>
              <div className="mb-4">
                <label htmlFor="column" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Column
                </label>
                <input
                  type="text"
                  id="column"
                  name="column"
                  value={formData.column}
                  onChange={handleChange}
                  placeholder="Enter column name"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="rule" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Conversion Rule
                </label>
                <select
                  name="rule"
                  id="rule"
                  value={formData.rule}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="none">None</option>
                  <option value="to_kg">To Kg (from pounds)</option>
                  <option value="to_meter">To Meter (from feet)</option>
                </select>
              </div>
            </div>
          )}

          {/* Remove Data Section */}
          {formData.action === 'remove_data' && (
            <div className="mb-6 p-4 border border-gray-300 dark:border-gray-600 rounded-md">
              <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-300">Remove Data</h3>
              <div className="mb-4">
                <label htmlFor="list_columns" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  List Columns (comma-separated)
                </label>
                <input
                  type="text"
                  id="list_columns"
                  name="list_columns"
                  value={formData.list_columns}
                  onChange={handleChange}
                  placeholder="e.g., col1,col2"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="list_row" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  List Rows (comma-separated indices)
                </label>
                <input
                  type="text"
                  id="list_row"
                  name="list_row"
                  value={formData.list_row}
                  onChange={handleChange}
                  placeholder="e.g., 0,1,5"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
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
                  <option value="">Preview</option>
                  <option value="fix">Fix</option>
                  <option value="revert">Revert</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || formData.action === 'none'}
            className={`w-full py-2 px-4 rounded text-white text-sm sm:text-base ${
              loading || formData.action === 'none' ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-300`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h-8z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              'Submit'
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6 text-sm sm:text-base">
            <strong>Error:</strong> {error}
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
                {formData.action === 'handel_missing_values' && (
                  <>
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
                  </>
                )}
                {formData.action === 'outlier' && (
                  <>
                    <p>
                      <strong>Outliers:</strong> {result.outliers?.length ? result.outliers.join(', ') : 'None'}
                    </p>
                    {result.z_scores && (
                      <p>
                        <strong>Z-Scores:</strong> {result.z_scores.join(', ')}
                      </p>
                    )}
                    {result.stats && (
                      <div>
                        <strong>Stats:</strong>
                        <ul className="list-disc pl-5">
                          <li>Mean: {result.stats.mean?.toFixed(2) || 'N/A'}</li>
                          <li>Std Dev: {result.stats.std?.toFixed(2) || 'N/A'}</li>
                          <li>Lower Bound: {result.stats.lower_bound?.toFixed(2) || 'N/A'}</li>
                          <li>Upper Bound: {result.stats.upper_bound?.toFixed(2) || 'N/A'}</li>
                        </ul>
                      </div>
                    )}
                    <p>
                      <strong>Outlier Indices:</strong> {result.outlier_indices?.length ? result.outlier_indices.join(', ') : 'None'}
                    </p>
                  </>
                )}
                {formData.action === 'remove_duplicates' && (
                  <p>
                    <strong>Message:</strong> {result.message || 'N/A'}
                  </p>
                )}
                {formData.action === 'remove_data' && (
                  <>
                    <p>
                      <strong>Removed Columns:</strong> {result.removed_columns || 'None'}
                    </p>
                    <p>
                      <strong>Removed Rows:</strong> {result.removed_rowes || 'None'}
                    </p>
                    <p>
                      <strong>Message:</strong> {result.message || 'N/A'}
                    </p>
                  </>
                )}
                {['fix_datatypes', 'correct_data', 'standardize_data'].includes(formData.action) && (
                  <p>
                    <strong>Message:</strong> {result.message || 'N/A'}
                  </p>
                )}
                {result.error && result.error !== 'none' && (
                  <p>
                    <strong>Error:</strong> {result.error}
                  </p>
                )}
              </div>
              {result.form_data && (
                <div className="mt-4">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-300">
                    Form Data
                  </h4>
                  <ul className="list-none space-y-1 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    {Object.entries(result.form_data).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong>{' '}
                        {Array.isArray(value) ? value.join(', ') : (value || 'N/A')}
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