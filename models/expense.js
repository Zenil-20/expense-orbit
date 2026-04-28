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
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [120, "Expense name must be 120 characters or less"]
    },
    amount: { type: Number, required: true, min: [0.01, "Amount must be greater than 0"] },
    date: { type: Date, default: Date.now },

    // ── Personal-only fields (kept for back-compat with existing personal-expense code) ──
    // `type` accepts null so splitwise-mode docs (which don't carry a personal type) validate cleanly.
    type: {
      type: String,
      enum: {
        values: ["recurring", "one-time", "flexible", null],
        message: "Invalid expense type"
      },
      default: null
    },
    recurringType: {
      type: String,
      enum: {
        values: ["daily", "weekly", "monthly", "yearly", null],
        message: "Invalid recurring frequency"
      },
      default: null
    },
    nextDueDate: { type: Date, default: null },
    category: {
      type: String,
      trim: true,
      maxlength: [60, "Category must be 60 characters or less"],
      default: null
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "paid", "overdue"],
        message: "Invalid expense status"
      },
      default: "pending"
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Enter a valid email address"],
      default: null
    },
    reminderEmailVerified: { type: Boolean, default: false },
    pendingReminderEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Enter a valid pending reminder email address"],
      default: null
    },
    reminderOtpHash: { type: String, default: null },
    reminderOtpExpiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
