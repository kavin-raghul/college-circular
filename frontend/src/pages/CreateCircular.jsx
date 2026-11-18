import React, { useState, useContext } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API_BASE_URL from '../config';

function CreateCircular() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Normal',
    category: 'Notice',
    targetRole: user?.role === 'HOD' ? 'Student' : 'All',
    department: user?.role === 'HOD' ? user.department : '',
    year: ''
  });
  
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'];
  const years = [1, 2, 3, 4];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('priority', formData.priority);
    data.append('category', formData.category);
    
    // Construct targetAudience object
    const targetAudience = {
      role: formData.targetRole,
      ...(formData.department && formData.targetRole !== 'All' && { department: formData.department }),
      ...(formData.year && formData.targetRole !== 'All' && { year: parseInt(formData.year) })
    };
    
    data.append('targetAudience', JSON.stringify(targetAudience));
    
    if (file) {
      data.append('attachments', file);
    }

    try {
      await axios.post(`${API_BASE_URL}/api/circulars`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create circular');
    } finally {
      setLoading(false);
    }
  };

  // Only allow Principal, HOD, Faculty
  if (user?.role === 'Student') {
    return <Alert variant="danger">Unauthorized access.</Alert>;
  }

  return (
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card className="glass-card border-0">
            <Card.Body className="p-4 p-md-5">
              <h2 className="mb-4 fw-bold">Create Circular</h2>
              
              {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
              {success && <Alert variant="success" className="rounded-3">Circular created successfully! Redirecting...</Alert>}

              <Form onSubmit={handleSubmit} className="mt-4">
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Title</Form.Label>
                  <Form.Control 
                    type="text" 
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter professional title" 
                    required 
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Description</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed explanation of the circular..." 
                    required 
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">Priority</Form.Label>
                      <Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                        <option value="Normal">Normal</option>
                        <option value="Urgent">Urgent</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">Attachment (Optional)</Form.Label>
                      <Form.Control type="file" onChange={handleFileChange} className="form-control" />
                    </Form.Group>
                  </Col>
                </Row>

                <hr className="my-4 text-muted" />
                <h5 className="mb-3 fw-bold text-primary">Target Audience Selection</h5>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-4">
                      <Form.Label className="fw-semibold">Target Role</Form.Label>
                      <Form.Select name="targetRole" value={formData.targetRole} onChange={handleChange}>
                        {user.role === 'Principal' && <option value="All">All Users (College-wide)</option>}
                        <option value="Student">Students Only</option>
                        <option value="Faculty">Faculty Only</option>
                        {user.role === 'Principal' && <option value="HOD">HODs Only</option>}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-4">
                       <Form.Label className="fw-semibold">Department</Form.Label>
                       <Form.Select 
                         name="department" 
                         value={formData.department} 
                         onChange={handleChange}
                         disabled={user?.role === 'HOD'} // HODs fixed to their dept
                       >
                         {user.role !== 'HOD' && <option value="">All Departments</option>}
                         {departments.map(dept => (
                           <option key={dept} value={dept}>{dept}</option>
                         ))}
                       </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-4">
                       <Form.Label className="fw-semibold">Batch / Year</Form.Label>
                       <Form.Select 
                         name="year" 
                         value={formData.year} 
                         onChange={handleChange}
                         disabled={formData.targetRole === 'All'}
                       >
                         <option value="">All Years</option>
                         {years.map(y => (
                           <option key={y} value={y}>Year {y}</option>
                         ))}
                       </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-grid mt-4">
                  <Button variant="primary" type="submit" disabled={loading} size="lg">
                    {loading ? 'Publishing...' : 'Publish Circular'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default CreateCircular;
