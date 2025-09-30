const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Practitioner = require('../models/Practitioner');
const User = require('../models/User');
const Therapy = require('../models/Therapy');
const authMiddleware = require('../middleware/auth'); // Assuming you have auth middleware

// Create a new booking
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { practitionerId, notes } = req.body;
    if (!practitionerId) {
      return res.status(400).json({ ok: false, error: 'Practitioner ID is required' });
    }
    const practitioner = await Practitioner.findById(practitionerId);
    if (!practitioner) {
      return res.status(404).json({ ok: false, error: 'Practitioner not found' });
    }
    const booking = new Booking({
      user: req.user._id,
      practitioner: practitionerId,
      notes,
      status: 'pending',
    });
    await booking.save();
    res.json({ ok: true, booking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Get pending bookings for practitioner (notifications)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Only practitioners can get their bookings
    if (!req.user.isPractitioner) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    const bookings = await Booking.find({ practitioner: req.user._id, status: 'pending' })
      .populate('user', 'name email mobile')
      .sort({ createdAt: -1 });
    res.json({ ok: true, bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Approve a booking with scheduling
router.put('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { scheduledTherapies } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ ok: false, error: 'Booking not found' });
    }
    if (booking.practitioner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    booking.status = 'approved';
    if (scheduledTherapies && Array.isArray(scheduledTherapies)) {
      booking.scheduledTherapies = scheduledTherapies;
    }
    await booking.save();
    res.json({ ok: true, booking });
  } catch (err) {
    console.error('Approve booking error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Reject a booking
router.put('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ ok: false, error: 'Booking not found' });
    }
    if (booking.practitioner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    booking.status = 'rejected';
    await booking.save();
    res.json({ ok: true, booking });
  } catch (err) {
    console.error('Reject booking error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Get available dates for therapies
router.get('/available-dates', authMiddleware, async (req, res) => {
  try {
    const { therapyIds } = req.query;
    if (!therapyIds) {
      return res.status(400).json({ ok: false, error: 'Therapy IDs required' });
    }
    const ids = therapyIds.split(',');
    const therapies = await Therapy.find({ _id: { $in: ids } });
    const availableDates = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 30; i++) { // Next 30 days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() === 0) continue; // Skip Sundays
      const dateStr = date.toISOString().split('T')[0];
      availableDates[dateStr] = [];
      for (const therapy of therapies) {
        const count = await Booking.countDocuments({
          'scheduledTherapies.therapy': therapy._id,
          'scheduledTherapies.date': {
            $gte: new Date(dateStr + 'T00:00:00'),
            $lt: new Date(dateStr + 'T23:59:59')
          }
        });
        if (count < therapy.maxPatientsPerDay) {
          availableDates[dateStr].push(therapy._id.toString());
        }
      }
      if (availableDates[dateStr].length === 0) {
        delete availableDates[dateStr];
      }
    }
    res.json({ ok: true, availableDates });
  } catch (err) {
    console.error('Get available dates error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// Get bookings for user
router.get('/user', authMiddleware, async (req, res) => {
  try {
    // Only users can get their bookings
    if (req.user.isPractitioner) {
      return res.status(403).json({ ok: false, error: 'Access denied' });
    }
    const bookings = await Booking.find({ user: req.user._id })
      .populate('practitioner', 'name mobile')
      .populate('scheduledTherapies.therapy', 'name')
      .sort({ createdAt: -1 });
    res.json({ ok: true, bookings });
  } catch (err) {
    console.error('Get user bookings error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

module.exports = router;
