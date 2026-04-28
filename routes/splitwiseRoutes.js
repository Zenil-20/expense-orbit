const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/splitwiseController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', ctrl.listMySplitwise);
router.post('/equal', ctrl.createEqualSplitExpense);
router.post('/unequal', ctrl.createUnequalSplitExpense);

module.exports = router;
