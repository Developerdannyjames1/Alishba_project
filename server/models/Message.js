const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    expoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expo",
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.index({ toUser: 1, read: 1 });
messageSchema.index({ fromUser: 1 });
messageSchema.index({ expoId: 1 });

module.exports = mongoose.model("Message", messageSchema);
