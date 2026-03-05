const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "organizer", "exhibitor", "attendee"],
      default: "attendee",
    },
    company: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    productsServices: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
