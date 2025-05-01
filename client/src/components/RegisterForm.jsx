import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

// Same origin pe API calls honge, to relative path use karo
const API_URL = '/'; // Ye ab http://localhost:5000/ ko point karega




const registerUser = async (data) => {
  const response = await axios.post(`${API_URL}register`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};



const RegisterForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    console.log('Sending data:', data); // Debug
    try {
      const response = await registerUser(data);
      console.log('Response:', response); // Debug
      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error('Error:', error); // Debug
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium dark:text-gray-300 text-gray-700"
        >
          Username
        </label>
        <input
          id="username"
          type="text"
          {...register('username', { required: 'Username is required' })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium dark:text-gray-300 text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email address',
            },
          })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium dark:text-gray-300 text-gray-700"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        onClick={handleSubmit(onSubmit)}
        className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        Register
      </button>
    </div>
  );
};

export default RegisterForm;