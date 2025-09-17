import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';

function ResultsPage() {
  const { id } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setLocked(false);
    setLoading(true);
    axios.get(`/api/results/${id}/`).then(res => {
      setResults(res.data);
      setLoading(false);
    }).catch(err => {
      if (err.response && err.response.status === 403) {
        setLocked(true);
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="loading">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (locked) return (
    <div className="page-enter">
      <div className="card shadow-lg">
        <div className="card-body p-5 text-center">
          <i className="fas fa-lock fa-3x text-warning mb-3"></i>
          <h3 className="fw-bold">Results Locked</h3>
          <p className="text-muted">Results will be available after the election ends.</p>
          <div className="mt-3">
            <Link to={`/elections/${id}`} className="btn btn-primary btn-lg">
              <i className="fas fa-vote-yea me-2"></i>Go to Election
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  if (!results) return (
    <div className="text-center text-white">
      <i className="fas fa-exclamation-triangle fa-4x mb-3"></i>
      <h4>No results found</h4>
      <p>This election may not exist or has no votes yet.</p>
    </div>
  );

  const totalVotes = results.candidates.reduce((sum, c) => sum + c.votes, 0);
  const maxVotes = Math.max(...results.candidates.map(c => c.votes));
  const numWithMax = results.candidates.filter(c => c.votes === maxVotes).length;
  const isTie = maxVotes > 0 && numWithMax > 1;
  const winner = isTie ? null : results.candidates.find(c => c.votes === maxVotes);

  return (
    <div className="page-enter">
      <div className="card shadow-lg">
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="fas fa-chart-bar fa-3x text-primary mb-3"></i>
            <h2 className="fw-bold">Election Results</h2>
            <h4 className="text-muted">{results.name}</h4>
          </div>

          {totalVotes > 0 && (
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card bg-primary text-white text-center">
                  <div className="card-body">
                    <i className="fas fa-users fa-2x mb-2"></i>
                    <h5>Total Votes</h5>
                    <h3 className="fw-bold">{totalVotes}</h3>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className={`card ${isTie ? 'bg-warning' : 'bg-success'} text-white text-center`}>
                  <div className="card-body">
                    <i className={`fas ${isTie ? 'fa-balance-scale' : 'fa-trophy'} fa-2x mb-2`}></i>
                    <h5>{isTie ? 'Tie' : 'Winner'}</h5>
                    <h6 className="fw-bold">{isTie ? 'Multiple candidates' : (winner?.name || '—')}</h6>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card bg-info text-white text-center">
                  <div className="card-body">
                    <i className="fas fa-candidates fa-2x mb-2"></i>
                    <h5>Candidates</h5>
                    <h3 className="fw-bold">{results.candidates.length}</h3>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th><i className="fas fa-user me-2"></i>Candidate</th>
                  <th><i className="fas fa-vote-yea me-2"></i>Votes</th>
                  <th><i className="fas fa-percentage me-2"></i>Percentage</th>
                  <th><i className="fas fa-chart-line me-2"></i>Progress</th>
                </tr>
              </thead>
              <tbody>
                {results.candidates.map(c => {
                  const percentage = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
                  const isRowWinner = !isTie && c.votes === maxVotes && maxVotes > 0;
                  return (
                    <tr key={c.id} className={isRowWinner ? 'table-success' : ''}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-user-circle fa-2x text-primary me-3"></i>
                          <div>
                            <strong>{c.name}</strong>
                            {isRowWinner && (
                              <span className="badge bg-success ms-2">
                                <i className="fas fa-crown me-1"></i>Winner
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="fs-5">{c.votes}</strong>
                      </td>
                      <td>
                        <strong>{percentage}%</strong>
                      </td>
                      <td>
                        <div className="progress" style={{ height: '25px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            style={{ width: `${percentage}%` }}
                            role="progressbar"
                          >
                            {percentage}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalVotes === 0 && (
            <div className="text-center mt-4">
              <i className="fas fa-inbox fa-4x text-muted mb-3"></i>
              <h5 className="text-muted">No votes cast yet</h5>
              <p className="text-muted">Be the first to vote in this election!</p>
            </div>
          )}

          <div className="text-center mt-4">
            <Link to="/elections" className="btn btn-outline-primary btn-lg me-3">
              <i className="fas fa-arrow-left me-2"></i>Back to Elections
            </Link>
            <Link to={`/elections/${id}`} className="btn btn-primary btn-lg">
              <i className="fas fa-vote-yea me-2"></i>Vote Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;