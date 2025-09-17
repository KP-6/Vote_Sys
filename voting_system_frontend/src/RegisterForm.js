import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

function RegisterForm() {
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    phone: '', 
    date_of_birth: null 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [ageValid, setAgeValid] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    password: false,
    date_of_birth: false
  });
  const navigate = useNavigate();

  // Check if user is 18 or older
  const calculateAge = (birthDate) => {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    return age;
  };

  // Validate age when date of birth changes
  useEffect(() => {
    if (form.date_of_birth) {
      const age = calculateAge(form.date_of_birth);
      setAgeValid(age >= 18);
    } else {
      setAgeValid(false);
    }
  }, [form.date_of_birth]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm({ ...form, [name]: value });
    // Mark field as touched when it changes
    if (name in touched) {
      setTouched({ ...touched, [name]: true });
    }
  };

  const handleDateChange = (date) => {
    setTouched({ ...touched, date_of_birth: true });
    setForm({ ...form, date_of_birth: date });
  };

  const validateForm = () => {
    const newTouched = {};
    let isValid = true;
    
    // Mark all required fields as touched
    ['username', 'password', 'date_of_birth'].forEach(field => {
      newTouched[field] = true;
    });
    
    setTouched(prev => ({ ...prev, ...newTouched }));
    
    // Check if required fields are filled
    if (!form.username.trim()) {
      setError('Username is required');
      isValid = false;
    } else if (!form.password) {
      setError('Password is required');
      isValid = false;
    } else if (!form.date_of_birth) {
      setError('Date of birth is required');
      isValid = false;
    } else if (!ageValid) {
      setError('You must be 18 years or older to register.');
      isValid = false;
    }
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Format date to YYYY-MM-DD for the API
      const formattedDate = form.date_of_birth.toISOString().split('T')[0];
      const formData = { ...form, date_of_birth: formattedDate };
      
      const response = await axios.post('/api/register/', formData);
      
      if (response.data && response.data.success) {
        setError('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      if (err.response?.data?.username) {
        setError(`Username: ${err.response.data.username[0]}`);
      } else if (err.response?.data?.email) {
        setError(`Email: ${err.response.data.email[0]}`);
      } else if (err.response?.data?.date_of_birth) {
        setError(`Date of Birth: ${err.response.data.date_of_birth[0]}`);
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Registration failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="card mx-auto shadow-lg" style={{ maxWidth: 450 }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="fas fa-user-plus fa-3x text-primary mb-3"></i>
            <h3 className="card-title fw-bold">Create Account</h3>
            <p className="text-muted">Join our voting community</p>
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
                <i className="fas fa-user me-2"></i>Username <span className="text-danger">*</span>
              </label>
              <input 
                type="text" 
                className={`form-control ${touched.username && !form.username.trim() ? 'is-invalid' : ''}`}
                name="username" 
                value={form.username} 
                onChange={handleChange}
                onBlur={() => setTouched({...touched, username: true})}
                placeholder="Enter your username"
              />
              {touched.username && !form.username.trim() && (
                <div className="invalid-feedback">
                  Username is required
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                <i className="fas fa-phone me-2"></i>Phone number
              </label>
              <input
                type="tel"
                className="form-control"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">
                <i className="fas fa-envelope me-2"></i>Email
              </label>
              <input 
                type="email" 
                className="form-control" 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                placeholder="Enter your email"
              />
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">
                <i className="fas fa-lock me-2"></i>Password <span className="text-danger">*</span>
              </label>
              <input 
                type="password" 
                className={`form-control ${touched.password && !form.password ? 'is-invalid' : ''}`}
                name="password" 
                value={form.password} 
                onChange={handleChange}
                onBlur={() => setTouched({...touched, password: true})}
                placeholder="Enter your password"
              />
              {touched.password && !form.password && (
                <div className="invalid-feedback">
                  Password is required
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold d-block">
                <i className="fas fa-calendar-alt me-2"></i>Date of Birth
                <span className="text-danger">*</span>
              </label>
              <DatePicker
                selected={form.date_of_birth}
                onChange={handleDateChange}
                dateFormat="yyyy-MM-dd"
                className={`form-control ${touched.date_of_birth && !ageValid && form.date_of_birth ? 'is-invalid' : ''} ${touched.date_of_birth && ageValid ? 'is-valid' : ''}`}
                placeholderText="Select your date of birth"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                maxDate={new Date()}
                showMonthDropdown
                showDisabledMonthNavigation
                required
              />
              {touched.date_of_birth && form.date_of_birth && !ageValid && (
                <div className="invalid-feedback d-block">
                  You must be 18 years or older to register.
                </div>
              )}
              {touched.date_of_birth && ageValid && form.date_of_birth && (
                <div className="valid-feedback d-block">
                  You are {calculateAge(form.date_of_birth)} years old. You can register!
                </div>
              )}
            </div>
            <button 
              type="submit" 
              className="btn btn-primary w-100 py-3 fw-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  Register
                </>
              )}
            </button>
          </form>
          
          <div className="text-center mt-4">
            <p className="text-muted">
              Already have an account? 
              <a href="/login" className="text-decoration-none ms-1 fw-bold">Login here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;