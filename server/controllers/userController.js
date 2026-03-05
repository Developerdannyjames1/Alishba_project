const User = require("../models/User");

// @desc    Get all users (admin only) - filter by role
// @route   GET /api/users?role=exhibitor
// @access  Private (admin)
exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const query =
      role && role !== "all"
        ? { role }
        : { role: { $in: ["exhibitor", "attendee", "organizer"] } };

    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (admin)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user (admin only)
// @route   PUT /api/users/:id
// @access  Private (admin)
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, company, phone, isApproved, description, productsServices } =
      req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email !== undefined && email !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email.toLowerCase();
    if (role !== undefined) updateData.role = role;
    if (company !== undefined) updateData.company = company;
    if (phone !== undefined) updateData.phone = phone;
    if (isApproved !== undefined) updateData.isApproved = isApproved;
    if (description !== undefined) updateData.description = description;
    if (productsServices !== undefined) updateData.productsServices = productsServices;

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({ success: true, user: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
