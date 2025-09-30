const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// helper: simple phone validator (10 digits)
function isValidMobile(m) {
  if (!m) return false;
  return /^\d{10}$/.test(m);
}

// normalize location structure
function normalizeLocation(loc) {
  if (!loc) return undefined;
  const latitude = Number(loc.latitude ?? loc.lat ?? loc.latLng?.lat);
  const longitude = Number(loc.longitude ?? loc.lng ?? loc.latLng?.lng);
  const accuracy = loc.accuracy ? Number(loc.accuracy) : undefined;
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude, accuracy, updatedAt: new Date() };
  }
  return undefined;
}

// register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, age, mobile, altMobile, gender, location } = req.body;

    // basic validation
    if (!name || !email || !password || !mobile) {
      return res.status(400).json({ message: 'Name, email, password and mobile are required.' });
    }

    if (!isValidMobile(mobile)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits.' });
    }
    if (altMobile && !isValidMobile(altMobile)) {
      return res.status(400).json({ message: 'Alternate mobile must be 10 digits if provided.' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use.' });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const lastLocation = normalizeLocation(location);

    const user = new User({
      name,
      email,
      password: hashed,
      age: age ? Number(age) : undefined,
      mobile,
      altMobile: altMobile || undefined,
      gender: gender || undefined,
      lastLocation,
    });

    await user.save();

    // create token
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    // return user data (omit password)
    res.json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        mobile: user.mobile,
        altMobile: user.altMobile,
        gender: user.gender,
        lastLocation: user.lastLocation,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      const dupKey = Object.keys(err.keyValue || {})[0];
      return res.status(400).json({ message: `${dupKey} already exists.` });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// login
router.post('/login', async (req, res) => {
  try {
    const { email, password, location } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials.' });

    // update lastLocation if provided
    const lastLocation = normalizeLocation(location);
    if (lastLocation) {
      user.lastLocation = lastLocation;
      await user.save();
    }

    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      ok: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        mobile: user.mobile,
        altMobile: user.altMobile,
        gender: user.gender,
        lastLocation: user.lastLocation,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
