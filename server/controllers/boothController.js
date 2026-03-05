const Booth = require("../models/Booth");
const { emitToExpo } = require("../socket/socket");

// @desc    Get booths for expo
// @route   GET /api/expos/:expoId/booths
// @access  Public
exports.getBooths = async (req, res) => {
  try {
    const booths = await Booth.find({ expoId: req.params.expoId })
      .populate("exhibitorId", "name company email phone description productsServices avatar")
      .sort({ boothNumber: 1 });

    res.json({ success: true, booths });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create booth
// @route   POST /api/expos/:expoId/booths
// @access  Private (admin/organizer)
exports.createBooth = async (req, res) => {
  try {
    const booth = await Booth.create({
      ...req.body,
      expoId: req.params.expoId,
    });

    res.status(201).json({ success: true, booth });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create multiple booths (floor plan allocation)
// @route   POST /api/expos/:expoId/booths/bulk
// @access  Private (admin/organizer)
exports.createBoothsBulk = async (req, res) => {
  try {
    const { booths } = req.body; // [{ boothNumber, size, price }, ...]
    if (!Array.isArray(booths) || booths.length === 0) {
      return res.status(400).json({ message: "Provide booths array" });
    }

    const toCreate = booths.map((b) => ({
      ...b,
      expoId: req.params.expoId,
    }));
    const created = await Booth.insertMany(toCreate);
    const io = req.app.get("io");
    if (io) emitToExpo(io, req.params.expoId, "booths-updated", { booths: created });

    res.status(201).json({ success: true, booths: created });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booth
// @route   PUT /api/expos/:expoId/booths/:boothId
// @access  Private (admin/organizer)
exports.updateBooth = async (req, res) => {
  try {
    const booth = await Booth.findOneAndUpdate(
      { _id: req.params.boothId, expoId: req.params.expoId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!booth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    const io = req.app.get("io");
    if (io) emitToExpo(io, req.params.expoId, "booths-updated", { booth });

    res.json({ success: true, booth });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete booth
// @route   DELETE /api/expos/:expoId/booths/:boothId
// @access  Private (admin/organizer)
exports.deleteBooth = async (req, res) => {
  try {
    const booth = await Booth.findOneAndDelete({
      _id: req.params.boothId,
      expoId: req.params.expoId,
    });

    if (!booth) {
      return res.status(404).json({ message: "Booth not found" });
    }

    const io = req.app.get("io");
    if (io) emitToExpo(io, req.params.expoId, "booths-updated", { deleted: req.params.boothId });

    res.json({ success: true, message: "Booth deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
