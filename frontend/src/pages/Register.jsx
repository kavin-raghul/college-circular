import React, { useState, useContext } from 'react';
import { Form, Button, Card, Container, Alert, Row, Col } from 'react-bootstrap';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Student', // Default role
    department: '',
    year: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Information Technology'];
  const years = [1, 2, 3, 4];

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Reset specific fields if role changes
    if (name === 'role') {
      if (value === 'Principal') {
        setFormData({ ...formData, role: value, department: '', year: '' });
      } else if (value === 'HOD' || value === 'Faculty') {
        setFormData({ ...formData, role: value, year: '' });
      } else {
        setFormData({ ...formData, role: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const payload = { ...formData };
    
    // Remove empty strings so Mongoose doesn't try to cast '' to Number
    if (payload.year === '') delete payload.year;
    if (payload.department === '') delete payload.department;
    
    if (payload.role === 'Student' && payload.year) {
       payload.year = parseInt(payload.year);
    }

    try {
      await register(payload);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center py-5" style={{ minHeight: '90vh' }}>
      <Card style={{ width: '500px' }} className="glass-card border-0">
        <Card.Body className="p-4 p-md-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary mb-2">Create Account</h2>
            <p className="text-muted">Join the Smart Circular System</p>
          </div>
          
          {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Full Name</Form.Label>
              <Form.Control 
                type="text" 
                name="name"
                placeholder="Enter your full name" 
                value={formData.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Email address</Form.Label>
              <Form.Control 
                type="email" 
                name="email"
                placeholder="college@example.edu" 
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Role</Form.Label>
                  <Form.Select name="role" value={formData.role} onChange={handleChange}>
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="HOD">HOD</option>
                    <option value="Principal">Principal</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    name="password"
                    placeholder="Min 6 chars" 
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Dynamic Fields based on Role */}
            {formData.role !== 'Principal' && (
              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold">Department</Form.Label>
                <Form.Select 
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required={formData.role !== 'Principal'}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                     <option key={dept} value={dept}>{dept}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {formData.role === 'Student' && (
              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold">Academic Batch (Year)</Form.Label>
                <Form.Select 
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required={formData.role === 'Student'}
                >
                  <option value="">Select Year</option>
                  {years.map((y) => (
                     <option key={y} value={y}>Year {y}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}
            
            <Button variant="primary" type="submit" className="w-100 mt-2 mb-4" size="lg" disabled={loading}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <div className="text-center text-muted">
              Already have an account? <Link to="/login" className="fw-bold text-primary text-decoration-none">Login here</Link>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default Register;
