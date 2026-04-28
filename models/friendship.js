const mongoose = require("mongoose");

const friendshipSchema = new mongoose.Schema(
  {
    // Who sent the invite
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    // Who received it
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

// One row per ordered pair — block duplicate invites in the same direction.
friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports = mongoose.models.Friendship || mongoose.model("Friendship", friendshipSchema);
