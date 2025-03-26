import RegisterForm from '../components/RegisterForm';
import '../styles/Register.css'; // Custom CSS file import karo

export default function Register() {
  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Register to DataMind-AI</h1>
        <RegisterForm />
        <p className="register-login-link">
          Already have an account?{' '}
          <a href="/login" className="login-link">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}