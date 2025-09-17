import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

axios.defaults.baseURL = 'http://127.0.0.1:8000';
const existing = localStorage.getItem('access');
if (existing) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${existing}`;
}
axios.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      delete axios.defaults.headers.common['Authorization'];
    }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

reportWebVitals();
