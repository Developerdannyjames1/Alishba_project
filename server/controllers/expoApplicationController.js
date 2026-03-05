const ExpoApplication = require("../models/ExpoApplication");
const User = require("../models/User");

// @desc    Exhibitor apply for expo
// @route   POST /api/applications/:expoId
// @access  Private (exhibitor)
exports.applyForExpo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.isApproved) {
      return res.status(403).json({ message: "Your exhibitor account must be approved first" });
    }

    const existing = await ExpoApplication.findOne({
      exhibitorId: req.user.id,
      expoId: req.params.expoId,
    });
    if (existing) {
      return res.status(400).json({ message: "Already applied for this expo" });
    }

    const { companyName, productsServices, documents } = req.body;
    const application = await ExpoApplication.create({
      exhibitorId: req.user.id,
      expoId: req.params.expoId,
      companyName: companyName || user.company,
      productsServices: productsServices || user.productsServices || "",
      documents: documents || [],
    });

    res.status(201).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my applications (exhibitor)
// @route   GET /api/applications/my
// @access  Private (exhibitor)
exports.getMyApplications = async (req, res) => {
  try {
    const applications = await ExpoApplication.find({ exhibitorId: req.user.id })
      .populate("expoId", "title date location status")
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending expo applications (admin/organizer)
// @route   GET /api/applications/all-pending
// @access  Private (admin/organizer)
exports.getAllPendingApplications = async (req, res) => {
  try {
    const applications = await ExpoApplication.find({ status: "pending" })
      .populate("expoId", "title date location status")
      .populate("exhibitorId", "name email company phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get applications for expo (admin/organizer)
// @route   GET /api/applications/expo/:expoId
// @access  Private (admin/organizer)
exports.getExpoApplications = async (req, res) => {
  try {
    const applications = await ExpoApplication.find({ expoId: req.params.expoId })
      .populate("exhibitorId", "name email company phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve exhibitor application
// @route   PUT /api/applications/:id/approve
// @access  Private (admin/organizer)
exports.approveApplication = async (req, res) => {
  try {
    const application = await ExpoApplication.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    ).populate("exhibitorId expoId");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ success: true, application, message: "Application approved" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject exhibitor application
// @route   PUT /api/applications/:id/reject
// @access  Private (admin/organizer)
exports.rejectApplication = async (req, res) => {
  try {
    const application = await ExpoApplication.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", notes: req.body.notes || "" },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.json({ success: true, application, message: "Application rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
