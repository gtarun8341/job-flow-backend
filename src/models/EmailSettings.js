import mongoose from "mongoose";

const emailSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    email: { type: String, required: true },

    smtpHost: { type: String, required: true },
    smtpPort: { type: Number, required: true },
    smtpUsername: { type: String, required: true },
    smtpPassword: { type: String, required: true },

    imapHost: { type: String, required: true },
    imapPort: { type: Number, required: true },
    imapUsername: { type: String, required: true },
    imapPassword: { type: String, required: true },

    autoSyncEnabled: { type: Boolean, default: false },
    autoSyncInterval: { type: Number, default: 15 },

    isConnected: { type: Boolean, default: false },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

const EmailSettings = mongoose.model("EmailSettings", emailSettingsSchema);
export default EmailSettings;
