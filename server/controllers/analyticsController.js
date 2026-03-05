const Expo = require("../models/Expo");
const User = require("../models/User");
const Booth = require("../models/Booth");
const Registration = require("../models/Registration");
const Bookmark = require("../models/Bookmark");

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private (admin)
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalExpos,
      totalUsers,
      totalExhibitors,
      totalAttendees,
      totalOrganizers,
      pendingExhibitors,
      pendingOrganizers,
      totalBooths,
      occupiedBooths,
      totalRegistrations,
      totalBookmarks,
    ] = await Promise.all([
      Expo.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ role: "exhibitor", isApproved: true }),
      User.countDocuments({ role: "attendee" }),
      User.countDocuments({ role: "organizer", isApproved: true }),
      User.countDocuments({ role: "exhibitor", isApproved: false }),
      User.countDocuments({ role: "organizer", isApproved: false }),
      Booth.countDocuments(),
      Booth.countDocuments({ status: { $in: ["reserved", "occupied"] } }),
      Registration.countDocuments({ type: "expo", status: "confirmed" }),
      Bookmark.countDocuments(),
    ]);

    const upcomingExpos = await Expo.find({ status: "published", date: { $gte: new Date() } })
      .sort({ date: 1 })
      .limit(5)
      .lean();

    const sessionPopularity = await Registration.aggregate([
      { $match: { type: "session", status: "confirmed" } },
      { $group: { _id: "$sessionId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "sessions",
          localField: "_id",
          foreignField: "_id",
          as: "session",
        },
      },
      { $unwind: "$session" },
      {
        $project: {
          sessionTitle: "$session.title",
          speaker: "$session.speaker",
          registrations: "$count",
        },
      },
    ]);

    const boothTraffic = await Booth.aggregate([
      { $match: { status: { $in: ["reserved", "occupied"] } } },
      { $group: { _id: "$expoId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "expos",
          localField: "_id",
          foreignField: "_id",
          as: "expo",
        },
      },
      { $unwind: "$expo" },
      {
        $project: {
          expoTitle: "$expo.title",
          occupiedBooths: "$count",
        },
      },
    ]);

    res.json({
      success: true,
      analytics: {
        totalExpos,
        totalUsers,
        totalExhibitors,
        totalAttendees,
        totalOrganizers,
        pendingExhibitors,
        pendingOrganizers,
        totalBooths,
        occupiedBooths,
        totalRegistrations,
        totalBookmarks,
        upcomingExpos,
        sessionPopularity,
        boothTraffic,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
