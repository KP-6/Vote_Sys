import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import ElectionList from './ElectionList';
import ElectionDetail from './ElectionDetail';
import ResultsPage from './ResultsPage';

function Navbar() {
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem('access');
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
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link className="nav-link" to="/elections">Elections</Link>
            </li>
            {isAuth ? (
              <>
                <li className="nav-item">
                  <button className="btn btn-link nav-link" onClick={handleLogout}>Logout</button>
                </li>
              </>
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

function App() {
  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/elections" element={<ElectionList />} />
          <Route path="/elections/:id" element={<ElectionDetail />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/elections" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
