import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000';

function StarRating({ rating }) {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  return (
    <span>
      {'★'.repeat(fullStars)}
      {halfStar && '☆'}
      {'☆'.repeat(emptyStars)}
    </span>
  );
}

export default function UserDashboard({ user }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [chatPractitioners, setChatPractitioners] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chattingWith, setChattingWith] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeSection, setActiveSection] = useState('modules');

  useEffect(() => {
    console.log('User prop:', user); // Debug
    if (user.lastLocation) {
      fetchModules(user.lastLocation.latitude, user.lastLocation.longitude);
    }
    fetchBookings();
    fetchChatPractitioners();
  }, [user.lastLocation]);

  useEffect(() => {
    if (!showChatModal || !chattingWith) return;
    console.log('Polling for messages with:', chattingWith); // Debug
    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found in localStorage for polling');
          return;
        }
        const res = await fetch(`${API_BASE}/api/messages/${chattingWith.practitioner._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        console.log('Polled messages:', data);
        if (data.ok) {
          setChatMessages(data.messages);
          console.log('Set chatMessages (poll):', data.messages); // Debug
        } else {
          console.error('Failed to poll messages:', data.message, data.error);
        }
      } catch (err) {
        console.error('Poll messages error:', err);
      }
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [showChatModal, chattingWith]);

  const fetchModules = async (lat, lng) => {
    try {
      const res = await fetch(`${API_BASE}/api/practitioners/practitioner-modules?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      console.log('Modules response:', data); // Debug
      if (data.ok) {
        setModules(data.modules);
      }
    } catch (err) {
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage for bookings');
        return;
      }
      const res = await fetch(`${API_BASE}/api/bookings/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('Bookings response:', data); // Debug
      if (data.ok) {
        setBookings(data.bookings);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  };

  const fetchChatPractitioners = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage for chat practitioners');
        return;
      }
      const res = await fetch(`${API_BASE}/api/messages/user/practitioners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('Chat practitioners response:', data); // Debug
      if (data.ok) {
        setChatPractitioners(data.practitioners);
        console.log('Set chatPractitioners:', data.practitioners); // Debug
      } else {
        console.error('Failed to fetch practitioners:', data.message, data.error);
      }
    } catch (err) {
      console.error('Fetch chat practitioners error:', err);
    }
  };

  const handleExpand = (id) => {
    setExpandedModuleId(id);
  };

  const handleCollapse = () => {
    setExpandedModuleId(null);
  };

  const openChat = async (practitioner) => {
    console.log('Opening chat with:', practitioner); // Debug
    setChattingWith(practitioner);
    setChatMessages([]);
    setNewMessage('');
    setShowChatModal(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage for opening chat');
        return;
      }
      const res = await fetch(`${API_BASE}/api/messages/${practitioner.practitioner._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('Messages response:', data); // Debug
      if (data.ok) {
        setChatMessages(data.messages);
        console.log('Set chatMessages:', data.messages); // Debug
      } else {
        console.error('Failed to fetch messages:', data.message, data.error);
      }
      const markReadRes = await fetch(`${API_BASE}/api/messages/mark-read/${practitioner.practitioner._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const markReadData = await markReadRes.json();
      console.log('Mark read response:', markReadData); // Debug
      if (markReadData.ok) {
        setChatPractitioners(chatPractitioners.map(p => p.practitioner._id === practitioner.practitioner._id ? { ...p, unreadCount: 0 } : p));
      }
    } catch (err) {
      console.error('Open chat error:', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage for sending message');
        return;
      }
      const payload = {
        receiver: chattingWith.practitioner._id,
        receiverRole: 'practitioner',
        message: newMessage,
      };
      console.log('Sending message:', payload); // Debug
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('Send message response:', data); // Debug
      if (data.ok) {
        setChatMessages([...chatMessages, data.message]);
        setNewMessage('');
      } else {
        console.error('Failed to send message:', data.message, data.error);
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  return (
    <div className="container mt-5">
      <h2>User Dashboard</h2>
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">Welcome, {user.name}!</h5>
          <p className="card-text"><strong>Email:</strong> {user.email}</p>
          {user.age && <p className="card-text"><strong>Age:</strong> {user.age}</p>}
          <p className="card-text"><strong>Mobile:</strong> {user.mobile}</p>
          {user.altMobile && <p className="card-text"><strong>Alt Mobile:</strong> {user.altMobile}</p>}
          {user.gender && <p className="card-text"><strong>Gender:</strong> {user.gender}</p>}
          {user.lastLocation && (
            <p className="card-text">
              <strong>Last Location:</strong> Lat: {user.lastLocation.latitude}, Lng: {user.lastLocation.longitude}
              {user.lastLocation.accuracy && ` (Accuracy: ${user.lastLocation.accuracy}m)`}
            </p>
          )}
        </div>
      </div>
      <div className="d-flex justify-content-center mb-4">
        <div className="btn-group" role="group">
          <button
            type="button"
            className={`btn ${activeSection === 'modules' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveSection('modules')}
          >
            Browse Practitioners
          </button>
          <button
            type="button"
            className={`btn ${activeSection === 'bookings' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveSection('bookings')}
          >
            My Bookings
          </button>
          <button
            type="button"
            className={`btn ${activeSection === 'chat' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setActiveSection('chat')}
          >
            Chat
          </button>
        </div>
      </div>
      {activeSection === 'modules' && (
        <>
          <h3>Top 10 Nearby Practitioner Modules</h3>
          {loading ? (
            <p>Loading modules...</p>
          ) : (
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div className="list-group">
                {modules.map(module => (
                  <div
                    key={module.id}
                    className="list-group-item mb-2"
                    onClick={() => handleExpand(module.id)}
                    onMouseEnter={() => handleExpand(module.id)}
                    onMouseLeave={() => expandedModuleId === module.id && handleCollapse()}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h5>{module.clinicName}</h5>
                        <p className="mb-0"><strong>Mobile:</strong> {module.mobile}</p>
                        <p className="mb-0"><strong>Email:</strong> {module.email}</p>
                        <p className="mb-0"><strong>Alt Mobile:</strong> {module.altMobile || 'N/A'}</p>
                        <p className="mb-0"><strong>Rating:</strong> <StarRating rating={module.rating} /></p>
                      </div>
                      <div className="d-flex align-items-center">
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const token = localStorage.getItem('token');
                              const res = await fetch(`${API_BASE}/api/bookings`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ practitionerId: module.id }),
                              });
                              const data = await res.json();
                              if (data.ok) {
                                alert('Booking request sent successfully');
                                fetchBookings(); // Refresh bookings
                              } else {
                                alert('Failed to send booking request: ' + data.error);
                              }
                            } catch (err) {
                              alert('Error sending booking request');
                              console.error('Error sending booking request:', err);
                            }
                          }}
                        >
                          Book Now
                        </button>
                        {chatPractitioners.some(p => p.practitioner._id === module.id) && (
                          <button
                            className="btn btn-info btn-sm me-2"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const practitioner = chatPractitioners.find(p => p.practitioner._id === module.id);
                              await openChat(practitioner);
                            }}
                          >
                            <i className="bi bi-chat-dots"></i> Chat
                          </button>
                        )}
                        {expandedModuleId === module.id && (
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCollapse();
                            }}
                          >
                            Escape
                          </button>
                        )}
                      </div>
                    </div>
                    {expandedModuleId === module.id && (
                      <div className="mt-3">
                        <h6>Therapies</h6>
                        {module.therapies.length === 0 ? (
                          <p>No therapies available.</p>
                        ) : (
                          <ul>
                            {module.therapies.map(t => (
                              <li key={t._id}>
                                <strong>{t.name}</strong> - ₹{t.price} - {t.time}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
      {activeSection === 'bookings' && (
        <>
          <h3 className="mt-5">My Bookings</h3>
          {bookingsLoading ? (
            <p>Loading bookings...</p>
          ) : (
            <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
              {bookings.length === 0 ? (
                <p>No bookings yet.</p>
              ) : (
                <div className="list-group">
                  {bookings.map(booking => (
                    <div key={booking._id} className="list-group-item mb-2">
                      <h5>Practitioner: {booking.practitioner.name} ({booking.practitioner.mobile})</h5>
                      <p><strong>Status:</strong> {booking.status}</p>
                      {booking.scheduledTherapies && booking.scheduledTherapies.length > 0 && (
                        <div>
                          <h6>Scheduled Therapies:</h6>
                          <ul>
                            {booking.scheduledTherapies.map(st => (
                              <li key={st.therapy._id}>
                                <strong>{st.therapy.name}</strong> - Scheduled for {new Date(st.date).toLocaleDateString()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {activeSection === 'chat' && (
        <>
          <h3 className="mt-5">Chat with Practitioners</h3>
          {chatPractitioners.length === 0 ? (
            <p>No practitioners available to chat with. Try booking a practitioner or check your messages.</p>
          ) : (
            <div className="row">
              {chatPractitioners.map((practitioner) => (
                <div key={practitioner.practitioner._id} className="col-md-4 mb-3">
                  <div
                    className="card"
                    onClick={() => openChat(practitioner)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="bi bi-person-circle" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <div>
                          <h6 className="card-title mb-1">{practitioner.practitioner.name || 'Unknown'}</h6>
                          <p className="card-text mb-1">{practitioner.practitioner.mobile || 'N/A'}</p>
                          {practitioner.unreadCount > 0 && (
                            <span className="badge bg-danger">{practitioner.unreadCount} unread</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {showChatModal && chattingWith && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-centered">
            <div className="modal-card p-3" style={{ maxWidth: '500px', height: '600px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="m-0">Chat with {chattingWith.practitioner.name || 'Unknown'}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowChatModal(false)}
                ></button>
              </div>
              <div
                style={{
                  height: '400px',
                  overflowY: 'auto',
                  border: '1px solid #ccc',
                  padding: '10px',
                  marginBottom: '10px',
                }}
              >
                {chatMessages.length === 0 ? (
                  <p>No messages yet.</p>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`mb-2 ${msg.senderRole === 'user' ? 'text-end' : ''}`}
                    >
                      <div
                        className={`d-inline-block p-2 rounded ${
                          msg.senderRole === 'user' ? 'bg-primary text-white' : 'bg-light'
                        }`}
                      >
                        {msg.message}
                      </div>
                      <small className="d-block text-muted">
                        {new Date(msg.timestamp).toLocaleString()}
                      </small>
                    </div>
                  ))
                )}
              </div>
              <div className="d-flex">
                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button className="btn btn-primary" onClick={sendMessage}>
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}