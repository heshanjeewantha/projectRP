import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BrainCircuit, LockKeyhole, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

import { loginUser } from '../services/authApi';
import useStore from '../utils/useStore';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    try {
      const response = await loginUser({
        email: email.trim(),
        password,
      });
      setAuthenticatedUser(response.user);
      navigate(response.user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (submitError) {
      console.error('Login failed', submitError);
      setError(submitError?.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card"
      >
        <div className="auth-brand">
          <div className="auth-brand-icon">
            <BrainCircuit size={26} />
          </div>
          <div>
            <div className="auth-kicker">SignLearn AI</div>
            <h1 className="auth-title">Login</h1>
            <p className="auth-copy">
              Login as a student to access the learning system or as an admin to manage the platform.
            </p>
          </div>
        </div>

        <div className="auth-demo-box">
          <div>Admin demo: <span className="text-white">admin@signlearn.ai / admin123</span></div>
          <div>Student demo: <span className="text-white">student@signlearn.ai / student123</span></div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-wrap">
              {/* <Mail size={17} className="shrink-0 text-primary" /> */}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Enter your email"
                className="auth-input"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrap">
              {/* <LockKeyhole size={17} className="shrink-0 text-primary" /> */}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="auth-input"
                required
              />
            </div>
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={isSubmitting} className="auth-primary-button">
            {isSubmitting ? 'Signing in...' : 'Login'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer-line">
          Don&apos;t have an account? <Link to="/signup">Create account</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
