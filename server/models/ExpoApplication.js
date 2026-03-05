const mongoose = require("mongoose");

const expoApplicationSchema = new mongoose.Schema(
  {
    exhibitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expo",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
      trim: true,
    },
    productsServices: {
      type: String,
      default: "",
    },
    documents: [
      {
        url: String,
        name: String,
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

expoApplicationSchema.index({ exhibitorId: 1, expoId: 1 }, { unique: true });
expoApplicationSchema.index({ expoId: 1, status: 1 });

module.exports = mongoose.model("ExpoApplication", expoApplicationSchema);
