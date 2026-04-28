const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/friendController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", ctrl.list);
router.post("/invite", ctrl.invite);
router.post("/:id/accept", ctrl.accept);
router.post("/:id/decline", ctrl.decline);
router.delete("/:id", ctrl.remove);

module.exports = router;
