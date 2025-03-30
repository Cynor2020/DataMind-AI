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
      localStorage.setItem('token', `Bearer ${response.data.token}`);
      toast.success('Login successful! Redirecting...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="login-form">
      <div className="form-group" >
        <label className="form-label">Email:</label>
        <input className="form-input"
          type="email"
          {...register('email', { required: 'Email is required' })}
        />
        {errors.email && <p>{errors.email.message}</p>}
        
      </div>
      <div className="form-group">
        <label className="form-label">Password:</label>
        <input className="form-input"
          type="password"
          {...register('password', { required: 'Password is required' })}
        />
        {errors.password && <p>{errors.password.message}</p>}
      </div>
      <br></br>
      <button type="submit" className="form-button">Login</button>
    </form>
  );
};

export default LoginForm;