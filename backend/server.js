require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const practitionerRoutes = require('./routes/practitioners'); // new
const therapyRoutes = require('./routes/therapies');
const bookingRoutes = require('./routes/bookings');
const messageRoutes = require('./routes/messages');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/panchakarma_db';

const app = express();

// serve uploads (license pdfs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' })); // allow frontend

app.use('/api/auth', authRoutes);
app.use('/api/practitioners', practitionerRoutes); // new
app.use('/api/therapies', therapyRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => res.json({ ok: true }));

mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log('Server running on port', PORT));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
