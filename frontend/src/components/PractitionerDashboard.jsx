import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000';

export default function PractitionerDashboard({ practitioner }) {
  const [therapies, setTherapies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTherapy, setEditingTherapy] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', price: '', time: '', videoUrl: '', maxPatientsPerDay: 5, preMedications: [], postMedications: [] });
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingBooking, setSchedulingBooking] = useState(null);
  const [availableDates, setAvailableDates] = useState({});
  const [scheduledTherapies, setScheduledTherapies] = useState([]);
  const [chatUsers, setChatUsers] = useState([]);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chattingWith, setChattingWith] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeSection, setActiveSection] = useState('therapies'); // 'therapies', 'chat'

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTherapies();
    fetchNotifications();
    fetchChatUsers();
  }, []);

  const fetchTherapies = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/therapies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setTherapies(data.therapies);
      }
    } catch (err) {
      console.error('Fetch therapies error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setNotifications(data.bookings);
        setUnreadCount(data.bookings.length);
      }
    } catch (err) {
      console.error('Fetch notifications error', err);
    }
  };

  const handleApprove = async (id) => {
    const booking = notifications.find(n => n._id === id);
    setSchedulingBooking(booking);
    setScheduledTherapies([]);
    setAvailableDates({});
    setShowScheduleModal(true);
    // Fetch available dates for all therapies
    const therapyIds = therapies.map(t => t._id).join(',');
    try {
      const res = await fetch(`${API_BASE}/api/bookings/available-dates?therapyIds=${therapyIds}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setAvailableDates(data.availableDates);
      }
    } catch (err) {
      console.error('Fetch available dates error', err);
    }
  };

  const handleScheduleSave = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${schedulingBooking._id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scheduledTherapies }),
      });
      const data = await res.json();
      if (data.ok) {
        setNotifications(notifications.filter((n) => n._id !== schedulingBooking._id));
        setUnreadCount((count) => Math.max(0, count - 1));
        setShowScheduleModal(false);
        setSchedulingBooking(null);
        setScheduledTherapies([]);
      } else {
        alert('Failed to approve and schedule booking');
      }
    } catch (err) {
      alert('Error approving and scheduling booking');
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setNotifications(notifications.filter((n) => n._id !== id));
        setUnreadCount((count) => Math.max(0, count - 1));
      } else {
        alert('Failed to reject booking');
      }
    } catch (err) {
      alert('Error rejecting booking');
      console.error(err);
    }
  };

  const handleAdd = () => {
    setEditingTherapy(null);
    setFormData({ name: '', description: '', price: '', time: '', videoUrl: '', maxPatientsPerDay: 5, preMedications: [], postMedications: [] });
    setShowModal(true);
  };

  const handleEdit = (therapy) => {
    setEditingTherapy(therapy);
    setFormData({
      name: therapy.name,
      description: therapy.description,
      price: therapy.price,
      time: therapy.time,
      videoUrl: therapy.videoUrl || '',
      maxPatientsPerDay: therapy.maxPatientsPerDay || 5,
      preMedications: therapy.preMedications || [],
      postMedications: therapy.postMedications || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this therapy?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/therapies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setTherapies(therapies.filter((t) => t._id !== id));
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingTherapy ? 'PUT' : 'POST';
      const url = editingTherapy ? `${API_BASE}/api/therapies/${editingTherapy._id}` : `${API_BASE}/api/therapies`;
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.ok) {
        if (editingTherapy) {
          setTherapies(therapies.map((t) => (t._id === editingTherapy._id ? data.therapy : t)));
        } else {
          setTherapies([...therapies, data.therapy]);
        }
        setShowModal(false);
      }
    } catch (err) {
      console.error('Save error', err);
    } finally {
      setSaving(false);
    }
  };

  const fetchChatUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/messages/practitioner/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setChatUsers(data.users);
      }
    } catch (err) {
      console.error('Fetch chat users error', err);
    }
  };

  const openChat = async (user) => {
    setChattingWith(user);
    setChatMessages([]);
    setNewMessage('');
    setShowChatModal(true);
    // Fetch messages
    try {
      const res = await fetch(`${API_BASE}/api/messages/${user.user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok) {
        setChatMessages(data.messages);
      }
      // Mark as read
      await fetch(`${API_BASE}/api/messages/mark-read/${user.user._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Update unread count
      setChatUsers((prev) => prev.map(u => u.user._id === user.user._id ? { ...u, unreadCount: 0 } : u));
    } catch (err) {
      console.error('Open chat error', err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiver: chattingWith.user._id,
          receiverRole: 'user',
          message: newMessage,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setChatMessages([...chatMessages, data.message]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Send message error', err);
    }
  };

  const addPreMed = () => {
    setFormData({
      ...formData,
      preMedications: [...formData.preMedications, { name: '', dosage: '', startTime: '', endTime: '' }]
    });
  };

  const removePreMed = (index) => {
    setFormData({
      ...formData,
      preMedications: formData.preMedications.filter((_, i) => i !== index)
    });
  };

  const updatePreMed = (index, field, value) => {
    const updated = formData.preMedications.map((med, i) =>
      i === index ? { ...med, [field]: value } : med
    );
    setFormData({ ...formData, preMedications: updated });
  };

  const addPostMed = () => {
    setFormData({
      ...formData,
      postMedications: [...formData.postMedications, { name: '', dosage: '', startTime: '', endTime: '' }]
    });
  };

  const removePostMed = (index) => {
    setFormData({
      ...formData,
      postMedications: formData.postMedications.filter((_, i) => i !== index)
    });
  };

  const updatePostMed = (index, field, value) => {
    const updated = formData.postMedications.map((med, i) =>
      i === index ? { ...med, [field]: value } : med
    );
    setFormData({ ...formData, postMedications: updated });
  };

  return (
    <div className="container-fluid mt-4 px-3">
      <h2 className="text-center mb-4">Panchakarma</h2>

      {/* Navigation Buttons */}
      <div className="d-flex justify-content-center mb-4">
        <div className="btn-group flex-wrap" role="group" style={{ maxWidth: '100%' }}>
          <button
            type="button"
            className={`btn ${activeSection === 'therapies' ? 'btn-primary' : 'btn-outline-primary'} btn-lg`}
            onClick={() => setActiveSection('therapies')}
          >
            <i className="bi bi-clipboard-data me-2"></i>Manage Therapies
          </button>
          <button
            type="button"
            className={`btn ${activeSection === 'chat' ? 'btn-primary' : 'btn-outline-primary'} btn-lg`}
            onClick={() => setActiveSection('chat')}
          >
            <i className="bi bi-chat-dots me-2"></i>Chat with Users
          </button>
        </div>
      </div>

      {activeSection === 'therapies' && (
        <>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Therapies</h3>
            <div style={{ position: 'relative' }}>
              <button
                className={`btn btn-outline-primary position-relative ${unreadCount > 0 ? 'btn-danger' : ''}`}
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <i className="bi bi-bell"></i>
                {unreadCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success"
                    style={{ fontSize: '0.7rem' }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div
                  className="card position-absolute"
                  style={{ width: '300px', right: 0, zIndex: 1000, maxHeight: '400px', overflowY: 'auto' }}
                >
                  <div className="card-body p-2">
                    <h6>Booking Requests</h6>
                    {notifications.length === 0 ? (
                      <p>No new notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className="border rounded p-2 mb-2">
                          <p className="mb-1">
                            <strong>{n.user.name}</strong> ({n.user.mobile}) requested booking.
                          </p>
                          <div className="d-flex gap-2">
                            <button className="btn btn-success btn-sm" onClick={() => handleApprove(n._id)}>
                              Approve & Schedule
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(n._id)}>
                              Reject
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleAdd}>
              + Add Therapy
            </button>
          </div>

          {loading ? (
            <p>Loading therapies...</p>
          ) : (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="row g-3">
                {therapies.map((therapy) => (
                  <div key={therapy._id} className="col-12 col-md-6 col-lg-4">
                    <div className="card h-100 shadow-sm">
                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title text-primary">{therapy.name}</h5>
                        <p className="card-text flex-grow-1">{therapy.description}</p>
                        <div className="mb-2">
                          <strong>Price:</strong> ₹{therapy.price}
                        </div>
                        <div className="mb-2">
                          <strong>Time:</strong> {therapy.time}
                        </div>
                        <div className="mb-2">
                          <strong>Max Patients/Day:</strong>{' '}
                          <input
                            type="number"
                            className="form-control d-inline-block"
                            style={{ width: '80px' }}
                            value={therapy.maxPatientsPerDay || 5}
                            onChange={async (e) => {
                              const newValue = parseInt(e.target.value, 10) || 5;
                              try {
                                const res = await fetch(`${API_BASE}/api/therapies/${therapy._id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                  },
                                  body: JSON.stringify({ ...therapy, maxPatientsPerDay: newValue }),
                                });
                                const data = await res.json();
                                if (data.ok) {
                                  setTherapies(therapies.map(t => t._id === therapy._id ? data.therapy : t));
                                }
                              } catch (err) {
                                console.error('Update maxPatientsPerDay error', err);
                              }
                            }}
                            min="1"
                          />
                        </div>
                        {therapy.videoUrl && (
                          <div className="mb-2">
                            <strong>Video:</strong>{' '}
                            <a href={therapy.videoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-link p-0">
                              <i className="bi bi-play-circle"></i> Watch
                            </a>
                          </div>
                        )}
                        <div className="mb-2">
                          <strong>Practitioner:</strong> {therapy.practitioner.name} ({therapy.practitioner.mobile})
                        </div>
                        {therapy.preMedications && therapy.preMedications.length > 0 && (
                          <div className="mb-2">
                            <strong>Pre-Medications:</strong> {therapy.preMedications.map(med => `${med.name} (${med.dosage})`).join(', ')}
                          </div>
                        )}
                        {therapy.postMedications && therapy.postMedications.length > 0 && (
                          <div className="mb-2">
                            <strong>Post-Medications:</strong> {therapy.postMedications.map(med => `${med.name} (${med.dosage})`).join(', ')}
                          </div>
                        )}
                        <div className="d-flex gap-2 mt-auto">
                          <button className="btn btn-outline-primary btn-sm flex-fill" onClick={() => handleEdit(therapy)}>
                            <i className="bi bi-pencil"></i> Update
                          </button>
                          <button className="btn btn-outline-danger btn-sm flex-fill" onClick={() => handleDelete(therapy._id)}>
                            <i className="bi bi-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeSection === 'chat' && (
        <>
          {/* Chat Section */}
          <div className="mt-5">
            <h3>Chat with Users</h3>
            <div className="row">
              {chatUsers.map((user) => (
                <div key={user.user._id} className="col-md-4 mb-3">
                  <div className="card" onClick={() => openChat(user)} style={{ cursor: 'pointer' }}>
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <i className="bi bi-person-circle" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <div>
                          <h6 className="card-title mb-1">{user.user.name}</h6>
                          <p className="card-text mb-1">{user.user.mobile}</p>
                          {user.unreadCount > 0 && (
                            <span className="badge bg-danger">{user.unreadCount} unread</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Chat Modal */}
      {showChatModal && chattingWith && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-centered">
            <div className="modal-card p-3" style={{ maxWidth: '500px', height: '600px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="m-0">Chat with {chattingWith.user.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowChatModal(false)}></button>
              </div>
              <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
                {chatMessages.map((msg) => (
                  <div key={msg._id} className={`mb-2 ${msg.senderRole === 'practitioner' ? 'text-end' : ''}`}>
                    <div className={`d-inline-block p-2 rounded ${msg.senderRole === 'practitioner' ? 'bg-primary text-white' : 'bg-light'}`}>
                      {msg.message}
                    </div>
                    <small className="d-block text-muted">{new Date(msg.timestamp).toLocaleString()}</small>
                  </div>
                ))}
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

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingTherapy ? 'Edit Therapy' : 'Add Therapy'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                >
                  <div className="mb-2">
                    <input
                      className="form-control"
                      placeholder="Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <textarea
                      className="form-control"
                      placeholder="Description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      className="form-control"
                      type="number"
                      placeholder="Price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      className="form-control"
                      placeholder="Time (e.g., 1 hour)"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      className="form-control"
                      placeholder="Video URL (optional)"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    />
                  </div>
                  <div className="mb-2">
                    <input
                      className="form-control"
                      type="number"
                      placeholder="Max Patients per Day"
                      value={formData.maxPatientsPerDay}
                      onChange={(e) => setFormData({ ...formData, maxPatientsPerDay: e.target.value })}
                      required
                      min="1"
                    />
                  </div>

                  {/* Pre-Medications */}
                  <div className="mb-3">
                    <h6>Pre-Medications</h6>
                    {formData.preMedications.map((med, index) => (
                      <div key={index} className="border rounded p-2 mb-2">
                        <div className="row g-2">
                          <div className="col-12 col-sm-6 col-md-3">
                            <input
                              className="form-control"
                              placeholder="Name"
                              value={med.name}
                              onChange={(e) => updatePreMed(index, 'name', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-sm-6 col-md-2">
                            <input
                              className="form-control"
                              placeholder="Dosage"
                              value={med.dosage}
                              onChange={(e) => updatePreMed(index, 'dosage', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-sm-6 col-md-2">
                            <input
                              type="time"
                              className="form-control"
                              placeholder="Start Time"
                              value={med.startTime}
                              onChange={(e) => updatePreMed(index, 'startTime', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-sm-6 col-md-2">
                            <input
                              type="time"
                              className="form-control"
                              placeholder="End Time"
                              value={med.endTime}
                              onChange={(e) => updatePreMed(index, 'endTime', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-3 d-flex align-items-center">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removePreMed(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={addPreMed}
                    >
                      + Add Pre-Medication
                    </button>
                  </div>

                  {/* Post-Medications */}
                  <div className="mb-3">
                    <h6>Post-Medications</h6>
                    {formData.postMedications.map((med, index) => (
                      <div key={index} className="border rounded p-2 mb-2">
                        <div className="row g-2">
                          <div className="col-12 col-sm-6 col-md-3">
                            <input
                              className="form-control"
                              placeholder="Name"
                              value={med.name}
                              onChange={(e) => updatePostMed(index, 'name', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-sm-6 col-md-2">
                            <input
                              className="form-control"
                              placeholder="Dosage"
                              value={med.dosage}
                              onChange={(e) => updatePostMed(index, 'dosage', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-sm-6 col-md-2">
                            <input
                              type="time"
                              className="form-control"
                              placeholder="Start Time"
                              value={med.startTime}
                              onChange={(e) => updatePostMed(index, 'startTime', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-sm-6 col-md-2">
                            <input
                              type="time"
                              className="form-control"
                              placeholder="End Time"
                              value={med.endTime}
                              onChange={(e) => updatePostMed(index, 'endTime', e.target.value)}
                            />
                          </div>
                          <div className="col-12 col-md-3 d-flex align-items-center">
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => removePostMed(index)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={addPostMed}
                    >
                      + Add Post-Medication
                    </button>
                  </div>

                  <div className="d-flex gap-2 mt-3">
                    <button type="submit" className="btn btn-primary flex-grow-1" disabled={saving}>
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && schedulingBooking && (
        <div className="modal-backdrop-custom">
          <div className="modal-dialog-centered">
            <div className="modal-card p-3" style={{ maxWidth: '600px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="m-0">Schedule Therapies for {schedulingBooking.user.name}</h5>
                <button type="button" className="btn-close" onClick={() => setShowScheduleModal(false)}></button>
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {therapies.map((therapy) => (
                  <div key={therapy._id} className="border rounded p-2 mb-2">
                    <h6>{therapy.name}</h6>
                    <p>Max Patients/Day: {therapy.maxPatientsPerDay}</p>
                    <input
                      type="date"
                      className="form-control"
                      onChange={(e) => {
                        const date = e.target.value;
                        if (date) {
                          const existing = scheduledTherapies.find(st => st.therapy === therapy._id);
                          if (existing) {
                            setScheduledTherapies(scheduledTherapies.map(st => st.therapy === therapy._id ? { ...st, date: new Date(date) } : st));
                          } else {
                            setScheduledTherapies([...scheduledTherapies, { therapy: therapy._id, date: new Date(date) }]);
                          }
                        } else {
                          setScheduledTherapies(scheduledTherapies.filter(st => st.therapy !== therapy._id));
                        }
                      }}
                      min={new Date().toISOString().split('T')[0]}
                    />
                    {scheduledTherapies.find(st => st.therapy === therapy._id) && (
                      <small className="text-success">Scheduled for {scheduledTherapies.find(st => st.therapy === therapy._id).date.toDateString()}</small>
                    )}
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary flex-grow-1" onClick={handleScheduleSave}>
                  Approve & Schedule
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}