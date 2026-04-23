const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post("/", ctrl.createExpense);
router.get("/statement.pdf", ctrl.exportStatementPdf);
router.post("/test-email", ctrl.testEmail);
router.post("/:id/test-overdue-email", ctrl.testOverdueReminder);
router.get("/filter", ctrl.getFilteredExpenses);
router.get("/", ctrl.getAllExpenses);
router.get("/total", ctrl.getTotal);
router.get("/:id", ctrl.getExpenseById);
router.put("/:id", ctrl.updateExpense);
router.put("/:id/pay", ctrl.markPaid);
router.delete("/:id", ctrl.deleteExpense);

module.exports = router;
