const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { DEFAULT_CATEGORIES, normalizeCategoryName } = require("../utils/categoryUtils");
const sendEmail = require("../services/emailService");
const {
  buildReminderVerificationTemplate,
  buildTestEmailTemplate
} = require("../services/emailTemplates");
const { generateOtpCode, hashOtpCode } = require("../utils/securityUtils");

function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    reminderEmail: user.reminderEmail || null,
    reminderEmailVerified: Boolean(user.reminderEmailVerified),
    pendingReminderEmail: user.pendingReminderEmail || null,
    customCategories: Array.isArray(user.customCategories) ? user.customCategories : []
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword
    });

    res.status(201).json({
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

exports.getCategories = async (req, res) => {
  res.json({
    categories: [...DEFAULT_CATEGORIES, ...(req.user.customCategories || [])]
  });
};

exports.addCustomCategory = async (req, res) => {
  try {
    const normalizedCategory = normalizeCategoryName(req.body?.category);

    if (!normalizedCategory) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (normalizedCategory.length > 40) {
      return res.status(400).json({ message: "Category must be 40 characters or less" });
    }

    const existing = [...DEFAULT_CATEGORIES, ...(req.user.customCategories || [])].some(
      (item) => item.toLowerCase() === normalizedCategory.toLowerCase()
    );

    if (existing) {
      return res.status(409).json({ message: "This category already exists in your list" });
    }

    req.user.customCategories = [...(req.user.customCategories || []), normalizedCategory];
    await req.user.save();

    res.status(201).json({
      message: "Custom category saved",
      category: normalizedCategory,
      categories: [...DEFAULT_CATEGORIES, ...req.user.customCategories]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.requestReminderEmailOtp = async (req, res) => {
  try {
    const targetEmail =
      typeof req.body?.email === "string" && req.body.email.trim()
        ? req.body.email.trim().toLowerCase()
        : "";

    if (!/.+@.+\..+/.test(targetEmail)) {
      return res.status(400).json({ message: "Enter a valid reminder email address" });
    }

    const otp = generateOtpCode();
    req.user.pendingReminderEmail = targetEmail;
    req.user.reminderOtpHash = hashOtpCode(otp);
    req.user.reminderOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await req.user.save();

    const template = buildReminderVerificationTemplate({
      userName: req.user.name,
      otp,
      targetEmail
    });

    await sendEmail({
      to: targetEmail,
      ...template
    });

    res.json({
      message: `Verification email sent to ${targetEmail}`,
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.verifyReminderEmailOtp = async (req, res) => {
  try {
    const otp = String(req.body?.otp || "").trim();

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    if (!req.user.pendingReminderEmail || !req.user.reminderOtpHash || !req.user.reminderOtpExpiresAt) {
      return res.status(400).json({ message: "Request a verification email first" });
    }

    if (req.user.reminderOtpExpiresAt.getTime() < Date.now()) {
      req.user.reminderOtpHash = null;
      req.user.reminderOtpExpiresAt = null;
      await req.user.save();
      return res.status(400).json({ message: "This OTP has expired. Request a new one." });
    }

    if (hashOtpCode(otp) !== req.user.reminderOtpHash) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    req.user.reminderEmail = req.user.pendingReminderEmail;
    req.user.pendingReminderEmail = null;
    req.user.reminderEmailVerified = true;
    req.user.reminderOtpHash = null;
    req.user.reminderOtpExpiresAt = null;
    await req.user.save();

    const confirmation = buildTestEmailTemplate({
      userName: req.user.name,
      targetEmail: req.user.reminderEmail
    });
    try {
      await sendEmail({ to: req.user.reminderEmail, ...confirmation });
    } catch (_) {}

    res.json({
      message: `Verified. A confirmation email was sent to ${req.user.reminderEmail}.`,
      user: sanitizeUser(req.user)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.sendReminderEmailTest = async (req, res) => {
  try {
    const targetEmail = req.user.reminderEmail;

    if (!targetEmail || !req.user.reminderEmailVerified) {
      return res.status(400).json({ message: "Verify a reminder email first" });
    }

    const template = buildTestEmailTemplate({ userName: req.user.name, targetEmail });
    await sendEmail({
      to: targetEmail,
      ...template
    });

    res.json({
      message: `Branded test email sent to ${targetEmail}`
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
