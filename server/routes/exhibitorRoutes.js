const express = require("express");
const {
  getPendingExhibitors,
  getPendingAll,
  approveExhibitor,
  allocateBooth,
  reserveBooth,
  updateProfile,
  getMyBooths,
  updateMyBooth,
} = require("../controllers/exhibitorController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/pending", protect, authorizeRoles("admin", "organizer"), getPendingExhibitors);
router.get("/pending-all", protect, authorizeRoles("admin", "organizer"), getPendingAll);
router.put("/:id/approve", protect, authorizeRoles("admin", "organizer"), approveExhibitor);
router.put(
  "/booth/:boothId/allocate",
  protect,
  authorizeRoles("admin", "organizer"),
  allocateBooth
);
router.put(
  "/booth/:boothId/reserve",
  protect,
  authorizeRoles("exhibitor"),
  reserveBooth
);
router.put("/profile", protect, authorizeRoles("exhibitor"), updateProfile);
router.get("/my-booths", protect, authorizeRoles("exhibitor"), getMyBooths);
router.put(
  "/booth/:boothId/update",
  protect,
  authorizeRoles("exhibitor"),
  updateMyBooth
);

module.exports = router;
