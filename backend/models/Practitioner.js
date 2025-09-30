const mongoose = require('mongoose');

const practitionerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    clinicName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String, required: true, trim: true },
    altMobile: { type: String, required: false, trim: true },
    gender: { type: String, required: false, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    location: {
      latitude: { type: Number },
      longitude: { type: Number },
      address: { type: String },
      updatedAt: { type: Date, default: Date.now },
    },
    licensePath: { type: String }, // relative path to uploaded license PDF
    verified: { type: Boolean, default: false }, // for admin verification workflow
  },
  { timestamps: true, collection: 'practitioners' }
);

module.exports = mongoose.model('Practitioner', practitionerSchema);
