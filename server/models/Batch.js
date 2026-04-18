const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity (number of meals) is required'],
    min: [1, 'Quantity must be at least 1']
  },
  category: {
    type: String,
    required: [true, 'Food category is required'],
    enum: {
      values: ['veg', 'rice', 'bread', 'curry', 'dal', 'snacks', 'fruits', 'dairy', 'mixed', 'other'],
      message: '{VALUE} is not a valid food category'
    }
  },
  preparationTime: {
    type: Date,
    required: [true, 'Preparation time is required']
  },
  imageUrl: {
    type: String,
    required: [true, 'Food photo is required']
  },
  notes: {
    type: String,
    default: ''
  },
  riskLevel: {
    type: String,
    required: true,
    enum: ['LOW', 'MEDIUM', 'HIGH']
  },
  expiryTime: {
    type: Date,
    required: true
  },
  costPerMeal: {
    type: Number,
    default: 0,
    min: 0
  },
  totalValue: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    default: 'created',
    enum: ['created', 'mapped', 'completed', 'expired']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Enforce immutability on core fields after creation (proof system requirement)
batchSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  const immutableFields = [
    'batchId', 'donorId', 'quantity', 'category',
    'preparationTime', 'imageUrl', 'riskLevel', 'expiryTime', 'createdAt'
  ];
  for (const field of immutableFields) {
    if (update[field] || (update.$set && update.$set[field])) {
      return next(new Error(`Field "${field}" is immutable and cannot be modified after creation`));
    }
  }
  next();
});

module.exports = mongoose.model('Batch', batchSchema);
