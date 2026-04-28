const mongoose = require("mongoose");
const Friendship = require("../models/friendship");
const User = require("../models/user");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Send an invite by exact email. Email is never browseable — discovery requires knowing the address.
exports.invite = async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    if (!email || !/.+@.+\..+/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    if (email === req.user.email) {
      return res.status(400).json({ message: "You can't invite yourself" });
    }

    const target = await User.findOne({ email }).select("_id name email");
    if (!target) {
      return res.status(404).json({ message: "No account on the platform uses this email" });
    }

    // If a friendship already exists either direction, surface its status instead of creating duplicates.
    const existing = await Friendship.findOne({
      $or: [
        { requester: req.user._id, recipient: target._id },
        { requester: target._id, recipient: req.user._id }
      ]
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(409).json({ message: "You're already friends with this user" });
      }
      if (existing.status === "pending") {
        // If the invite is incoming, auto-accept it
        if (String(existing.recipient) === String(req.user._id)) {
          existing.status = "accepted";
          await existing.save();
          return res.status(200).json({ message: "Invite accepted — you're now friends", friendship: existing });
        }
        return res.status(409).json({ message: "An invite is already pending for this user" });
      }
      // declined — allow re-invite by resetting
      existing.status = "pending";
      existing.requester = req.user._id;
      existing.recipient = target._id;
      await existing.save();
      return res.status(201).json({ message: `Invite re-sent to ${target.name}`, friendship: existing });
    }

    const friendship = await Friendship.create({
      requester: req.user._id,
      recipient: target._id,
      status: "pending"
    });

    res.status(201).json({ message: `Invite sent to ${target.name}`, friendship });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// List the current user's connections, grouped by status.
exports.list = async (req, res) => {
  try {
    const userId = req.user._id;

    const docs = await Friendship.find({
      $or: [{ requester: userId }, { recipient: userId }]
    })
      .populate("requester", "name email")
      .populate("recipient", "name email")
      .sort({ updatedAt: -1 });

    const friends = [];
    const incoming = [];
    const outgoing = [];

    docs.forEach((doc) => {
      const iAmRequester = String(doc.requester._id) === String(userId);
      const other = iAmRequester ? doc.recipient : doc.requester;

      if (doc.status === "accepted") {
        friends.push({ _id: other._id, name: other.name, email: other.email, friendshipId: doc._id });
      } else if (doc.status === "pending") {
        if (iAmRequester) outgoing.push({ _id: other._id, name: other.name, email: other.email, friendshipId: doc._id });
        else incoming.push({ _id: other._id, name: other.name, email: other.email, friendshipId: doc._id });
      }
    });

    res.json({ friends, incoming, outgoing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Accept an incoming invite
exports.accept = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid friendship id" });
    }

    const doc = await Friendship.findOne({
      _id: req.params.id,
      recipient: req.user._id,
      status: "pending"
    });

    if (!doc) return res.status(404).json({ message: "No pending invite found" });

    doc.status = "accepted";
    await doc.save();
    res.json({ message: "Invite accepted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Decline an incoming invite
exports.decline = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid friendship id" });
    }

    const doc = await Friendship.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user._id,
      status: "pending"
    });

    if (!doc) return res.status(404).json({ message: "No pending invite found" });
    res.json({ message: "Invite declined" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Remove a friend (or cancel an outgoing invite). Either party can remove.
exports.remove = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid friendship id" });
    }

    const doc = await Friendship.findOneAndDelete({
      _id: req.params.id,
      $or: [{ requester: req.user._id }, { recipient: req.user._id }]
    });

    if (!doc) return res.status(404).json({ message: "Friendship not found" });
    res.json({ message: "Removed" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Helper for splitwise controller — returns the Set of accepted-friend ids for a user.
exports.getAcceptedFriendIds = async (userId) => {
  const docs = await Friendship.find({
    status: "accepted",
    $or: [{ requester: userId }, { recipient: userId }]
  }).select("requester recipient");

  const ids = new Set();
  docs.forEach((d) => {
    const otherId = String(d.requester) === String(userId) ? d.recipient : d.requester;
    ids.add(String(otherId));
  });
  return ids;
};
