  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  const Practitioner = require('../models/Practitioner');

  const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

  module.exports = async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ ok: false, error: 'No token provided' });
      }
      const decoded = jwt.verify(token, JWT_SECRET);
      let user = await User.findById(decoded.id);
      if (user) {
        req.user = { ...user.toObject(), isPractitioner: false };
      } else {
        user = await Practitioner.findById(decoded.id);
        if (user) {
          req.user = { ...user.toObject(), isPractitioner: true };
        } else {
          return res.status(401).json({ ok: false, error: 'Invalid token' });
        }
      }
      next();
    } catch (err) {
      res.status(401).json({ ok: false, error: 'Invalid token' });
    }
  };
