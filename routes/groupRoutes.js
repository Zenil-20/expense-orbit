const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/groupController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", ctrl.listGroups);
router.post("/", ctrl.createGroup);
router.get("/:id", ctrl.getGroup);
router.post("/:id/members", ctrl.addMembers);
router.post("/:id/settle", ctrl.settleUp);
router.post("/:id/settlements/:sid/mark-paid", ctrl.markSettlementPaid);

module.exports = router;
