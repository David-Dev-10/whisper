import bcrypt from 'bcrypt';
import User from '../models/User.js';
import generateUsername from '../services/usernameGenerator.js';

export const registerAnonymous = async (req, res) => {
  try {
    const { password } = req.body;

    let username;
    let exists = true;
    while (exists) {
      username = generateUsername();
      exists = await User.exists({ randomUsername: username });
    }

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;

    const user = await User.create({ randomUsername: username, passwordHash });

    res.status(201).json({
      userId: user._id,
      username: user.randomUsername
    });
  } catch (err) {
    console.error("ERROR", err.message);
    res.status(500).json({ message: 'Something went wrong' });
  }
};