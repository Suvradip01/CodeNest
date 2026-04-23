const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  content: { type: String, default: '' },
  language: { type: String, default: 'javascript' },
  updatedAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    index: true
  },
  files: [fileSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.index({ ownerId: 1, updatedAt: -1 });
projectSchema.index({ ownerId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);
