const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please add a name'] },
    username: { type: String, required: [true, 'Please add a username'], unique: true, trim: true, lowercase: true },
    email: { type: String, required: [true, 'Please add an email'], unique: true, lowercase: true },
    password: { type: String, required: [true, 'Please add a password'], minlength: 6, select: false },
    phone: { type: String, required: [true, 'Please add a phone number'] },
    avatar: { type: String, default: '' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Villa' }],
    // Email verification. Only the SHA-256 hash of the token is stored.
    // Existing accounts created before this feature land default to verified
    // (see default) so nothing breaks for them.
    isEmailVerified: { type: Boolean, default: true },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    // Password reset. Hash-only storage; token expires and is single-use.
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
