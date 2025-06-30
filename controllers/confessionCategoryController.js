import ConfessionCategory from '../models/ConfessionCategory.js';

export const createConfessionCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const exists = await ConfessionCategory.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: 'Category already exists.' });
    }

    const category = new ConfessionCategory({ name, description });
    await category.save();

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create category.' });
  }
};

export const getConfessionCategories = async (req, res) => {
  try {
    const categories = await ConfessionCategory.find().sort({ name: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories.' });
  }
};