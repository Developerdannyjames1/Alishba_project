const User = require("../models/User");
const Booth = require("../models/Booth");
const ExpoApplication = require("../models/ExpoApplication");
const { emitToExpo } = require("../socket/socket");

// @desc    Get pending exhibitors (for admin approval)
// @route   GET /api/exhibitors/pending
// @access  Private (admin)
exports.getPendingExhibitors = async (req, res) => {
  try {
    const exhibitors = await User.find({
      role: "exhibitor",
      isApproved: false,
    }).select("-password");

    res.json({ success: true, exhibitors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending users (exhibitors + organizers) for admin approval
// @route   GET /api/exhibitors/pending-all
// @access  Private (admin)
exports.getPendingAll = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["exhibitor", "organizer"] },
      isApproved: false,
    })
      .select("-password")
      .sort({ role: 1, createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve exhibitor or organizer
// @route   PUT /api/exhibitors/:id/approve
// @access  Private (admin)
exports.approveExhibitor = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== "exhibitor" && user.role !== "organizer") {
      return res.status(400).json({ message: "Only exhibitors and organizers require approval" });
    }

    res.json({ success: true, user, message: `${user.role} approved` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Allocate booth to exhibitor
// @route   PUT /api/exhibitors/booth/:boothId/allocate
// @access  Private (admin/organizer)
exports.allocateBooth = async (req, res) => {
  try {
    const { exhibitorId } = req.body;
    const booth = await Booth.findById(req.params.boothId).populate("expoId");

    if (!booth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    if (booth.status !== "available") {
      return res.status(400).json({ message: "Booth is not available" });
    }

    const expoId = booth.expoId?._id || booth.expoId;
    const existingBooth = await Booth.findOne({
      expoId,
      exhibitorId,
    });
    if (existingBooth) {
      return res.status(400).json({ message: "This exhibitor already has a booth at this expo. Only one booth per exhibitor." });
    }

    booth.exhibitorId = exhibitorId;
    booth.status = "reserved";
    await booth.save();

    const io = req.app.get("io");
    if (io) emitToExpo(io, booth.expoId.toString(), "booths-updated", { booth });

    res.json({ success: true, booth, message: "Booth allocated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Exhibitor reserve booth (self-select)
// @route   PUT /api/exhibitors/booth/:boothId/reserve
// @access  Private (exhibitor)
exports.reserveBooth = async (req, res) => {
  try {
    const booth = await Booth.findById(req.params.boothId).populate("expoId");

    if (!booth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    if (booth.status !== "available") {
      return res.status(400).json({ message: "Booth is not available" });
    }

    const application = await ExpoApplication.findOne({
      exhibitorId: req.user.id,
      expoId: booth.expoId._id,
      status: "approved",
    });

    if (!application) {
      return res.status(403).json({
        message: "You must be approved for this expo before reserving a booth",
      });
    }

    const existingBooth = await Booth.findOne({
      expoId: booth.expoId._id,
      exhibitorId: req.user.id,
    });
    if (existingBooth) {
      return res.status(400).json({ message: "You already have a booth for this expo" });
    }

    booth.exhibitorId = req.user.id;
    booth.status = "reserved";
    await booth.save();

    const expoId = booth.expoId?._id || booth.expoId;
    const io = req.app.get("io");
    if (io) emitToExpo(io, expoId.toString(), "booths-updated", { booth });

    res.json({ success: true, booth, message: "Booth reserved successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Exhibitor update profile
// @route   PUT /api/exhibitors/profile
// @access  Private (exhibitor)
exports.updateProfile = async (req, res) => {
  try {
    const { name, company, phone, description, productsServices, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name && { name }),
        ...(company !== undefined && { company }),
        ...(phone !== undefined && { phone }),
        ...(description !== undefined && { description }),
        ...(productsServices !== undefined && { productsServices }),
        ...(avatar !== undefined && { avatar }),
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user || user.role !== "exhibitor") {
      return res.status(404).json({ message: "Exhibitor not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get exhibitor's booths
// @route   GET /api/exhibitors/my-booths
// @access  Private (exhibitor)
exports.getMyBooths = async (req, res) => {
  try {
    const booths = await Booth.find({ exhibitorId: req.user.id })
      .populate("expoId", "title date location status")
      .sort({ createdAt: -1 });

    res.json({ success: true, booths });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Exhibitor update their booth details
// @route   PUT /api/exhibitors/booth/:boothId/update
// @access  Private (exhibitor)
exports.updateMyBooth = async (req, res) => {
  try {
    const booth = await Booth.findOne({
      _id: req.params.boothId,
      exhibitorId: req.user.id,
    });

    if (!booth) {
      return res.status(404).json({ message: "Booth not found or you do not own this booth" });
    }

    const { description, productsServices, staffInfo } = req.body;
    if (description !== undefined) booth.description = description;
    if (productsServices !== undefined) booth.productsServices = productsServices;
    if (staffInfo !== undefined) booth.staffInfo = staffInfo;
    await booth.save();

    const io = req.app.get("io");
    if (io) emitToExpo(io, booth.expoId.toString(), "booths-updated", { booth });

    res.json({ success: true, booth, message: "Booth updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
