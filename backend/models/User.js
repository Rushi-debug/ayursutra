const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: false },
    mobile: { type: String, required: true, trim: true },
    altMobile: { type: String, required: false, trim: true },
    gender: { type: String, required: false, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    // last known location (saved on register/login when provided)
    lastLocation: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number }, // optional
      updatedAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true, collection: 'users' }
);

module.exports = mongoose.model('User', userSchema);
