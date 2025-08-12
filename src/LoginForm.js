import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/token/', form);
      localStorage.setItem('access', res.data.access);
      localStorage.setItem('refresh', res.data.refresh);
      navigate('/elections');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="card mx-auto shadow-lg" style={{ maxWidth: 450 }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="fas fa-sign-in-alt fa-3x text-primary mb-3"></i>
            <h3 className="card-title fw-bold">Welcome Back</h3>
            <p className="text-muted">Sign in to your account</p>
          </div>
          
          {error && (
            <div className="alert alert-danger d-flex align-items-center">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                <i className="fas fa-user me-2"></i>Username
              </label>
              <input 
                type="text" 
                className="form-control" 
                name="username" 
                value={form.username} 
                onChange={handleChange} 
                required 
                placeholder="Enter your username"
              />
            </div>
            
            <div className="mb-4">
              <label className="form-label fw-semibold">
                <i className="fas fa-lock me-2"></i>Password
              </label>
              <input 
                type="password" 
                className="form-control" 
                name="password" 
                value={form.password} 
                onChange={handleChange} 
                required 
                placeholder="Enter your password"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary w-100 py-3 fw-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Signing In...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Login
                </>
              )}
            </button>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-muted">
              Don't have an account? 
              <a href="/register" className="text-decoration-none ms-1 fw-bold">Register here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;