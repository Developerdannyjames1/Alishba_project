const Registration = require("../models/Registration");
const Session = require("../models/Session");

// @desc    Register for expo
// @route   POST /api/attendees/register/expo/:expoId
// @access  Private
exports.registerForExpo = async (req, res) => {
  try {
    const existing = await Registration.findOne({
      userId: req.user.id,
      expoId: req.params.expoId,
      type: "expo",
    });

    if (existing) {
      return res.status(400).json({ message: "Already registered for this expo" });
    }

    const registration = await Registration.create({
      userId: req.user.id,
      expoId: req.params.expoId,
      type: "expo",
    });

    res.status(201).json({ success: true, registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Book session
// @route   POST /api/attendees/register/session/:sessionId
// @access  Private
exports.bookSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const existing = await Registration.findOne({
      userId: req.user.id,
      sessionId: req.params.sessionId,
      type: "session",
    });

    if (existing) {
      return res.status(400).json({ message: "Already booked this session" });
    }

    const count = await Registration.countDocuments({
      sessionId: req.params.sessionId,
      type: "session",
      status: { $ne: "cancelled" },
    });

    if (count >= session.maxAttendees) {
      return res.status(400).json({ message: "Session is full" });
    }

    const registration = await Registration.create({
      userId: req.user.id,
      expoId: session.expoId,
      sessionId: req.params.sessionId,
      type: "session",
    });

    res.status(201).json({ success: true, registration });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my registrations
// @route   GET /api/attendees/registrations
// @access  Private
exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ userId: req.user.id })
      .populate("expoId", "title date location")
      .populate("sessionId", "title speaker timeSlot")
      .sort({ createdAt: -1 });

    res.json({ success: true, registrations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
