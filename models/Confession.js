import mongoose from 'mongoose';

const confessionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 280
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    }
  },
  address: String,
  category: {
    type: String,
    enum: ['Funny', 'Sad', 'Love', 'Work', 'Other']
  },
  upvotes: {
    type: Number,
    default: 0
  },
  reactions: {
    type: Map,
    of: Number,
    default: {}
  },
  commentsCount: {
    type: Number,
    default: 0
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isReported: {
    type: Boolean,
    default: false
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Confession = mongoose.model('Confession', confessionSchema);
export default Confession;
