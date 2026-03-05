const express = require("express");
const { getUsers, getUser, updateUser } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin", "organizer"));

router.get("/", getUsers);
router.get("/:id", getUser);
router.put("/:id", updateUser);

module.exports = router;
