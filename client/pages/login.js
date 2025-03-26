import LoginForm from '../components/LoginForm';
import '../styles/Login.css'; // Custom CSS file import karo

export default function Register() {
  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Login to DataMind-AI</h1>
        <LoginForm />
        <p className="register-login-link">
          Dont have an account?{' '}
          <a href="/register" className="login-link">
            Register Hear
          </a>
        </p>
      </div>
    </div>
  );
}