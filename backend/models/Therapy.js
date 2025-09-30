const mongoose = require('mongoose');

const therapySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    time: { type: String, required: true }, // e.g., "1 hour", "30 minutes"
    videoUrl: { type: String, required: false }, // URL to video
    maxPatientsPerDay: { type: Number, default: 5 }, // Maximum patients per day for this therapy
    practitioner: { type: mongoose.Schema.Types.ObjectId, ref: 'Practitioner', required: true },
  },
  { timestamps: true, collection: 'therapies' }
);

module.exports = mongoose.model('Therapy', therapySchema);
