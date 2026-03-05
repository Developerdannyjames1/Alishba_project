require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const existing = await User.findOne({ email: "admin@expo.com" });
    if (existing) {
      console.log("Admin already exists");
      process.exit(0);
      return;
    }
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "Admin",
      email: "admin@expo.com",
      password: hashedPassword,
      role: "admin",
      isApproved: true,
    });
    console.log("Admin created: admin@expo.com / admin123");
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
};

seedAdmin();
