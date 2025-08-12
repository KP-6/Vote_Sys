import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';

function ElectionDetail() {
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [candidate, setCandidate] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`/api/elections/${id}/`).then(res => {
      setElection(res.data);
      setLoading(false);
    });
    
    const token = localStorage.getItem('access');
    if (token) {
      axios.get('/api/my-votes/', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => {
          if (res.data.some(v => v.election.id === parseInt(id))) setVoted(true);
        });
    }
  }, [id]);

  const handleVote = async e => {
    e.preventDefault();
    setError('');
    setMessage('');
    setVoting(true);
    const token = localStorage.getItem('access');
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await axios.post('/api/vote/', { election: id, candidate }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Vote cast successfully!');
      setVoted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Voting failed');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return (
    <div className="loading">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (!election) return <div>Election not found.</div>;

  return (
    <div className="page-enter">
      <div className="card shadow-lg">
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <i className="fas fa-vote-yea fa-3x text-primary mb-3"></i>
            <h2 className="fw-bold">{election.name}</h2>
            <p className="text-muted fs-5">{election.description}</p>
          </div>
          
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-calendar-alt text-primary me-3"></i>
                <div>
                  <strong>Start Date:</strong><br/>
                  {new Date(election.start_time).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex align-items-center mb-2">
                <i className="fas fa-clock text-primary me-3"></i>
                <div>
                  <strong>End Date:</strong><br/>
                  {new Date(election.end_time).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="fw-bold mb-3">
              <i className="fas fa-users me-2"></i>Candidates
            </h4>
            <div className="row">
              {election.candidates.map(c => (
                <div className="col-md-6 col-lg-4 mb-3" key={c.id}>
                  <div className="card candidate-card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-user-circle fa-2x text-primary mb-2"></i>
                      <h6 className="card-title">{c.name}</h6>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {voted ? (
            <div className="alert alert-info d-flex align-items-center">
              <i className="fas fa-check-circle me-2"></i>
              <div>
                <strong>Thank you for voting!</strong><br/>
                You have already voted in this election.
              </div>
            </div>
          ) : (
            <div className="card bg-light">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fas fa-vote-yea me-2"></i>Cast Your Vote
                </h5>
                <form onSubmit={handleVote}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Select Candidate</label>
                    <select 
                      className="form-select" 
                      value={candidate} 
                      onChange={e => setCandidate(e.target.value)} 
                      required
                    >
                      <option value="">-- Choose a candidate --</option>
                      {election.candidates.map(c => (
                        <option value={c.id} key={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    type="submit" 
                    className="btn btn-success btn-lg w-100"
                    disabled={voting || !candidate}
                  >
                    {voting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Casting Vote...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-vote-yea me-2"></i>
                        Cast Vote
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {message && (
            <div className="alert alert-success d-flex align-items-center mt-3">
              <i className="fas fa-check-circle me-2"></i>
              {message}
            </div>
          )}
          
          {error && (
            <div className="alert alert-danger d-flex align-items-center mt-3">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <div className="text-center mt-4">
            <Link to={`/results/${election.id}`} className="btn btn-outline-secondary btn-lg">
              <i className="fas fa-chart-bar me-2"></i>View Results
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ElectionDetail;