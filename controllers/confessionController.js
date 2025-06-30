import mongoose from "mongoose";
import Confession from "../models/Confession.js";
import ConfessionReaction from '../models/ConfessionReaction.js';

export const createConfession = async (req, res) => {
  try {
    const {
      text,
      category,
      location,
      address,
      authorId
    } = req.body;

    if (!text || text.length > 280) {
      return res.status(400).json({ message: 'Confession text is required and must be under 280 characters.' });
    }

    const confession = new Confession({
      text,
      category,
      location,
      address,
      authorId
    });

    await confession.save();

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
    const { category, page = 1, size = 10 } = req.query;

    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const skip = (pageNum - 1) * pageSize;

    const filter = {};
    if (category) filter.category = category;

    const confessions = await Confession.find(filter).populate({
      path: "authorId",
      select: "randomUsername",
    }).sort({ timestamp: -1 }).skip(skip)
      .limit(pageSize);
    const total = await Confession.countDocuments(filter);

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
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const confession = await Confession.findById(id);
    if (!confession) return res.status(404).json({ message: 'Confession not found' });

    res.status(200).json(confession);
  } catch (error) {
    console.error("ERROR", error.message)
    res.status(500).json({ message: 'Error retrieving confession.' });
  }
};

// 🔹 Update Confession (Only Author)
export const updateConfession = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, category, authorId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid ID' });

    const confession = await Confession.findById(id);
    if (!confession) return res.status(404).json({ message: 'Confession not found' });

    if (confession.authorId.toString() !== authorId) {
      return res.status(403).json({ message: 'Unauthorized to update this confession' });
    }

    if (text) confession.text = text;
    if (category) confession.category = category;

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

    const confession = await Confession.findById(id).populate({
      path: "authorId",
      select: "randomUsername",
    });
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
    const { category, size = 10, page = 1 } = req.query;

    const pageNum = parseInt(page);
    const pageSize = parseInt(size);
    const skip = (pageNum - 1) * pageSize;

    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ message: 'Invalid author ID' });
    }

    const filter = { authorId };
    if (category) filter.category = category;

    const confessions = await Confession.find({ authorId }).populate({
      path: "authorId",
      select: "randomUsername",
    }).sort({ timestamp: -1 }).skip(skip).limit(pageSize);

    const total = await Confession.countDocuments(filter);

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
          $maxDistance: parseInt(maxDistance)  // optional, in meters
        }
      }
    });

    res.status(200).json({ confessions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch nearby confessions.' });
  }
};