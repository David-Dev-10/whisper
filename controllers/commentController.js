import Comment from '../models/Comment.js';
import CommentReaction from '../models/CommentReaction.js';
import Confession from '../models/Confession.js';
import mongoose from 'mongoose';

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

    if (existing) {
      const oldEmoji = existing.emoji;

      if (oldEmoji === emoji) {
        return res.status(200).json({ message: 'Reaction unchanged.', reaction: existing });
      }

      // Update reaction document
      existing.emoji = emoji;
      await existing.save();

      // Update emoji counts on the comment
      await Comment.findByIdAndUpdate(commentId, {
        $inc: {
          [`reactions.${oldEmoji}`]: -1,
          [`reactions.${emoji}`]: 1
        }
      });

      return res.status(200).json({ message: 'Reaction updated.', reaction: existing });
    }

    // New reaction
    const reaction = new CommentReaction({ commentId, userId, emoji });
    await reaction.save();

    // Increment the count for the new emoji
    await Comment.findByIdAndUpdate(commentId, {
      $inc: { [`reactions.${emoji}`]: 1 }
    });

    res.status(201).json({ message: 'Reaction added.', reaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error reacting to comment.' });
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
      .sort({ timestamp: -1 })
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
