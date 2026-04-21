const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: [120, "Expense name must be 120 characters or less"]
        },
        amount: {
            type: Number,
            required: true,
            min: [0.01, "Amount must be greater than 0"]
        },

        type: {
            type: String,
            enum: ['recurring', 'one-time', 'flexible'],
            required: true
        },

        recurringType: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'yearly'],
            default: null
        },

        category: {
            type: String,
            trim: true,
            maxlength: [60, "Category must be 60 characters or less"]
        },

        date: {
            type: Date,
            default: Date.now
        },

        nextDueDate: Date,

        status: {
            type: String,
            enum: ["pending", "paid", "overdue"],
            default: "pending"
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/.+@.+\..+/, "Enter a valid email address"],
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
            match: [/.+@.+\..+/, "Enter a valid pending reminder email address"],
            default: null
        },

        reminderOtpHash: {
            type: String,
            default: null
        },

        reminderOtpExpiresAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);
