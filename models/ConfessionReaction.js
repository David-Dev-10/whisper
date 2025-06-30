import mongoose from 'mongoose';

const confessionReactionSchema = new mongoose.Schema({
  confessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Confession',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emoji: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Ensure a user can only have one reaction per confession
confessionReactionSchema.index({ confessionId: 1, userId: 1 }, { unique: true });

export default mongoose.model('ConfessionReaction', confessionReactionSchema);
