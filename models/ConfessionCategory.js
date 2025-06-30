import mongoose from 'mongoose';

const confessionCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String
  },
}, {
  timestamps: true
});

export default mongoose.model('ConfessionCategory', confessionCategorySchema);