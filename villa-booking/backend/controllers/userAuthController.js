const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateToken: generateSecureToken, hashToken, safeEqual } = require('../utils/authToken');
const {
  isEmailConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../services/emailService');

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

const generateToken = (id) => {
  return jwt.sign({ id, type: 'user' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isDevWithoutSmtp = () =>
  !isEmailConfigured() && process.env.NODE_ENV !== 'production';

// Stable, leak-free public shape for auth responses. Mirrors the previous
// response shape so the existing frontend keeps working, plus a
// `needsVerification` flag for the new flow.
const publicUser = (user, { withToken = false } = {}) => {
  const payload = {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,
    wishlist: user.wishlist,
    isEmailVerified: !!user.isEmailVerified,
    needsVerification: user.isEmailVerified === false,
  };
  if (withToken) payload.token = generateToken(user._id);
  return payload;
};

// Produces a cryptographically random token, persists only its SHA-256 hash,
// and returns the raw token for inclusion in the email link.
const stashToken = (user, { type, ttl, expiresField, hashField }) => {
  const raw = generateSecureToken();
  user[hashField] = hashToken(raw);
  user[expiresField] = new Date(Date.now() + ttl);
  return raw;
};

const register = async (req, res) => {
  try {
    const { name, username, email, password, phone } = req.body;

    if (!name || !username || !email || !password || !phone) {
      return res.status(400).json({ message: 'Please fill in all fields (name, username, email, phone, password)' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const userExists = await User.findOne({ email }).select('+password');
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const user = await User.create({ name, username, email, password, phone, isEmailVerified: false });

    // Verification token is stored hashed; the raw token goes in the email.
    const rawToken = stashToken(user, {
      type: 'verification',
      ttl: VERIFICATION_TOKEN_TTL_MS,
      hashField: 'emailVerificationTokenHash',
      expiresField: 'emailVerificationExpires',
    });
    await user.save();

    let verificationSent = false;
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        token: rawToken,
        mode: 'initial',
      });
      verificationSent = true;
    } catch (err) {
      console.error('Verification email failed:', err.message);
    }

    // Email delivery could not be confirmed — do not leave a half-verified
    // account behind. The fresh token is burned; the user can register again.
    if (!verificationSent && !isDevWithoutSmtp()) {
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ message: 'Could not send the verification email. Please try again.' });
    }

    const payload = publicUser(user, { withToken: true });
    // Dev convenience: without SMTP configured the email cannot be sent, so
    // surface the one-time link token on the registration response (never in
    // production). Lets the flow be tested locally end-to-end.
    if (isDevWithoutSmtp()) payload.devVerificationToken = rawToken;
    res.status(201).json(payload);
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

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email address before logging in. Check your inbox or request a new verification link.',
        needsVerification: true,
      });
    }

    res.json(publicUser(user, { withToken: true }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token, email } = req.body;
    const rawToken = token || email; // support { token } or { email, token }
    if (!rawToken) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const hash = hashToken(rawToken);
    const user = await User.findOne({
      emailVerificationTokenHash: hash,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationTokenHash +emailVerificationExpires');

    if (!user) {
      // Generic 400 — do not hint whether the token was invalid or expired.
      return res.status(400).json({ message: 'This verification link is invalid or has expired.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({
      message: 'Email verified successfully. You can now log in.',
      user: publicUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resendVerification = async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase();

    // Consistent 404/200 shape regardless of whether the account exists
    // (enumeration protection). Time spent here is ~equal for both paths.
    const user = await User.findOne({ email: email || '__nope__' });
    if (!user || user.isEmailVerified) {
      return res.status(200).json({ message: 'If that email is registered and unverified, a new verification link has been sent.' });
    }

    const rawToken = stashToken(user, {
      type: 'verification',
      ttl: VERIFICATION_TOKEN_TTL_MS,
      hashField: 'emailVerificationTokenHash',
      expiresField: 'emailVerificationExpires',
    });
    await user.save();

    let resendOk = true;
    try {
      await sendVerificationEmail({ to: user.email, name: user.name, token: rawToken, mode: 'resend' });
    } catch (err) {
      resendOk = false;
      console.error('Resend verification email failed:', err.message);
    }

    const payload = { message: 'If that email is registered and unverified, a new verification link has been sent.' };
    if (!resendOk && isDevWithoutSmtp()) payload.devVerificationToken = rawToken;
    if (!resendOk && !isDevWithoutSmtp()) {
      return res.status(500).json({ message: 'Could not send the verification email. Please try again shortly.' });
    }
    return res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase();

    const user = await User.findOne({ email: email || '__nope__' });
    if (!user) {
      return res.status(200).json({ message: 'If an account exists for that email, a password reset link has been sent.' });
    }

    const rawToken = stashToken(user, {
      type: 'reset',
      ttl: RESET_TOKEN_TTL_MS,
      hashField: 'passwordResetTokenHash',
      expiresField: 'passwordResetExpires',
    });
    await user.save();

    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, token: rawToken });
    } catch (err) {
      console.error('Password reset email failed:', err.message);
      // Never leak to the client whether the token was saved.
    }

    return res.status(200).json({ message: 'If an account exists for that email, a password reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Reset token is required' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: hash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires +password');

    if (!user) {
      return res.status(400).json({ message: 'This reset link is invalid or has expired.' });
    }

    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(publicUser(user));
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
      if (String(req.body.password).length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      user.password = req.body.password;
    }

    const usernameTaken = await User.findOne({ username: user.username, _id: { $ne: user._id } });
    if (usernameTaken) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const updatedUser = await user.save();

    res.json(publicUser(updatedUser, { withToken: true }));
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

const getMe = async (req, res) => {
  // GET /api/auth/me — complements /profile for the new auth surface.
  res.json(publicUser(req.user));
};

const logout = async (req, res) => {
  // JWT is stateless; no server-side session to invalidate. The client must
  // discard its stored token.
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  getProfile,
  updateProfile,
  addToWishlist,
  getWishlist,
};