const express = require("express");
const {
  sendMessage,
  getExpoOrganizer,
  getExpoExhibitors,
  getInbox,
  getSent,
  markRead,
  getContacts,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);

router.post("/", sendMessage);
router.get("/contacts", getContacts);
router.get("/inbox", getInbox);
router.get("/sent", getSent);
router.put("/:id/read", markRead);
router.get("/expo/:expoId/organizer", getExpoOrganizer);
router.get(
  "/expo/:expoId/exhibitors",
  authorizeRoles("exhibitor"),
  getExpoExhibitors
);

module.exports = router;
