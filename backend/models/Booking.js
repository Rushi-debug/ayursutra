const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    practitioner: { type: mongoose.Schema.Types.ObjectId, ref: 'Practitioner', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    requestedDate: { type: Date, default: Date.now },
    scheduledDate: { type: Date },
    scheduledTherapies: [{ therapy: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapy' }, date: { type: Date } }],
    notes: { type: String },
  },
  { timestamps: true, collection: 'bookings' }
);

module.exports = mongoose.model('Booking', bookingSchema);
