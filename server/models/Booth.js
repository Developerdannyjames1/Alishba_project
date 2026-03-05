const mongoose = require("mongoose");

const boothSchema = new mongoose.Schema(
  {
    boothNumber: {
      type: String,
      required: [true, "Booth number is required"],
      trim: true,
    },
    expoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expo",
      required: true,
    },
    exhibitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["available", "reserved", "occupied"],
      default: "available",
    },
    size: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "medium",
    },
    price: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    amenities: [String],
    staffInfo: {
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

boothSchema.index({ expoId: 1, boothNumber: 1 }, { unique: true });
boothSchema.index({ exhibitorId: 1 });
boothSchema.index({ status: 1 });

module.exports = mongoose.model("Booth", boothSchema);
