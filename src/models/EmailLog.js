import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },

    subject: { type: String, required: true },

    body: { type: String, required: true },

    attachmentPath: { type: String, default: "" },

    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const EmailLog = mongoose.model("EmailLog", emailLogSchema);
export default EmailLog;
