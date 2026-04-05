import React, { useEffect, useState, useContext } from 'react';
import { Row, Col, Card, Badge, Button, Toast, ToastContainer } from 'react-bootstrap';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';

function Dashboard() {
  const { user, token } = useContext(AuthContext);
  const [stats, setStats] = useState({});
  const [circulars, setCirculars] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchCirculars = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/circulars', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCirculars(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    if (token) {
      fetchStats();
      fetchCirculars();
    }
  }, [token]);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    
    socket.on('new_circular', (circular) => {
      setToastMessage(`New Circular: ${circular.title}`);
      setCirculars((prev) => [circular, ...prev]);
    });

    return () => socket.disconnect();
  }, []);

  const markAsRead = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/circulars/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setCirculars(prev => prev.map(c => {
        if (c._id === id) {
          const updated = { ...c };
          if (!updated.readBy) updated.readBy = [];
          updated.readBy.push({ user: user._id, readAt: new Date() });
          return updated;
        }
        return c;
      }));

      // Update stat unread count
      if (stats.unreadCount) {
        setStats(prev => ({ ...prev, unreadCount: prev.unreadCount - 1 }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isRead = (circular) => {
    if (!circular.readBy || !user) return false;
    return circular.readBy.some(r => r.user === user._id || (r.user && r.user._id === user._id));
  };

  return (
    <div className="py-2">
      <h2 className="mb-4 fw-bold">Overview</h2>
      
      {/* Toast Notification for Socket.io */}
      <ToastContainer position="top-end" className="p-4" style={{ zIndex: 9999, position: 'fixed' }}>
        <Toast show={!!toastMessage} onClose={() => setToastMessage(null)} delay={5000} autohide className="glass-card bg-white">
          <Toast.Header>
            <strong className="me-auto text-primary">Notification</strong>
            <small>Just now</small>
          </Toast.Header>
          <Toast.Body className="fw-semibold">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Stats Section */}
      {(user?.role === 'Principal' || user?.role === 'HOD') && (
        <Row className="mb-5 g-4">
          <Col md={4}>
            <Card className="stat-card stat-primary p-4">
              <h5 className="text-white-50 mb-1">Total Circulars</h5>
              <h2 className="display-5 fw-bold mb-0">{stats.totalCirculars || 0}</h2>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card stat-success p-4">
              <h5 className="text-white-50 mb-1">Total Users</h5>
              <h2 className="display-5 fw-bold mb-0">{stats.totalUsers || 0}</h2>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="stat-card stat-info p-4">
              <h5 className="text-white-50 mb-1">New Users (7d)</h5>
              <h2 className="display-5 fw-bold mb-0">{stats.newUsers || 0}</h2>
            </Card>
          </Col>
        </Row>
      )}

      {(user?.role === 'Student') && (
         <Row className="mb-5 g-4">
           <Col md={6}>
             <Card className="stat-card stat-primary p-4">
               <h5 className="text-white-50 mb-1">Total Received</h5>
               <h2 className="display-5 fw-bold mb-0">{stats.relevantCirculars || 0}</h2>
             </Card>
           </Col>
           <Col md={6}>
             <Card className="stat-card stat-danger p-4">
               <h5 className="text-white-50 mb-1">Unread Circulars</h5>
               <h2 className="display-5 fw-bold mb-0">{stats.unreadCount || 0}</h2>
             </Card>
           </Col>
         </Row>
      )}

      {/* Circulars List Section */}
      <h4 className="fw-bold mb-3">Recent Circulars</h4>
      <Card className="glass-card">
        <Card.Body className="p-0">
          {circulars.map(circular => {
            const readStatus = isRead(circular);
            return (
              <div key={circular._id} className={`circular-item p-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center ${circular.priority === 'Urgent' ? 'circular-urgent' : ''} ${readStatus ? 'circular-read' : ''}`}>
                <div className="mb-3 mb-md-0">
                  <div className="d-flex align-items-center mb-1">
                    <h5 className="mb-0 fw-bold me-2">{circular.title}</h5>
                    {circular.priority === 'Urgent' && <Badge bg="danger" className="rounded-pill">Urgent</Badge>}
                    {!readStatus && <Badge bg="primary" className="rounded-pill ms-2">New</Badge>}
                  </div>
                  <p className="mb-1 text-muted">{circular.description}</p>
                  <small className="text-muted fw-semibold">
                    By: {circular.createdBy?.name || 'Unknown'} • {new Date(circular.createdAt).toLocaleDateString()}
                  </small>
                </div>
                
                <div className="d-flex gap-2">
                  {circular.attachments && circular.attachments.length > 0 && (
                     <Button 
                       variant="outline-secondary" 
                       size="sm" 
                       href={`http://localhost:5000${circular.attachments[0]}`}
                       target="_blank"
                     >
                       View File
                     </Button>
                  )}
                  
                  {!readStatus && (
                    <Button variant="outline-primary" size="sm" onClick={() => markAsRead(circular._id)}>
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {circulars.length === 0 && (
            <div className="p-5 text-center text-muted">
              <h5 className="fw-bold">All caught up!</h5>
              <p className="mb-0">There are no circulars to display.</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default Dashboard;
