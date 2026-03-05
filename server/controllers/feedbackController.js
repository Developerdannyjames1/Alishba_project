const Feedback = require("../models/Feedback");
const Registration = require("../models/Registration");

// @desc    Submit feedback
// @route   POST /api/feedback
// @access  Public (optional auth)
exports.submitFeedback = async (req, res) => {
  try {
    const { type, subject, message, email } = req.body;
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }
    const userEmail = email || req.user?.email;
    if (!req.user && !userEmail) {
      return res.status(400).json({ message: "Email is required when not logged in" });
    }

    const feedback = await Feedback.create({
      userId: req.user?.id,
      email: userEmail,
      type: type || "general",
      subject: subject || "",
      message,
    });

    res.status(201).json({ success: true, feedback, message: "Thank you for your feedback" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit session feedback (attendees only, for sessions they attended)
// @route   POST /api/feedback/session
// @access  Private (attendee)
exports.submitSessionFeedback = async (req, res) => {
  try {
    if (req.user.role !== "attendee") {
      return res.status(403).json({ message: "Only attendees can submit session feedback" });
    }
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
      return res.status(400).json({ message: "Session and message are required" });
    }
    const registration = await Registration.findOne({
      userId: req.user.id,
      sessionId,
      type: "session",
      status: { $ne: "cancelled" },
    });
    if (!registration) {
      return res.status(403).json({ message: "You can only give feedback for sessions you have attended" });
    }

    const feedback = await Feedback.create({
      userId: req.user.id,
      type: "session",
      sessionId,
      subject: "Session feedback",
      message,
    });

    res.status(201).json({ success: true, feedback, message: "Thank you for your session feedback" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all feedback (admin)
// @route   GET /api/feedback
// @access  Private (admin)
exports.getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("userId", "name email")
      .populate("sessionId", "title speaker")
      .sort({ createdAt: -1 });

    res.json({ success: true, feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
