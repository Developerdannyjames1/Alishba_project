const Expo = require("../models/Expo");
const Booth = require("../models/Booth");
const Session = require("../models/Session");
const { emitToExpo } = require("../socket/socket");

// @desc    Get all expos
// @route   GET /api/expos
// @access  Public
exports.getExpos = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};

    const expos = await Expo.find(query)
      .populate("organizerId", "name email")
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Expo.countDocuments(query);

    res.json({
      success: true,
      expos,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single expo
// @route   GET /api/expos/:id
// @access  Public
exports.getExpo = async (req, res) => {
  try {
    const expo = await Expo.findById(req.params.id)
      .populate("organizerId", "name email")
      .lean();

    if (!expo) {
      return res.status(404).json({ message: "Expo not found" });
    }

    res.json({ success: true, expo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create expo
// @route   POST /api/expos
// @access  Private (admin/organizer)
exports.createExpo = async (req, res) => {
  try {
    const expo = await Expo.create({
      ...req.body,
      organizerId: req.user.id,
    });

    const io = req.app.get("io");
    if (io) io.emit("expos-list-updated");

    res.status(201).json({ success: true, expo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update expo
// @route   PUT /api/expos/:id
// @access  Private (admin/organizer)
exports.updateExpo = async (req, res) => {
  try {
    const expo = await Expo.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!expo) {
      return res.status(404).json({ message: "Expo not found" });
    }

    const io = req.app.get("io");
    if (io) {
      emitToExpo(io, req.params.id, "expo-updated", { expo });
      io.emit("expos-list-updated");
    }

    res.json({ success: true, expo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete expo
// @route   DELETE /api/expos/:id
// @access  Private (admin/organizer)
exports.deleteExpo = async (req, res) => {
  try {
    const expo = await Expo.findByIdAndDelete(req.params.id);

    if (!expo) {
      return res.status(404).json({ message: "Expo not found" });
    }

    await Booth.deleteMany({ expoId: req.params.id });
    await Session.deleteMany({ expoId: req.params.id });

    const io = req.app.get("io");
    if (io) io.emit("expos-list-updated");

    res.json({ success: true, message: "Expo deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
