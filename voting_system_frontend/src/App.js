import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import ElectionList from './ElectionList';
import ElectionDetail from './ElectionDetail';
import ResultsPage from './ResultsPage';
import AdminDashboard from './components/admin/AdminDashboard';
import api from './services/api';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const isAuth = !!localStorage.getItem('access');
  
  // Check if user is admin when auth status changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      console.log('checkAdminStatus called, isAuth:', isAuth);
      
      if (isAuth) {
        console.log('User is authenticated, checking admin status...');
        
        // Try to get user details from the correct endpoint
        try {
          console.log('Fetching user details from /user/');
          const response = await api.get('/user/');
          console.log('User details response:', response.data);
          const isUserAdmin = response.data.role === 'admin' || response.data.is_superuser;
          console.log('User is admin:', isUserAdmin);
          setIsAdmin(isUserAdmin);
        } catch (error) {
          console.error('Error fetching user details:', error);
          console.log('Setting isAdmin to false due to error');
          setIsAdmin(false);
        }
      } else {
        console.log('User is not authenticated, setting isAdmin to false');
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [isAuth, location]);
  
  // Log when isAdmin changes
  useEffect(() => {
    console.log('isAdmin state changed to:', isAdmin);
  }, [isAdmin]);
  
  // Log the current authentication state
  console.log('Navbar rendering - isAuth:', isAuth, 'isAdmin:', isAdmin);
  
  const handleLogout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-4">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/elections">Voting System</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/elections">Elections</Link>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">Admin Dashboard</Link>
              </li>
            )}
          </ul>
          <ul className="navbar-nav mb-2 mb-lg-0">
            {isAuth ? (
              <li className="nav-item">
                <button className="btn btn-link nav-link" onClick={handleLogout}>Logout</button>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

// Protected Route component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access');
      
      if (!token) {
        setIsAuthorized(false);
        setIsLoading(false);
        return;
      }

      try {
        // Check if user is authenticated
        const response = await api.get('/user/');
        
        if (adminOnly && response.data.role !== 'admin' && !response.data.is_superuser) {
          setIsAuthorized(false);
        } else {
          setIsAuthorized(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate, adminOnly]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  return children;
};

function App() {
  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          
          {/* Public routes */}
          <Route path="/elections" element={<ElectionList />} />
          <Route path="/elections/:id" element={<ElectionDetail />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          
          {/* Admin protected routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/elections" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
