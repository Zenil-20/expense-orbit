const Expense = require("../models/expense");
const sendEmail = require("../services/emailService");
const {
  buildReminderTemplate,
  buildTestEmailTemplate
} = require("../services/emailTemplates");
const { isAllowedCategory, normalizeCategoryName } = require("../utils/categoryUtils");
const { getNextDueDate } = require("../utils/dateUtils");
const { streamStatementPdf } = require("../services/pdfService");

const ALLOWED_TYPES = ["recurring", "one-time", "flexible"];
const ALLOWED_RECURRING_TYPES = ["daily", "weekly", "monthly", "yearly"];

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isFutureDate(date) {
  return startOfDay(date).getTime() > startOfDay(new Date()).getTime();
}

function getRecurringStatus(nextDueDate, currentStatus = "pending") {
  const due = startOfDay(nextDueDate);
  const today = startOfDay(new Date());

  if (due.getTime() < today.getTime()) {
    return "overdue";
  }

  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) {
    return "pending";
  }

  return currentStatus === "paid" ? "paid" : "pending";
}

function getStatusForPayload({ type, date, nextDueDate, currentStatus }) {
  if (type === "recurring") {
    return getRecurringStatus(nextDueDate, currentStatus);
  }

  if (currentStatus === "paid") {
    return "paid";
  }

  return startOfDay(date).getTime() < startOfDay(new Date()).getTime()
    ? "overdue"
    : "pending";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(amount || 0));
}

function getReminderEmailState(payloadEmail, existingExpense) {
  return {
    email: null,
    reminderEmailVerified: false,
    pendingReminderEmail: null,
    reminderOtpHash: null,
    reminderOtpExpiresAt: null
  };
}

async function ensureNoDuplicateRecurringExpense(userId, payload, excludeId) {
  if (payload.type !== "recurring") {
    return;
  }

  const duplicateFilter = {
    user: userId,
    type: "recurring",
    amount: payload.amount,
    recurringType: payload.recurringType,
    name: { $regex: new RegExp(`^${escapeRegex(payload.name)}$`, "i") }
  };

  if (payload.category) {
    duplicateFilter.category = {
      $regex: new RegExp(`^${escapeRegex(payload.category)}$`, "i")
    };
  }

  if (payload.email) {
    duplicateFilter.email = payload.email;
  }

  if (excludeId) {
    duplicateFilter._id = { $ne: excludeId };
  }

  const existing = await Expense.findOne(duplicateFilter);
  if (existing) {
    throw new Error(
      "A matching recurring expense already exists. Update the existing entry instead of creating a duplicate."
    );
  }
}

function normalizeExpensePayload(payload, existingExpense, user) {
  const normalizedType = payload.type;
  const parsedAmount = Number(payload.amount);
  const normalizedName = typeof payload.name === "string" ? payload.name.trim() : "";
  const normalizedCategory = normalizeCategoryName(payload.category);
  const normalizedDate = payload.date ? new Date(payload.date) : new Date();

  if (!normalizedName) {
    throw new Error("Expense name is required");
  }

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (!ALLOWED_TYPES.includes(normalizedType)) {
    throw new Error("Invalid expense type");
  }

  if (normalizedCategory) {
    if (!isAllowedCategory(normalizedCategory, user?.customCategories || [])) {
      throw new Error("Select a valid category from your personal category list");
    }
  }

  if (Number.isNaN(normalizedDate.getTime())) {
    throw new Error("Invalid expense date");
  }

  if (normalizedType !== "recurring" && isFutureDate(normalizedDate)) {
    throw new Error("One-time and flexible expenses cannot use a future date");
  }

  const normalized = {
    name: normalizedName,
    amount: parsedAmount,
    type: normalizedType,
    category: normalizedCategory || undefined,
    date: normalizedDate
  };

  if (normalizedType === "recurring") {
    if (!payload.recurringType) {
      throw new Error("Recurring frequency is required for recurring expenses");
    }

    if (!ALLOWED_RECURRING_TYPES.includes(payload.recurringType)) {
      throw new Error("Invalid recurring frequency");
    }

    normalized.recurringType = payload.recurringType;
    normalized.nextDueDate =
      existingExpense?.type === "recurring" && existingExpense.nextDueDate
        ? new Date(existingExpense.nextDueDate)
        : normalizedDate;
    Object.assign(normalized, getReminderEmailState(payload.email, existingExpense));
  } else {
    normalized.recurringType = null;
    normalized.nextDueDate = null;
    normalized.email = null;
    normalized.reminderEmailVerified = false;
    normalized.pendingReminderEmail = null;
    normalized.reminderOtpHash = null;
    normalized.reminderOtpExpiresAt = null;
  }

  normalized.status = getStatusForPayload({
    type: normalized.type,
    date: normalized.date,
    nextDueDate: normalized.nextDueDate,
    currentStatus: existingExpense?.status
  });

  return normalized;
}

