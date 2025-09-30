const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Therapy = require('../models/Therapy');
const Practitioner = require('../models/Practitioner');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// Middleware to verify JWT and get practitioner
function authenticatePractitioner(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'practitioner') return res.status(403).json({ message: 'Access denied' });
    req.practitionerId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// GET /api/therapies - get all therapies for the practitioner
router.get('/', authenticatePractitioner, async (req, res) => {
  try {
    const therapies = await Therapy.find({ practitioner: req.practitionerId }).populate('practitioner', 'name mobile');
    res.json({ ok: true, therapies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/therapies - create new therapy
router.post('/', authenticatePractitioner, async (req, res) => {
  try {
    const { name, description, price, time, videoUrl } = req.body;
    if (!name || !description || !price || !time) {
      return res.status(400).json({ message: 'Name, description, price, and time are required' });
    }

    const therapy = new Therapy({
      name,
      description,
      price: Number(price),
      time,
      videoUrl,
      practitioner: req.practitionerId
    });

    await therapy.save();
    await therapy.populate('practitioner', 'name mobile');

    res.json({ ok: true, therapy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/therapies/:id - update therapy
router.put('/:id', authenticatePractitioner, async (req, res) => {
  try {
    const { name, description, price, time, videoUrl, maxPatientsPerDay } = req.body;
    const therapy = await Therapy.findOne({ _id: req.params.id, practitioner: req.practitionerId });
    if (!therapy) return res.status(404).json({ message: 'Therapy not found' });

    if (name) therapy.name = name;
    if (description) therapy.description = description;
    if (price) therapy.price = Number(price);
    if (time) therapy.time = time;
    if (videoUrl !== undefined) therapy.videoUrl = videoUrl;
    if (maxPatientsPerDay !== undefined) therapy.maxPatientsPerDay = Number(maxPatientsPerDay);

    await therapy.save();
    await therapy.populate('practitioner', 'name mobile');

    res.json({ ok: true, therapy });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/therapies/:id - delete therapy
router.delete('/:id', authenticatePractitioner, async (req, res) => {
  try {
    const therapy = await Therapy.findOneAndDelete({ _id: req.params.id, practitioner: req.practitionerId });
    if (!therapy) return res.status(404).json({ message: 'Therapy not found' });

    res.json({ ok: true, message: 'Therapy deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
