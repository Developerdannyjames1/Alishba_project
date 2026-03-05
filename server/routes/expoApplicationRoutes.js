const express = require("express");
const {
  applyForExpo,
  getMyApplications,
  getExpoApplications,
  getAllPendingApplications,
  approveApplication,
  rejectApplication,
} = require("../controllers/expoApplicationController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post("/:expoId", protect, authorizeRoles("exhibitor"), applyForExpo);
router.get("/my", protect, authorizeRoles("exhibitor"), getMyApplications);
router.get(
  "/all-pending",
  protect,
  authorizeRoles("admin", "organizer"),
  getAllPendingApplications
);
router.get(
  "/expo/:expoId",
  protect,
  authorizeRoles("admin", "organizer"),
  getExpoApplications
);
router.put(
  "/:id/approve",
  protect,
  authorizeRoles("admin", "organizer"),
  approveApplication
);
router.put(
  "/:id/reject",
  protect,
  authorizeRoles("admin", "organizer"),
  rejectApplication
);

module.exports = router;
