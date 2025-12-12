import mongoose from "mongoose";

const jobEmailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recruiterEmail: { type: String, required: true },
    company: { type: String, required: false },
    role: { type: String, required: false },
    notes: { type: String },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EmailTemplate",
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: false,
    },

    status: {
      type: String,
      enum: ["sent", "bounced", "failed", "queued", "sending"],
      default: "sent",
    },
  },
  { timestamps: true }
);

export default mongoose.model("JobEmail", jobEmailSchema);
