const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Session title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    speaker: {
      type: String,
      required: [true, "Speaker name is required"],
      trim: true,
    },
    speakerBio: {
      type: String,
      default: "",
    },
    expoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expo",
      required: true,
    },
    timeSlot: {
      type: Date,
      required: [true, "Time slot is required"],
    },
    duration: {
      type: Number,
      default: 60,
    },
    location: {
      type: String,
      trim: true,
    },
    maxAttendees: {
      type: Number,
      default: 100,
    },
    type: {
      type: String,
      enum: ["keynote", "workshop", "panel", "networking"],
      default: "keynote",
    },
  },
  { timestamps: true }
);

sessionSchema.index({ expoId: 1 });
sessionSchema.index({ timeSlot: 1 });

module.exports = mongoose.model("Session", sessionSchema);
