const Bookmark = require("../models/Bookmark");
const Session = require("../models/Session");

// @desc    Bookmark session
// @route   POST /api/bookmarks/session/:sessionId
// @access  Private (attendee)
exports.bookmarkSession = async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const existing = await Bookmark.findOne({
      userId: req.user.id,
      sessionId: req.params.sessionId,
    });
    if (existing) {
      return res.status(400).json({ message: "Already bookmarked" });
    }

    const bookmark = await Bookmark.create({
      userId: req.user.id,
      sessionId: req.params.sessionId,
    });

    res.status(201).json({ success: true, bookmark });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove bookmark
// @route   DELETE /api/bookmarks/session/:sessionId
// @access  Private (attendee)
exports.removeBookmark = async (req, res) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({
      userId: req.user.id,
      sessionId: req.params.sessionId,
    });

    if (!bookmark) {
      return res.status(404).json({ message: "Bookmark not found" });
    }

    res.json({ success: true, message: "Bookmark removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my bookmarks
// @route   GET /api/bookmarks
// @access  Private (attendee)
exports.getMyBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ userId: req.user.id })
      .populate({
        path: "sessionId",
        populate: { path: "expoId", select: "title date location" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookmarks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
