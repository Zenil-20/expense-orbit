const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set in .env");
  }

  if (!to || !subject || (!text && !html)) {
    throw new Error("to, subject, and either text or html are required to send an email");
  }

  return transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || "Expense Orbit"}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    attachments
  });
};

module.exports = sendEmail;
