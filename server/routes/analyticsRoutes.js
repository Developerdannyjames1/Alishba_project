const express = require("express");
const { getDashboard } = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/dashboard", protect, authorizeRoles("admin", "organizer"), getDashboard);

module.exports = router;
