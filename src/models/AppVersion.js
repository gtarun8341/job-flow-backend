import mongoose from "mongoose";

const appVersionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    platform: {
      type: String,
      enum: ["windows", "android"],
      required: true,
      index: true,
    },

    version: {
      type: String,
      required: true,
    },

    fileUrl: {
      type: String,
      required: true,
    },

    fileSize: {
      type: String,
      required: true,
    },

    patchNotes: String,

    changelog: [String],

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// 🚨 Prevent duplicate version per platform
appVersionSchema.index({ platform: 1, version: 1 }, { unique: true });

// ✅ Only one default per platform
appVersionSchema.index(
  { platform: 1, isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

export default mongoose.model("AppVersion", appVersionSchema);
