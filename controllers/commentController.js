import Comment from '../models/Comment.js';
import CommentReaction from '../models/CommentReaction.js';
import Confession from '../models/Confession.js';
import { io } from "../sockets/socket.js";

// Add a new comment (with optional quote)
export const addComment = async (req, res) => {
  try {
    const { confessionId, text, username, authorId, quotedCommentId } = req.body;

    const comment = new Comment({
      confessionId,
      text,
      username,
      authorId,
      quotedCommentId: quotedCommentId || null
    });

    await comment.save();
    await Confession.findByIdAndUpdate(confessionId, {
      $inc: { commentsCount: 1 }
    });

    io.to(confessionId).emit("commentAdded", comment);
    res.status(201).json({ message: 'Comment added.', comment });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment.' });
  }
};

// Edit a comment
export const editComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, authorId } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (comment.authorId.toString() !== authorId) {
      return res.status(403).json({ message: 'Not allowed to edit this comment.' });
    }

    comment.text = text;
    await comment.save();

    res.status(200).json({ message: 'Comment updated.', comment });
  } catch (error) {
    res.status(500).json({ message: 'Error updating comment.' });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { authorId } = req.body;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found.' });

    if (comment.authorId.toString() !== authorId) {
      return res.status(403).json({ message: 'Not allowed to delete this comment.' });
    }

    await CommentReaction.deleteMany({ commentId: id });
    await comment.deleteOne();
    await Confession.findByIdAndUpdate(comment.confessionId, {
      $inc: { commentsCount: -1 }
    });

    res.status(200).json({ message: 'Comment deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting comment.' });
  }
};

// React or update reaction to a comment
export const reactToComment = async (req, res) => {
  try {
    const { commentId, userId, emoji } = req.body;

    const existing = await CommentReaction.findOne({ commentId, userId });

    // 1. No previous reaction → Add default or selected emoji
    if (!existing) {
      const newEmoji = emoji || '👍';
      const reaction = new CommentReaction({ commentId, userId, emoji: newEmoji });
      await reaction.save();

      await Comment.findByIdAndUpdate(commentId, {
        $inc: { [`reactions.${newEmoji}`]: 1 }
      });

      io.to(`reaction-${commentId}`).emit("commentReactionUpdated", {
        commentId,
        userId,
        emoji: newEmoji,
        action: "added"
      });

      return res.status(201).json({ message: 'Reaction added.', reaction });
    }

    // 2. User clicked like button again (no emoji selected) → remove
    if (!emoji) {
      const removedEmoji = existing.emoji;
      await CommentReaction.deleteOne({ _id: existing._id });

      await Comment.findByIdAndUpdate(commentId, {
        $inc: { [`reactions.${removedEmoji}`]: -1 }
      });

      // Cleanup if count drops to 0
      await Comment.updateOne(
        { _id: commentId, [`reactions.${removedEmoji}`]: { $lte: 0 } },
        { $unset: { [`reactions.${removedEmoji}`]: "" } }
      );

      io.to(`reaction-${commentId}`).emit("commentReactionUpdated", {
        commentId,
        userId,
        emoji: removedEmoji,
        action: "removed"
      });

      return res.status(200).json({ message: 'Reaction removed.' });
    }

    // 3. User selected a new emoji → update
    const oldEmoji = existing.emoji;

    if (oldEmoji === emoji) {
      return res.status(200).json({ message: 'Reaction unchanged.', reaction: existing });
    }

    existing.emoji = emoji;
    await existing.save();

    await Comment.findByIdAndUpdate(commentId, {
      $inc: {
        [`reactions.${oldEmoji}`]: -1,
        [`reactions.${emoji}`]: 1
      }
    });

    // Clean up if old emoji count drops to 0
    await Comment.updateOne(
      { _id: commentId, [`reactions.${oldEmoji}`]: { $lte: 0 } },
      { $unset: { [`reactions.${oldEmoji}`]: "" } }
    );

    io.to(`reaction-${commentId}`).emit("commentReactionUpdated", {
      commentId,
      userId,
      oldEmoji,
      emoji,
      action: "updated"
    });

    return res.status(200).json({ message: 'Reaction updated.', reaction: existing });
  } catch (error) {
    console.error('React to comment error:', error);
    res.status(500).json({ message: 'Failed to react to comment.' });
  }
};

// Get all comments by Confession ID
export const getCommentsByConfessionId = async (req, res) => {
  try {
    const { confessionId } = req.params;
    const { page = 1, size = 10 } = req.query;

    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const skip = (pageNum - 1) * pageSize;

    const comments = await Comment.find({ confessionId })
      .populate('quotedCommentId', 'text username') // populate quoted comment text + user
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await Comment.countDocuments({ confessionId });

    res.status(200).json({
      total,
      page: pageNum,
      size: pageSize,
      comments
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get comments for confession.' });
  }
};
