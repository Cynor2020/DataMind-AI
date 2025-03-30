import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post(`${API_URL}/login`, data);
      localStorage.setItem('token', response.data.token);  // Token store karo
      toast.success('Login successful! Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="register-form">
      <div className="form-group">
        <label htmlFor="email" className="form-label">Email</label>
        <input
          id="email"
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email address' },
          })}
          className="form-input"
        />
        {errors.email && <p className="form-error">{errors.email.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">Password</label>
        <input
          id="password"
          type="password"
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 6, message: 'Password must be at least 6 characters' },
          })}
          className="form-input"
        />
        {errors.password && <p className="form-error">{errors.password.message}</p>}
      </div>

      <button type="submit" className="form-button">Login</button>
    </form>
  );
};

export default LoginForm;