//create
exports.createExpense = async (req, res) => {
    try {
        const normalized = normalizeExpensePayload(req.body, null, req.user);
        await ensureNoDuplicateRecurringExpense(req.user._id, normalized);

        const expense = new Expense({
            user: req.user._id,
            ...normalized
        });

        await expense.save();
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

//getall
exports.getAllExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getExpenseById = async (req, res) => {
    try {
        const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

        if (!expense) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// UPDATE (including due date editable)
exports.updateExpense = async (req, res) => {
  try {
    const existingExpense = await Expense.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const mergedPayload = {
      name: req.body.name ?? existingExpense.name,
      amount: req.body.amount ?? existingExpense.amount,
      type: req.body.type ?? existingExpense.type,
      recurringType: req.body.recurringType ?? existingExpense.recurringType,
      category: req.body.category ?? existingExpense.category,
      date: req.body.date ?? existingExpense.date,
      email: null
    };

    const updatePayload = normalizeExpensePayload(mergedPayload, existingExpense, req.user);
    await ensureNoDuplicateRecurringExpense(req.user._id, updatePayload, existingExpense._id);

    const exp = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updatePayload,
      { new: true, runValidators: true }
    );

    res.json(exp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// MARK PAID
exports.markPaid = async (req, res) => {
  try {
    const exp = await Expense.findOne({ _id: req.params.id, user: req.user._id });

    if (!exp) return res.status(404).json({ msg: "Not found" });

    if (exp.type === "recurring") {
      if (!exp.recurringType || !exp.nextDueDate) {
        return res.status(400).json({ message: "Recurring expense is missing schedule data" });
      }

      exp.nextDueDate = getNextDueDate(exp.nextDueDate, exp.recurringType);
      exp.status = getRecurringStatus(exp.nextDueDate, "paid");
    } else {
      if (exp.status === "paid") {
        return res.status(400).json({ message: "Expense is already marked as paid" });
      }

      exp.status = "paid";
    }

    await exp.save();
    res.json(exp);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE
exports.deleteExpense = async (req, res) => {
  try {
    const exp = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!exp) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ msg: "Deleted" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// TOTAL (IMPORTANT)
exports.getTotal = async (req, res) => {
  try {
    const { type, category } = req.query;

    let filter = { user: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;

    const expenses = await Expense.find(filter);

    const total = expenses.reduce(
      (sum, e) => sum + e.amount,
      0
    );

    res.json({ total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.exportStatementPdf = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user._id }).sort({ createdAt: -1 });
    streamStatementPdf(res, { user: req.user, expenses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.testEmail = async (req, res) => {
  try {
    const { to } = req.body;
    const targetEmail = to || req.user.email;

    if (!targetEmail) {
      return res.status(400).json({ message: "Target email is required" });
    }

    if (!/.+@.+\..+/.test(targetEmail)) {
      return res.status(400).json({ message: "Enter a valid target email address" });
    }

    const template = buildTestEmailTemplate({ userName: req.user.name });

    await sendEmail({
      to: targetEmail,
      ...template
    });

    res.json({ message: `Test email sent successfully to ${targetEmail}` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.testOverdueReminder = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    if (expense.type !== "recurring") {
      return res.status(400).json({ message: "Only recurring expenses can send due reminders" });
    }

    if (!req.user.reminderEmail || !req.user.reminderEmailVerified) {
      return res.status(400).json({ message: "Verify your reminder email in settings before testing overdue reminders" });
    }

    const reminder = buildReminderTemplate({
      userName: req.user.name,
      expenseName: expense.name,
      amount: formatCurrency(expense.amount),
      dueLabel: "overdue now",
      frequency: expense.recurringType,
      status: "overdue",
      category: expense.category
    });

    await sendEmail({
      to: req.user.reminderEmail,
      ...reminder
    });

    res.json({
      message: `Overdue reminder test sent to ${req.user.reminderEmail}`,
      template: {
        subject: reminder.subject,
        preview: reminder.text
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// SUPPORT FOR CUSTOM FILTER APPLIED ON GET ALL EXPENSES WITH MONTHLY, YEARLY, WEEKLY, DAILY
exports.getFilteredExpenses = async (req, res) => {
  try {
    const { filter, startDate, endDate, page = 1, limit = 50 } = req.query;

    // 🔴 Validate filter
    if (!filter) {
      return res.status(400).json({ message: "filter is required" });
    }

    let dateFilter = {}; // ✅ always initialize
    const today = new Date();

    // 🔹 MONTHLY
    if (filter === "monthly") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);

      dateFilter = { date: { $gte: start, $lte: end } };

    // 🔹 YEARLY
    } else if (filter === "yearly") {
      const start = new Date(today.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);

      const end = new Date(today.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);

      dateFilter = { date: { $gte: start, $lte: end } };

    // 🔹 WEEKLY (Sunday → Saturday)
    } else if (filter === "weekly") {
      const temp = new Date(today);
      const firstDayOfWeek = new Date(temp.setDate(temp.getDate() - temp.getDay()));
      firstDayOfWeek.setHours(0, 0, 0, 0);

      const temp2 = new Date(firstDayOfWeek);
      const lastDayOfWeek = new Date(temp2.setDate(temp2.getDate() + 6));
      lastDayOfWeek.setHours(23, 59, 59, 999);

      dateFilter = { date: { $gte: firstDayOfWeek, $lte: lastDayOfWeek } };

    // 🔹 DAILY
    } else if (filter === "daily") {
      const start = new Date(today);
      start.setHours(0, 0, 0, 0);

      const end = new Date(today);
      end.setHours(23, 59, 59, 999);

      dateFilter = { date: { $gte: start, $lte: end } };

    // 🔹 CUSTOM RANGE
    } else if (filter === "custom") {
      if (!startDate || !endDate) {
        return res.status(400).json({
          message: "Start date and end date are required",
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({
          message: "Invalid date format",
        });
      }

      if (start > end) {
        return res.status(400).json({
          message: "Start date cannot be after end date",
        });
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      dateFilter = { date: { $gte: start, $lte: end } };

    // 🔴 INVALID FILTER
    } else {
      return res.status(400).json({
        message: "Invalid filter type (daily, weekly, monthly, yearly, custom)",
      });
    }

    // 🔹 PAGINATION
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    // 🔹 USER SAFETY (important if auth middleware fails)
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    // 🔹 FETCH DATA + COUNT
    const [expenses, total] = await Promise.all([
      Expense.find({ ...dateFilter, user: req.user._id })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      Expense.countDocuments({ ...dateFilter, user: req.user._id }),
    ]);

    // 🔹 RESPONSE (ONLY ONE RESPONSE)
    return res.status(200).json({
      page: pageNum,
      limit: limitNum,
      count: expenses.length,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limitNum),
      data: expenses,
    });

  } catch (error) {
    console.error("Error in getFilteredExpenses:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
};