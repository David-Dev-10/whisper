import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  confessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Confession',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  quotedCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  },
  reactions: {
    type: Map,
    of: Number,
    default: {}
  }
}, {
  timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
