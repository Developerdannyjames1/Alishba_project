const express = require("express");
const { submitFeedback, submitSessionFeedback, getFeedback } = require("../controllers/feedbackController");
const { protect, optionalProtect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/", optionalProtect, submitFeedback);
router.post("/session", protect, authorizeRoles("attendee"), submitSessionFeedback);
router.get("/", protect, authorizeRoles("admin", "organizer"), getFeedback);

module.exports = router;
