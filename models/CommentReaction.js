import mongoose from 'mongoose';

const commentReactionSchema = new mongoose.Schema({
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
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

// Prevent user reacting with same emoji to the same comment more than once
commentReactionSchema.index({ commentId: 1, userId: 1 }, { unique: true });

const CommentReaction = mongoose.model('CommentReaction', commentReactionSchema);
export default CommentReaction;
