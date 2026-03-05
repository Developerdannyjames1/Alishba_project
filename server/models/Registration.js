const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expo",
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
    },
    type: {
      type: String,
      enum: ["expo", "session"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "attended"],
      default: "confirmed",
    },
    checkInAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

registrationSchema.index({ userId: 1, expoId: 1, sessionId: 1 }, { unique: true });
registrationSchema.index({ expoId: 1 });
registrationSchema.index({ sessionId: 1 });

module.exports = mongoose.model("Registration", registrationSchema);
