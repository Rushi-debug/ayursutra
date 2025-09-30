const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const Practitioner = require('../models/Practitioner');
const Therapy = require('../models/Therapy');
const Rating = require('../models/Rating');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// helper: phone validator
function isValidMobile(m) {
  if (!m) return false;
  return /^\d{10}$/.test(m);
}

// Multer storage: save in backend/uploads/licenses, create folder if missing
const uploadFolder = path.join(__dirname, '..', 'uploads', 'licenses');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    // unique name: practitioner-{timestamp}-{originalname}
    const unique = `practitioner-${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, unique);
  }
});

function fileFilter (req, file, cb) {
  // only accept pdf
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF license uploads are allowed.'), false);
}

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// register practitioner (multipart/form-data)
router.post('/register', upload.single('license'), async (req, res) => {
  try {
    // fields may be in req.body (text) and file in req.file
    const { name, clinicName, email, password, mobile, altMobile, gender, location } = req.body;

    if (!name || !clinicName || !email || !password || !mobile) {
      return res.status(400).json({ message: 'Name, clinic name, email, password and mobile are required.' });
    }
    if (!isValidMobile(mobile)) return res.status(400).json({ message: 'Mobile must be 10 digits.' });
    if (altMobile && !isValidMobile(altMobile)) return res.status(400).json({ message: 'Alternate mobile invalid.' });

    const existing = await Practitioner.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use.' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // parse location if present (sent as JSON string from frontend)
    let parsedLocation;
    try {
      parsedLocation = location ? JSON.parse(location) : undefined;
    } catch (e) {
      parsedLocation = undefined;
    }

    // license file path (optional)
    let licensePath;
    if (req.file) {
      // e.g. /uploads/licenses/practitioner-....pdf  (publicly accessible via server static route)
      licensePath = `/uploads/licenses/${req.file.filename}`;
    }

    const practitioner = new Practitioner({
      name,
      clinicName,
      email,
      password: hashed,
      mobile,
      altMobile: altMobile || undefined,
      gender: gender || undefined,
      location: parsedLocation ? {
        latitude: Number(parsedLocation.latitude),
        longitude: Number(parsedLocation.longitude),
        address: parsedLocation.address || undefined,
        updatedAt: new Date()
      } : undefined,
      licensePath
    });

    await practitioner.save();

    const token = jwt.sign({ id: practitioner._id, name: practitioner.name, role: 'practitioner' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      ok: true,
      practitioner: {
        id: practitioner._id,
        name: practitioner.name,
        clinicName: practitioner.clinicName,
        email: practitioner.email,
        mobile: practitioner.mobile,
        altMobile: practitioner.altMobile,
        location: practitioner.location,
        licensePath: practitioner.licensePath,
      },
      token
    });
  } catch (err) {
    console.error('practitioner register error', err);
    if (err.code === 11000) return res.status(400).json({ message: 'Email already exists.' });
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// login practitioner
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const p = await Practitioner.findOne({ email });
    if (!p) return res.status(400).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, p.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: p._id, name: p.name, role: 'practitioner' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      ok: true,
      practitioner: {
        id: p._id,
        name: p.name,
        clinicName: p.clinicName,
        email: p.email,
        mobile: p.mobile,
        altMobile: p.altMobile,
        location: p.location,
        licensePath: p.licensePath,
      },
      token
    });
  } catch (err) {
    console.error('practitioner login error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// get nearby practitioner modules
router.get('/practitioner-modules', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ message: 'Latitude and longitude required.' });

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    // Find all practitioners with location
    const practitioners = await Practitioner.find({ 'location.latitude': { $exists: true }, 'location.longitude': { $exists: true } });

    // Calculate distance and sort
    const withDistance = practitioners.map(p => {
      const dist = Math.sqrt(Math.pow(userLat - p.location.latitude, 2) + Math.pow(userLng - p.location.longitude, 2));
      return { ...p.toObject(), distance: dist };
    });

    withDistance.sort((a, b) => a.distance - b.distance);
    const nearest = withDistance.slice(0, 10);

    // For each, populate therapies and calculate average rating
    const modules = await Promise.all(nearest.map(async (p) => {
      const therapies = await Therapy.find({ practitioner: p._id });

      // Get all ratings for this practitioner's therapies
      const ratings = await Rating.find({ practitioner: p._id });
      const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

      return {
        id: p._id,
        clinicName: p.clinicName,
        mobile: p.mobile,
        altMobile: p.altMobile,
        email: p.email,
        rating: avgRating,
        therapies: therapies.map(t => ({ _id: t._id, name: t.name, price: t.price, time: t.time }))
      };
    }));

    res.json({ ok: true, modules });
  } catch (err) {
    console.error('practitioner modules error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
