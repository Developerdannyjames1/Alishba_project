const express = require("express");
const {
  registerForExpo,
  bookSession,
  getMyRegistrations,
} = require("../controllers/attendeeController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/register/expo/:expoId", registerForExpo);
router.post("/register/session/:sessionId", bookSession);
router.get("/registrations", getMyRegistrations);

module.exports = router;
