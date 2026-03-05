const mongoose = require("mongoose");

const expoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Expo title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Expo date is required"],
    },
    endDate: {
      type: Date,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    theme: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["draft", "published", "ongoing", "completed", "cancelled"],
      default: "draft",
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    maxBooths: {
      type: Number,
      default: 50,
    },
    maxAttendees: {
      type: Number,
      default: 1000,
    },
  },
  { timestamps: true }
);

expoSchema.index({ date: 1 });
expoSchema.index({ status: 1 });
expoSchema.index({ organizerId: 1 });

module.exports = mongoose.model("Expo", expoSchema);
