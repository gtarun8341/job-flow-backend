// models/JobEmailStats.js
import mongoose from "mongoose";

const RecruiterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    receivedCount: { type: Number, default: 0 },
    lastReply: { type: String, default: null },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const JobEmailStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true },

  recruiters: {
    type: [RecruiterSchema],
    default: [],
  },

  lastSync: { type: Date, default: null },
});

// Index to speed up lookup
// JobEmailStatsSchema.index({ userId: 1 });

export default mongoose.model("JobEmailStats", JobEmailStatsSchema);
