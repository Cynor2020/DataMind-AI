import styles from '../styles/Register.module.css'; // ✅ Import CSS module
import RegisterForm from '../components/RegisterForm';

export default function Register() {
  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <h1 className={styles.registerTitle}>Register to DataMind-AI</h1>
        <RegisterForm />
        <p className={styles.registerLoginLink}>
          Already have an account?{' '}
          <a href="/login" className={styles.loginLink}>
            Login here
          </a>
        </p>
      </div>
    </div>
  );
}
