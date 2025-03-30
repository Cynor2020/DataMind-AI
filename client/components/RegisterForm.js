import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { registerUser } from '../lib/api';

const RegisterForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const router = useRouter();

  const onSubmit = async (data) => {
    try {
      const response = await registerUser(data);
      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="register-form">
      <div className="form-group">
        <label htmlFor="username" className="form-label">
          Username
        </label>
        <input
          id="username"
          type="text"
          {...register('username', { required: 'Username is required' })}
          className="form-input"
        />
        {errors.username && <p className="form-error">{errors.username.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
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
          className="form-input"
        />
        {errors.email && <p className="form-error">{errors.email.message}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Password
        </label>
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

      <button type="submit" className="form-button">
        Register
      </button>
    </form>
  );
};

export default RegisterForm;