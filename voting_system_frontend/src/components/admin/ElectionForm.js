import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaPlus, FaTrash } from 'react-icons/fa';
import api from '../../services/api';

const ElectionForm = ({ show, onHide, election, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_time: '',
    end_time: '',
    voting_start_time: '08:00',
    voting_end_time: '20:00',
    election_type: 'single_choice',
    visibility: 'public',
    max_votes_per_voter: 1,
    require_confirmation: true,
    candidates: [{ name: '', description: '', position: '', order: 0 }]
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (election) {
      // Format dates for datetime-local input
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      setFormData({
        name: election.name || '',
        description: election.description || '',
        start_time: election.start_time ? formatDate(election.start_time) : '',
        end_time: election.end_time ? formatDate(election.end_time) : '',
        voting_start_time: election.voting_start_time || '08:00',
        voting_end_time: election.voting_end_time || '20:00',
        election_type: election.election_type || 'single_choice',
        visibility: election.visibility || 'public',
        max_votes_per_voter: election.max_votes_per_voter || 1,
        require_confirmation: election.require_confirmation !== undefined ? election.require_confirmation : true,
        candidates: election.candidates?.length 
          ? election.candidates.map(c => ({
              id: c.id,
              name: c.name || '',
              description: c.description || '',
              position: c.position || '',
              order: c.order || 0
            }))
          : [{ name: '', description: '', position: '', order: 0 }]
      });
    } else {
      // Reset form when creating a new election
      setFormData({
        name: '',
        description: '',
        start_time: '',
        end_time: '',
        voting_start_time: '08:00',
        voting_end_time: '20:00',
        election_type: 'single_choice',
        visibility: 'public',
        max_votes_per_voter: 1,
        require_confirmation: true,
        candidates: [{ name: '', description: '', position: '', order: 0 }]
      });
    }
    setErrors({});
    setFormError('');
  }, [election, show]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCandidateChange = (index, e) => {
    const { name, value } = e.target;
    const newCandidates = [...formData.candidates];
    newCandidates[index] = {
      ...newCandidates[index],
      [name]: name === 'order' ? parseInt(value, 10) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      candidates: newCandidates
    }));
  };

  const addCandidate = () => {
    setFormData(prev => ({
      ...prev,
      candidates: [
        ...prev.candidates,
        { name: '', description: '', position: '', order: prev.candidates.length }
      ]
    }));
  };

  const removeCandidate = (index) => {
    if (formData.candidates.length <= 1) return;
    
    const newCandidates = formData.candidates.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      candidates: newCandidates
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Election name is required';
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    } else if (new Date(formData.start_time) >= new Date(formData.end_time)) {
      newErrors.end_time = 'End time must be after start time';
    }
    
    // Validate candidates
    const candidateErrors = [];
    formData.candidates.forEach((candidate, index) => {
      if (!candidate.name.trim()) {
        candidateErrors[index] = { name: 'Candidate name is required' };
      }
    });
    
    if (candidateErrors.length > 0) {
      newErrors.candidates = candidateErrors;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setFormError('');
      
      // Format the data for the API
      const dataToSend = {
        ...formData,
        candidates: formData.candidates.map((c, index) => ({
          ...c,
          order: c.order || index
        }))
      };
      
      if (election) {
        // Update existing election
        await api.put(`/admin/elections/${election.id}/`, dataToSend);
      } else {
        // Create new election
        await api.post('/admin/elections/', dataToSend);
      }
      
      onSave();
      onHide();
    } catch (err) {
      console.error('Error saving election:', err);
      setFormError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'An error occurred while saving the election. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{election ? 'Edit Election' : 'Create New Election'}</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group controlId="formName">
                <Form.Label>Election Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  isInvalid={!!errors.name}
                  placeholder="Enter election name"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="formElectionType">
                <Form.Label>Election Type</Form.Label>
                <Form.Select
                  name="election_type"
                  value={formData.election_type}
                  onChange={handleChange}
                >
                  <option value="single_choice">Single Choice</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="ranked_choice">Ranked Choice</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="formDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter election description"
            />
          </Form.Group>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formStartTime">
                <Form.Label>Start Time <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  isInvalid={!!errors.start_time}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.start_time}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formEndTime">
                <Form.Label>End Time <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="datetime-local"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  isInvalid={!!errors.end_time}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.end_time}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formVotingStartTime">
                <Form.Label>Voting Hours: Start</Form.Label>
                <Form.Control
                  type="time"
                  name="voting_start_time"
                  value={formData.voting_start_time}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formVotingEndTime">
                <Form.Label>Voting Hours: End</Form.Label>
                <Form.Control
                  type="time"
                  name="voting_end_time"
                  value={formData.voting_end_time}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="formMaxVotes">
                <Form.Label>Max Votes per Voter</Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  name="max_votes_per_voter"
                  value={formData.max_votes_per_voter}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group controlId="formVisibility" className="mt-4">
                <Form.Check
                  type="checkbox"
                  label="Require Confirmation"
                  name="require_confirmation"
                  checked={formData.require_confirmation}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>
          </Row>

          <hr className="my-4" />
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Candidates <span className="text-danger">*</span></h5>
            <Button variant="outline-primary" size="sm" onClick={addCandidate}>
              <FaPlus className="me-1" /> Add Candidate
            </Button>
          </div>
          
          {formData.candidates.map((candidate, index) => (
            <div key={index} className="candidate-card mb-3 p-3 border rounded">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="mb-0">Candidate #{index + 1}</h6>
                {formData.candidates.length > 1 && (
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={() => removeCandidate(index)}
                    title="Remove candidate"
                  >
                    <FaTrash />
                  </Button>
                )}
              </div>
              
              <Row>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={candidate.name}
                      onChange={(e) => handleCandidateChange(index, e)}
                      isInvalid={errors.candidates?.[index]?.name}
                      placeholder="Candidate name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.candidates?.[index]?.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Position</Form.Label>
                    <Form.Control
                      type="text"
                      name="position"
                      value={candidate.position}
                      onChange={(e) => handleCandidateChange(index, e)}
                      placeholder="Position"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Order</Form.Label>
                    <Form.Control
                      type="number"
                      name="order"
                      value={candidate.order}
                      onChange={(e) => handleCandidateChange(index, e)}
                      placeholder="0"
                    />
                  </Form.Group>
                </Col>
              </Row>
              
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="description"
                  value={candidate.description}
                  onChange={(e) => handleCandidateChange(index, e)}
                  placeholder="Candidate description"
                />
              </Form.Group>
            </div>
          ))}
          
          {errors.candidates && typeof errors.candidates === 'string' && (
            <Alert variant="danger" className="mt-2">{errors.candidates}</Alert>
          )}
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Saving...
              </>
            ) : election ? (
              'Update Election'
            ) : (
              'Create Election'
            )}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default ElectionForm;
