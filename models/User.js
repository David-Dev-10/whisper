import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  randomUsername: { type: String, required: true, unique: true },
  passwordHash: { type: String },
  blocked: { type: Boolean, default: false },
  totalPosts: { type: Number, default: 0 },
  totalComments: { type: Number, default: 0 }
}, {
  timestamps: true
});

export default mongoose.model('User', userSchema);
