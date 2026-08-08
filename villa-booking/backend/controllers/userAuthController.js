const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => {
  return jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const register = async (req, res) => {
  try {
    const { name, username, email, password, phone } = req.body;

    if (!name || !username || !email || !password || !phone) {
      return res.status(400).json({ message: 'Please fill in all fields (name, username, email, phone, password)' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.create({ name, username, email, password, phone });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      wishlist: user.wishlist,
      token: generateToken(user._id),
    });
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern && error.keyPattern.username) {
        return res.status(400).json({ message: 'Username already taken' });
      }
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      wishlist: user.wishlist,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.username = req.body.username ? String(req.body.username).trim().toLowerCase() : user.username;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const usernameTaken = await User.findOne({ username: user.username, _id: { $ne: user._id } });
    if (usernameTaken) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      username: updatedUser.username,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar: updatedUser.avatar,
      wishlist: updatedUser.wishlist,
      token: generateToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const villaId = req.params.villaId;

    if (user.wishlist.includes(villaId)) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== villaId);
      await user.save();
      return res.json({ wishlist: user.wishlist, message: 'Removed from wishlist' });
    }

    user.wishlist.push(villaId);
    await user.save();
    res.json({ wishlist: user.wishlist, message: 'Added to wishlist' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getProfile, updateProfile, addToWishlist, getWishlist };
