const express = require("express");
const {
  getExpos,
  getExpo,
  createExpo,
  updateExpo,
  deleteExpo,
} = require("../controllers/expoController");
const {
  getBooths,
  createBooth,
  createBoothsBulk,
  updateBooth,
  deleteBooth,
} = require("../controllers/boothController");
const {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
} = require("../controllers/sessionController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.route("/").get(getExpos).post(protect, authorizeRoles("admin", "organizer"), createExpo);
router
  .route("/:id")
  .get(getExpo)
  .put(protect, authorizeRoles("admin", "organizer"), updateExpo)
  .delete(protect, authorizeRoles("admin", "organizer"), deleteExpo);

router
  .route("/:expoId/booths")
  .get(getBooths)
  .post(protect, authorizeRoles("admin", "organizer"), createBooth);

router.post(
  "/:expoId/booths/bulk",
  protect,
  authorizeRoles("admin", "organizer"),
  createBoothsBulk
);

router
  .route("/:expoId/booths/:boothId")
  .put(protect, authorizeRoles("admin", "organizer"), updateBooth)
  .delete(protect, authorizeRoles("admin", "organizer"), deleteBooth);

router
  .route("/:expoId/sessions")
  .get(getSessions)
  .post(protect, authorizeRoles("admin", "organizer"), createSession);

router
  .route("/:expoId/sessions/:sessionId")
  .put(protect, authorizeRoles("admin", "organizer"), updateSession)
  .delete(protect, authorizeRoles("admin", "organizer"), deleteSession);

module.exports = router;
