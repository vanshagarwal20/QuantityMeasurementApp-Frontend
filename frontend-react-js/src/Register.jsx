import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';
import { loginWithGoogleCredential, registerWithEmail } from './auth';

function Register({ onRegisterSuccess }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const result = await registerWithEmail(formData);  // now async
    if (!result.ok) { setError(result.error); return; }
    onRegisterSuccess(result.session);
  };


  const handleSuccess = async (credentialResponse) => {
    const result = await loginWithGoogleCredential(credentialResponse);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    onRegisterSuccess(result.session);
  };

  const handleError = () => {
    setError('Google signup failed. Try email signup.');
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card animate-slide-up">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Sign up to start measuring quantities easily</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              required
              minLength={2}
              value={formData.name}
              onChange={handleInputChange}
              className="auth-input"
              placeholder="Your full name"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="auth-input"
              placeholder="you@example.com"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleInputChange}
              className="auth-input"
              placeholder="Create password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit-btn">
            Sign Up With Email
          </button>
        </form>

        <div className="google-btn-wrapper">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={handleError}
            shape="rectangular"
            theme="filled_blue"
            size="large"
            text="signup_with"
          />
        </div>

        <div className="auth-divider">ALREADY A MEMBER?</div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          <Link to="/login">Sign in to your account</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
