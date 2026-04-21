const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    reminderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    reminderEmailVerified: {
      type: Boolean,
      default: false
    },
    pendingReminderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    reminderOtpHash: {
      type: String,
      default: null
    },
    reminderOtpExpiresAt: {
      type: Date,
      default: null
    },
    customCategories: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
