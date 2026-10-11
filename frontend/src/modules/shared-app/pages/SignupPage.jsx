import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BrainCircuit, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';

import { signupUser } from '../services/authApi';
import useStore from '../utils/useStore';

const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'admin', label: 'Admin' },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const { setAuthenticatedUser } = useStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError('');
    try {
      const response = await signupUser({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role,
      });
      setAuthenticatedUser(response.user);
      navigate(role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (submitError) {
      console.error('Signup failed', submitError);
      setError(submitError?.response?.data?.detail || 'Signup failed. Please try again.');
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
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-copy">
              Register a student or admin account to enter the correct side of the system.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Full Name</span>
            <div className="auth-input-wrap">
              {/* <UserRound size={17} className="text-primary" /> */}
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
                className="auth-input"
                required
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Email</span>
            <div className="auth-input-wrap">
              {/* <Mail size={17} className="text-primary" /> */}
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
              {/* <LockKeyhole size={17} className="text-primary" /> */}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Choose a password"
                className="auth-input"
                required
              />
            </div>
          </label>

          <div className="auth-field">
            <span>Account Type</span>
            <div className="auth-role-grid">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  className={`auth-role-card ${role === option.value ? 'is-active' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={isSubmitting} className="auth-primary-button">
            {isSubmitting ? 'Creating...' : 'Create Account'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="auth-footer-line">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default SignupPage;
