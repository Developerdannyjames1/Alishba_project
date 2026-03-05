const Message = require("../models/Message");
const Expo = require("../models/Expo");
const Booth = require("../models/Booth");
const User = require("../models/User");

// @desc    Send message to user (organizer or exhibitor)
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { toUserId, expoId, subject, message } = req.body;
    if (!toUserId || !message) {
      return res.status(400).json({ message: "Recipient and message are required" });
    }
    const msg = await Message.create({
      fromUser: req.user.id,
      toUser: toUserId,
      expoId: expoId || undefined,
      subject: subject || "",
      message,
    });
    const populated = await Message.findById(msg._id)
      .populate("fromUser", "name email company")
      .populate("toUser", "name email company");

    const io = req.app.get("io");
    if (io) {
      const { emitToUser } = require("../socket/socket");
      emitToUser(io, toUserId, "new-message", { message: populated });
    }

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get expo organizer for contact
// @route   GET /api/messages/expo/:expoId/organizer
// @access  Private
exports.getExpoOrganizer = async (req, res) => {
  try {
    const expo = await Expo.findById(req.params.expoId)
      .populate("organizerId", "name email")
      .lean();
    if (!expo) return res.status(404).json({ message: "Expo not found" });
    const organizer = expo.organizerId;
    if (!organizer) {
      return res.status(404).json({ message: "No organizer assigned to this expo" });
    }
    res.json({ success: true, organizer: { _id: organizer._id, name: organizer.name, email: organizer.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get exhibitors at same expo (for collaboration)
// @route   GET /api/messages/expo/:expoId/exhibitors
// @access  Private (exhibitor with booth at this expo)
exports.getExpoExhibitors = async (req, res) => {
  try {
    const myBooth = await Booth.findOne({ expoId: req.params.expoId, exhibitorId: req.user.id });
    if (!myBooth) {
      return res.status(403).json({ message: "You must have a booth at this expo to view other exhibitors" });
    }
    const booths = await Booth.find({
      expoId: req.params.expoId,
      exhibitorId: { $ne: null, $ne: req.user.id },
    })
      .populate("exhibitorId", "name email company phone boothNumber")
      .lean();
    const exhibitors = booths
      .filter((b) => b.exhibitorId)
      .map((b) => ({
        _id: b.exhibitorId._id,
        name: b.exhibitorId.name,
        email: b.exhibitorId.email,
        company: b.exhibitorId.company,
        phone: b.exhibitorId.phone,
        boothNumber: b.boothNumber,
      }));
    res.json({ success: true, exhibitors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my messages (inbox)
// @route   GET /api/messages/inbox
// @access  Private
exports.getInbox = async (req, res) => {
  try {
    const messages = await Message.find({ toUser: req.user.id })
      .populate("fromUser", "name email company")
      .populate("toUser", "name email company")
      .populate("expoId", "title")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my sent messages
// @route   GET /api/messages/sent
// @access  Private
exports.getSent = async (req, res) => {
  try {
    const messages = await Message.find({ fromUser: req.user.id })
      .populate("toUser", "name email company")
      .populate("expoId", "title")
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get messageable contacts (exhibitors, attendees, organizers)
// @route   GET /api/messages/contacts
// @access  Private (all authenticated users)
exports.getContacts = async (req, res) => {
  try {
    const query = {
      _id: { $ne: req.user.id },
      $or: [
        { role: "attendee" },
        { role: "organizer" },
        { role: "exhibitor", isApproved: true },
      ],
    };
    const users = await User.find(query)
      .select("name email company role avatar")
      .sort({ name: 1 })
      .lean();
    res.json({ success: true, contacts: users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markRead = async (req, res) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, toUser: req.user.id },
      { read: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: "Message not found" });
    res.json({ success: true, message: msg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
