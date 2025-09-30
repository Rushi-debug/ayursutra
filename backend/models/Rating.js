const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    practitioner: { type: mongoose.Schema.Types.ObjectId, ref: 'Practitioner', required: true },
    therapy: { type: mongoose.Schema.Types.ObjectId, ref: 'Therapy', required: true },
    rating: { type: Number, required: true, min: 0, max: 5 },
    comment: { type: String, required: false },
  },
  { timestamps: true, collection: 'ratings' }
);

module.exports = mongoose.model('Rating', ratingSchema);
