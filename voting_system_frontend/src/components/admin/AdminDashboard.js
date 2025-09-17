import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Button, Table, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaPlay, FaStop } from 'react-icons/fa';
import ElectionForm from './ElectionForm';
import api from '../../services/api';

const AdminDashboard = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [currentElection, setCurrentElection] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
  const navigate = useNavigate();

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/elections/');
      setElections(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch elections. Please try again.');
      console.error('Error fetching elections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (election) => {
    setCurrentElection(election);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/elections/${id}/`);
        fetchElections();
      } catch (err) {
        setError('Failed to delete election. Please try again.');
        console.error('Error deleting election:', err);
      }
    }
  };

  const handleLaunch = async (id) => {
    try {
      await api.post(`/admin/elections/${id}/launch/`);
      fetchElections();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to launch election. Please try again.');
      console.error('Error launching election:', err);
    }
  };

  const handleClose = async (id) => {
    try {
      await api.post(`/admin/elections/${id}/close/`);
      fetchElections();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to close election. Please try again.');
      console.error('Error closing election:', err);
    }
  };

  const filteredElections = elections.filter(election => {
    const now = new Date();
    const endTime = new Date(election.end_time);
    
    if (activeTab === 'active') {
      return election.is_active && endTime > now;
    } else if (activeTab === 'upcoming') {
      return !election.is_active && new Date(election.start_time) > now;
    } else if (activeTab === 'completed') {
      return endTime <= now;
    }
    return true;
  });

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Election Management</h2>
        <Button variant="primary" onClick={() => {
          setCurrentElection(null);
          setShowForm(true);
        }}>
          <FaPlus className="me-2" /> Create Election
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-4"
      >
        <Tab eventKey="active" title="Active" />
        <Tab eventKey="upcoming" title="Upcoming" />
        <Tab eventKey="completed" title="Completed" />
        <Tab eventKey="all" title="All Elections" />
      </Tabs>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Title</th>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Status</th>
              <th>Candidates</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredElections.length > 0 ? (
              filteredElections.map((election) => (
                <tr key={election.id}>
                  <td>{election.name}</td>
                  <td>{new Date(election.start_time).toLocaleString()}</td>
                  <td>{new Date(election.end_time).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${election.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {election.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{election.candidates?.length || 0}</td>
                  <td>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => handleEdit(election)}
                        title="Edit"
                      >
                        <FaEdit />
                      </Button>
                      {election.is_active ? (
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          onClick={() => handleClose(election.id)}
                          title="Close Election"
                        >
                          <FaStop />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          onClick={() => handleLaunch(election.id)}
                          disabled={new Date(election.end_time) <= new Date()}
                          title="Launch Election"
                        >
                          <FaPlay />
                        </Button>
                      )}
                      <Button 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => handleDelete(election.id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center">
                  No elections found.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      )}

      <ElectionForm 
        show={showForm}
        onHide={() => setShowForm(false)}
        election={currentElection}
        onSave={() => {
          setShowForm(false);
          fetchElections();
        }}
      />
    </Container>
  );
};

export default AdminDashboard;
