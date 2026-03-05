const express = require("express");
const {
  bookmarkSession,
  removeBookmark,
  getMyBookmarks,
} = require("../controllers/bookmarkController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("attendee"));

router.get("/", getMyBookmarks);
router.post("/session/:sessionId", bookmarkSession);
router.delete("/session/:sessionId", removeBookmark);

module.exports = router;
