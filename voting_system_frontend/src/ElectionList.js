import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ElectionList() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/elections/')
      .then(res => setElections(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="page-enter">
      <h2 className="mb-4 text-center text-white fw-bold">🗳️ Active Elections</h2>
      <div className="row">
        {elections.map(election => (
          <div className="col-md-6 col-lg-4 mb-4" key={election.id}>
            <div className="card h-100 election-card">
              <div className="card-body d-flex flex-column">
                <div className="election-icon mb-3 text-center">
                  <i className="fas fa-vote-yea fa-3x text-primary"></i>
                </div>
                <h5 className="card-title text-center">{election.name}</h5>
                <p className="card-text flex-grow-1">{election.description}</p>
                <div className="election-dates mb-3">
                  <small className="text-muted">
                    <i className="fas fa-calendar-alt me-2"></i>
                    <strong>From:</strong> {new Date(election.start_time).toLocaleDateString()}<br/>
                    <i className="fas fa-clock me-2"></i>
                    <strong>To:</strong> {new Date(election.end_time).toLocaleDateString()}
                  </small>
                </div>
                <div className="d-grid gap-2">
                  <Link to={`/elections/${election.id}`} className="btn btn-primary">
                    <i className="fas fa-eye me-2"></i>View & Vote
                  </Link>
                  <Link to={`/results/${election.id}`} className="btn btn-outline-secondary">
                    <i className="fas fa-chart-bar me-2"></i>View Results
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {elections.length === 0 && (
        <div className="text-center text-white">
          <i className="fas fa-inbox fa-4x mb-3"></i>
          <h4>No elections available</h4>
          <p>Check back later for new voting opportunities!</p>
        </div>
      )}
    </div>
  );
}

export default ElectionList;