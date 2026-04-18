import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Link } from 'react-router-dom';
import { loginWithEmail, loginWithGoogleCredential } from './auth';

function Login({ onLoginSuccess }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const result = await loginWithEmail(formData);  // now async
    if (!result.ok) { setError(result.error); return; }
    onLoginSuccess(result.session);
  };

  // Also update handleSuccess for Google:
  const handleSuccess = async (credentialResponse) => {
    const result = await loginWithGoogleCredential(credentialResponse);
    if (!result.ok) {
      setError(result.error || "Invalid email or password");
      return;
    }
    onLoginSuccess(result.session);
  };


  const handleError = () => {
    setError('Google login failed. Try email and password.');
  };

  return (
    <div className="auth-wrapper">
      <div className="card auth-card animate-slide-up">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to your Quantity Measurement Account</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              placeholder="Enter password"
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit-btn">
            Login With Email
          </button>
        </form>

        <div className="google-btn-wrapper">
          <GoogleLogin
            key="google-login"
            onSuccess={handleSuccess}
            onError={handleError}
            shape="rectangular"
            theme="outline"
            size="large"
            text="signin_with"
          />
        </div>

        <div className="auth-divider">OR</div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
