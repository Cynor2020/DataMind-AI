import React, { useState } from 'react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('email', email);
      formData.append('password', password);
      if (photo) {
        formData.append('photo', photo);
      }

      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setMessage('Registration successful! Redirecting to Login...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (error) {
      setMessage('Error connecting to server');
      console.error('Fetch error:', error);
    }
  };

  const handlePhotoChange = (e) => {
    setPhoto(e.target.files[0]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-800 text-black dark:text-white transition-colors duration-300 p-6">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-blue-400 rounded-md p-8 shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center text-black dark:text-white">Register</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-black dark:text-white">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black dark:text-white">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black dark:text-white">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-black dark:text-white">Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-black dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors duration-200"
          >
            Register
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-black dark:text-white">{message}</p>}
        <p className="mt-4 text-center text-sm text-black dark:text-white">
          Already have an account? <a href="/login" className="text-blue-500 hover:underline">Login</a>
        </p>
      </div>
    </div>
  );
};

export default Register;