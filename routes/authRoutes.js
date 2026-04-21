const express = require("express");
const {
  addCustomCategory,
  getCategories,
  getMe,
  login,
  requestReminderEmailOtp,
  sendReminderEmailTest,
  register
  ,
  verifyReminderEmailOtp
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", protect, getMe);
router.get("/categories", protect, getCategories);
router.post("/categories", protect, addCustomCategory);
router.post("/reminder-email/request-otp", protect, requestReminderEmailOtp);
router.post("/reminder-email/verify-otp", protect, verifyReminderEmailOtp);
router.post("/reminder-email/test", protect, sendReminderEmailTest);

module.exports = router;
