import mongoose from "mongoose";
import crypto from "crypto";

const DesktopTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  token: {
    type: String,
    unique: true,
    index: true,
    required: true,
  },

  createdAt: { type: Date, default: Date.now },
});

DesktopTokenSchema.statics.generate = function (userId) {
  const token = crypto.randomBytes(32).toString("hex");
  return this.create({ userId, token });
};

export default mongoose.model("DesktopToken", DesktopTokenSchema);
