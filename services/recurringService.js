const Expense = require('../models/expense');
const sendEmail = require('./emailService');
const { buildReminderTemplate } = require("./emailTemplates");

const processExpenses = async () => {
  const today = new Date();

  const expenses = await Expense.find({
    type: "recurring"
  }).populate("user", "name email reminderEmail reminderEmailVerified");

  for (let exp of expenses) {
    if (!exp.nextDueDate || !exp.user?.reminderEmail || !exp.user?.reminderEmailVerified) continue;

    const dueDate = new Date(exp.nextDueDate);

    const diffDays = Math.ceil(
      (dueDate - today) / (1000 * 60 * 60 * 24)
    );

    // 1 day before
    if (diffDays === 1) {
      exp.status = "pending";

      const reminder = buildReminderTemplate({
        userName: exp.user?.name,
        expenseName: exp.name,
        amount: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0
        }).format(exp.amount || 0),
        dueLabel: "tomorrow",
        frequency: exp.recurringType,
        status: "upcoming",
        category: exp.category
      });

      await sendEmail({
        to: exp.user.reminderEmail,
        ...reminder
      });
    }

    // same day
    if (diffDays === 0) {
      exp.status = "pending";

      const reminder = buildReminderTemplate({
        userName: exp.user?.name,
        expenseName: exp.name,
        amount: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0
        }).format(exp.amount || 0),
        dueLabel: "today",
        frequency: exp.recurringType,
        status: "today",
        category: exp.category
      });

      await sendEmail({
        to: exp.user.reminderEmail,
        ...reminder
      });
    }

    // overdue
    if (diffDays < 0) {
      exp.status = "overdue";

      const reminder = buildReminderTemplate({
        userName: exp.user?.name,
        expenseName: exp.name,
        amount: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0
        }).format(exp.amount || 0),
        dueLabel: "overdue now",
        frequency: exp.recurringType,
        status: "overdue",
        category: exp.category
      });

      await sendEmail({
        to: exp.user.reminderEmail,
        ...reminder
      });
    } else if (diffDays > 1 && exp.status === "overdue") {
      exp.status = "pending";
    }

    await exp.save();
  }

  console.log("Cron processed");
};

module.exports = { processExpenses };
