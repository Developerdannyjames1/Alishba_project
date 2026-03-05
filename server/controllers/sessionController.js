const Session = require("../models/Session");
const { emitToExpo } = require("../socket/socket");

// @desc    Get sessions for expo
// @route   GET /api/expos/:expoId/sessions
// @access  Public
exports.getSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ expoId: req.params.expoId }).sort({
      timeSlot: 1,
    });

    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create session
// @route   POST /api/expos/:expoId/sessions
// @access  Private (admin/organizer)
exports.createSession = async (req, res) => {
  try {
    const session = await Session.create({
      ...req.body,
      expoId: req.params.expoId,
    });

    const io = req.app.get("io");
    if (io) emitToExpo(io, req.params.expoId, "sessions-updated", { session });

    res.status(201).json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update session
// @route   PUT /api/expos/:expoId/sessions/:sessionId
// @access  Private (admin/organizer)
exports.updateSession = async (req, res) => {
  try {
    const session = await Session.findOneAndUpdate(
      { _id: req.params.sessionId, expoId: req.params.expoId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const io = req.app.get("io");
    if (io) emitToExpo(io, req.params.expoId, "sessions-updated", { session });

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete session
// @route   DELETE /api/expos/:expoId/sessions/:sessionId
// @access  Private (admin/organizer)
exports.deleteSession = async (req, res) => {
  try {
    const session = await Session.findOneAndDelete({
      _id: req.params.sessionId,
      expoId: req.params.expoId,
    });

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const io = req.app.get("io");
    if (io) emitToExpo(io, req.params.expoId, "sessions-updated", { deleted: req.params.sessionId });

    res.json({ success: true, message: "Session deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
