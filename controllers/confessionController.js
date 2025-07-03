import mongoose from "mongoose";
import Confession from "../models/Confession.js";
import ConfessionReaction from '../models/ConfessionReaction.js';
import { io } from "../sockets/socket.js";

export const createConfession = async (req, res) => {
  try {
    const {
      text,
      categoryId,
      location,
      address,
      authorId
    } = req.body;

    if (!text || text.length > 280) {
      return res.status(400).json({ message: 'Confession text is required and must be under 280 characters.' });
    }

    const confession = new Confession({
      text,
      categoryId,
      location,
      address,
      authorId
    });

    await confession.save();

    await confession.populate({
      path: "authorId",
      select: "randomUsername"
    })

    io.to(categoryId).emit("confessionAdded", confession);
    io.emit('newConfession', confession);

    res.status(201).json({
      message: 'Confession created successfully.',
      confession
    });
  } catch (error) {
    console.error('Error creating confession:', error.message);
    res.status(500).json({ message: 'Server error while creating confession.' });
  }
};

// 🔹 Get All Confessions
export const getAllConfessions = async (req, res) => {
  try {
    const { categoryId, page = 1, size = 10, userId } = req.query;

    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const skip = (pageNum - 1) * pageSize;

    const filter = {};
    if (categoryId) filter.categoryId = categoryId;

    const confessions = await Confession.find(filter)
      .populate({ path: 'authorId', select: 'randomUsername' })
      .populate({ path: 'categoryId', select: 'name' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total = await Confession.countDocuments(filter);

    if (userId) {
      const confessionIds = confessions.map(c => c._id);

      const userReactions = await ConfessionReaction.find({
        confessionId: { $in: confessionIds },
        userId: userId
      }).select('confessionId');

      const reactedIds = new Set(userReactions.map(r => r.confessionId.toString()));

      confessions.forEach(c => {
        c.isReact = reactedIds.has(c._id.toString());
      });
    } else {
      confessions.forEach(c => {
        c.isReact = false;
      });
    }

    res.status(200).json({
      total,
      page: pageNum,
      size: pageSize,
      confessions
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch confessions.' });
  }
};

// 🔹 Get One Confession by ID
export const getConfessionById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid confession ID' });
    }

    const confession = await Confession.findById(id)
      .populate({ path: "authorId", select: "randomUsername" })
      .populate({ path: "categoryId", select: "name" })
      .lean();

    if (!confession) {
      return res.status(404).json({ message: 'Confession not found' });
    }

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const reaction = await ConfessionReaction.findOne({
        confessionId: id,
        userId
      }).select('_id');

      confession.isReact = !!reaction;
    } else {
      confession.isReact = false;
    }

    res.status(200).json(confession);
  } catch (error) {
    console.error("ERROR", error.message);
    res.status(500).json({ message: 'Error retrieving confession.' });
  }
};

// 🔹 Update Confession (Only Author)
export const updateConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, categoryId, authorId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const confession = await Confession.findById(id);
    if (!confession) return res.status(404).json({ message: 'Confession not found' });

    if (confession.authorId.toString() !== authorId) {
      return res.status(403).json({ message: 'Unauthorized to update this confession' });
    }

    if (text) confession.text = text;
    if (categoryId) confession.categoryId = categoryId;

    await confession.save();
    res.status(200).json({ message: 'Confession updated', confession });
  } catch (error) {
    res.status(500).json({ message: 'Error updating confession.' });
  }
};

// 🔹 Delete Confession (Only Author)
export const deleteConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const { authorId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const confession = await Confession.findById(id);
    if (!confession) return res.status(404).json({ message: 'Confession not found' });

    if (confession.authorId.toString() !== authorId) {
      return res.status(403).json({ message: 'Unauthorized to delete this confession' });
    }

    await confession.deleteOne();
    res.status(200).json({ message: 'Confession deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting confession.' });
  }
};

// 🔹 Get Confessions by Author ID
export const getConfessionsByAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;
    const { categoryId, size = 10, page = 1, userId } = req.query;

    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const skip = (pageNum - 1) * pageSize;

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ message: 'Invalid author ID' });
    }

    const filter = { authorId };
    if (categoryId) filter.categoryId = categoryId;

    const confessions = await Confession.find(filter)
      .populate({ path: "authorId", select: "randomUsername" })
      .populate({ path: "categoryId", select: "name" })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total = await Confession.countDocuments(filter);

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      const confessionIds = confessions.map(c => c._id);
      const reactions = await ConfessionReaction.find({
        confessionId: { $in: confessionIds },
        userId
      }).select('confessionId');

      const reactedIds = new Set(reactions.map(r => r.confessionId.toString()));

      confessions.forEach(c => {
        c.isReact = reactedIds.has(c._id.toString());
      });
    } else {
      confessions.forEach(c => {
        c.isReact = false;
      });
    }

    res.status(200).json({
      total,
      page: pageNum,
      size: pageSize,
      confessions
    });
  } catch (error) {
    console.error('Error fetching confessions by author:', error.message);
    res.status(500).json({ message: 'Server error retrieving user confessions.' });
  }
};

// 🔹 Add/Update Reaction to a confession
export const reactToConfession = async (req, res) => {
  try {
    const { confessionId, userId, emoji } = req.body;

    const existing = await ConfessionReaction.findOne({ confessionId, userId });

    if (existing) {
      const oldEmoji = existing.emoji;

      if (oldEmoji === emoji) {
        return res.status(200).json({ message: 'Reaction unchanged.', reaction: existing });
      }

      // Update user's reaction
      existing.emoji = emoji;
      await existing.save();

      // Update the aggregate emoji counts on Confession
      await Confession.findByIdAndUpdate(confessionId, {
        $inc: {
          [`reactions.${oldEmoji}`]: -1,
          [`reactions.${emoji}`]: 1
        }
      });

      return res.status(200).json({ message: 'Reaction updated.', reaction: existing });
    }

    // New reaction
    const reaction = new ConfessionReaction({ confessionId, userId, emoji });
    await reaction.save();

    await Confession.findByIdAndUpdate(confessionId, {
      $inc: { [`reactions.${emoji}`]: 1 }
    });

    res.status(201).json({ message: 'Reaction added.', reaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error reacting to confession.' });
  }
};

// 🔹 Get Confessions by coordinates
export const getNearbyConfessions = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 1000 } = req.query; // distance in meters

    if (!longitude || !latitude) {
      return res.status(400).json({ message: 'Longitude and latitude are required.' });
    }

    const confessions = await Confession.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(maxDistance)
        }
      }
    }).populate({
      path: "authorId",
      select: "randomUsername",
    }).populate({
      path: "categoryId",
      select: "name",
    });

    res.status(200).json({ confessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch nearby confessions.' });
  }
};