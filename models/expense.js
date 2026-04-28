const mongoose = require('mongoose');

// One schema, two modes:
//   • Personal expenses set `user` (the owner). They're private.
//   • Splitwise expenses set `paidBy` + `splitBetween` (and optionally `group`). They're shared.
const expenseSchema = new mongoose.Schema(
  {
    // ── Personal-mode owner ──
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },

    // ── Splitwise: optional group container ──
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
      index: true
    },

    // ── Splitwise: who paid ──
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    // ── Splitwise: participants ──
    splitBetween: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    splitType: {
      type: String,
      enum: ["equal", "unequal"],
      default: "equal"
    },

    splits: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amount: { type: Number, min: 0 }
      }
    ],

    // ── Common ──
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, default: Date.now },

    // ── Personal-only fields (kept for back-compat with existing personal-expense code) ──
    type: { type: String, enum: ["recurring", "one-time", "flexible", null], default: null },
    recurringType: { type: String, default: null },
    nextDueDate: { type: Date, default: null },
    category: { type: String, default: null },
    status: { type: String, default: "pending" },
    email: { type: String, default: null },
    reminderEmailVerified: { type: Boolean, default: false },
    pendingReminderEmail: { type: String, default: null },
    reminderOtpHash: { type: String, default: null },
    reminderOtpExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
